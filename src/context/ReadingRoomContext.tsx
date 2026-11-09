import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  RRStudent,
  RRSeat,
  RRPlan,
  RRPayment,
  RRAttendance,
  ReadingRoomMetrics,
  ShiftType,
} from '../types/readingRoom';
import {
  firestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  sanitizeForFirestore,
} from '../services/firebase';
import { useTenant } from './TenantContext';

interface RegisterStudentInput {
  name: string;
  mobile: string;
  email?: string;
  address: string;
  fatherOrGuardianName?: string;
  bloodGroup?: string;
  shift: ShiftType;
  joiningDate: string;
  planId: string;
  allottedSeatId?: string;
  photoUrl?: string;
  emergencyContact?: string;
  notes?: string;
  initialPayment?: {
    amount: number;
    paymentMethod: 'CASH' | 'UPI' | 'ONLINE' | 'CARD';
    discount?: number;
  };
}

interface ReadingRoomContextType {
  students: RRStudent[];
  seats: RRSeat[];
  plans: RRPlan[];
  payments: RRPayment[];
  attendance: RRAttendance[];
  metrics: ReadingRoomMetrics;
  isLoading: boolean;

  // Student Actions
  registerStudent: (data: RegisterStudentInput) => Promise<{ success: boolean; student?: RRStudent; receipt?: RRPayment; error?: string }>;
  updateStudent: (id: string, updates: Partial<RRStudent>) => Promise<{ success: boolean; error?: string }>;
  deactivateStudent: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Seat Actions
  allotSeat: (seatId: string, studentId: string) => Promise<{ success: boolean; error?: string }>;
  vacateSeat: (seatId: string) => Promise<{ success: boolean; error?: string }>;
  setSeatStatus: (seatId: string, status: RRSeat['status']) => Promise<{ success: boolean; error?: string }>;
  addSeat: (seatData: Omit<RRSeat, 'id'>) => Promise<{ success: boolean; error?: string }>;

  // Plan Actions
  savePlan: (plan: Omit<RRPlan, 'id'> & { id?: string }) => Promise<{ success: boolean; error?: string }>;
  togglePlanStatus: (planId: string) => Promise<{ success: boolean; error?: string }>;

  // Fee & Receipt Actions
  collectFee: (params: {
    studentId: string;
    amount: number;
    paymentMethod: 'CASH' | 'UPI' | 'ONLINE' | 'CARD';
    discount?: number;
    planId?: string;
    notes?: string;
  }) => Promise<{ success: boolean; receipt?: RRPayment; error?: string }>;

  // Attendance Actions
  checkInStudent: (studentId: string) => Promise<{ success: boolean; error?: string }>;
  checkOutStudent: (studentId: string) => Promise<{ success: boolean; error?: string }>;
  markAttendance: (record: Omit<RRAttendance, 'id'>) => Promise<{ success: boolean; error?: string }>;

  // Helper
  generateNextReceiptNumber: () => string;
}

const ReadingRoomContext = createContext<ReadingRoomContextType | undefined>(undefined);

// Initial default membership plans
const DEFAULT_PLANS: RRPlan[] = [
  {
    id: 'plan_daily',
    name: 'Daily Pass',
    planType: 'daily',
    durationDays: 1,
    fee: 60,
    description: 'Single day access to desk, high-speed WiFi and silent study hall.',
    features: ['High-speed WiFi', 'Reserved Desk for 1 Day', 'Power Socket & Lamp', 'RO Water'],
    isActive: true,
  },
  {
    id: 'plan_monthly',
    name: 'Monthly Regular',
    planType: 'monthly',
    durationDays: 30,
    fee: 900,
    description: 'Most popular! 30-day fixed seat allocation with locker access.',
    features: ['Fixed Dedicated Seat', 'Daily Locker Access', 'High-Speed WiFi', 'AC Hall', 'RO Water & Tea/Coffee'],
    isActive: true,
  },
  {
    id: 'plan_quarterly',
    name: 'Quarterly Scholar',
    planType: 'quarterly',
    durationDays: 90,
    fee: 2400,
    description: 'Quarterly package with discounted monthly fee and priority locker.',
    features: ['Dedicated Fixed Seat', 'Personal Locker Included', 'Priority Booking', '24/7 Power Backup', 'Tea & Coffee'],
    isActive: true,
  },
  {
    id: 'plan_yearly',
    name: 'Yearly Champion',
    planType: 'yearly',
    durationDays: 365,
    fee: 8500,
    description: 'Full year study membership with all amenities & maximum savings.',
    features: ['Fixed Seat Guaranteed', 'Premium Locker', 'Free Printing (50 pages/mo)', 'Complimentary Beverages', 'Career Mentorship'],
    isActive: true,
  },
];

// Initial clean available seats (30 seats)
const DEFAULT_SEATS: RRSeat[] = Array.from({ length: 30 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  const isHall1 = i < 18;
  return {
    id: `seat_${num}`,
    seatNumber: `S-${num}`,
    floor: isHall1 ? 'Ground Floor' : '1st Floor',
    section: isHall1 ? 'AC Main Hall' : 'Silent Reading Zone',
    status: 'available',
    currentStudentId: undefined,
    currentStudentName: undefined,
    allottedAt: undefined,
    hasSocket: true,
    hasLight: true,
  };
});

export const ReadingRoomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentLibraryId } = useTenant();

  const [students, setStudents] = useState<RRStudent[]>([]);
  const [seats, setSeats] = useState<RRSeat[]>([]);
  const [plans, setPlans] = useState<RRPlan[]>(DEFAULT_PLANS);
  const [payments, setPayments] = useState<RRPayment[]>([]);
  const [attendance, setAttendance] = useState<RRAttendance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize plans and seats if empty in Firestore for this library tenant
  useEffect(() => {
    const initAndSyncFirestore = async () => {
      try {
        // 1. Plans: ensure standard plans exist
        const plansSnap = await getDocs(collection(firestore, 'rr_plans'));
        if (plansSnap.empty) {
          for (const plan of DEFAULT_PLANS) {
            await setDoc(doc(firestore, 'rr_plans', plan.id), sanitizeForFirestore({ ...plan, libraryId: currentLibraryId || 'lib_main' }));
          }
        }

        // 2. Seats: ensure initial seats exist
        const seatsSnap = await getDocs(collection(firestore, 'rr_seats'));
        if (seatsSnap.empty) {
          for (const seat of DEFAULT_SEATS) {
            await setDoc(doc(firestore, 'rr_seats', seat.id), sanitizeForFirestore({ ...seat, libraryId: currentLibraryId || 'lib_main' }));
          }
        }
      } catch (err) {
        console.warn('Reading room Firestore initial setup warning:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAndSyncFirestore();
  }, [currentLibraryId]);

  // Real-time synchronization listeners scoped to currentLibraryId
  useEffect(() => {
    const unsubStudents = onSnapshot(
      collection(firestore, 'rr_students'),
      (snap) => {
        const loaded: RRStudent[] = snap.docs
          .map((d) => ({ ...(d.data() as RRStudent), id: d.id }))
          .filter((s) => (s.libraryId || 'lib_main') === currentLibraryId);

        // Check expiration dates dynamically
        const today = new Date().toISOString().split('T')[0];
        const evaluated = loaded.map((s) => {
          if (s.status === 'active' && s.expiryDate < today) {
            return { ...s, status: 'expired' as const };
          }
          return s;
        });
        setStudents(evaluated);
      },
      (err) => console.error('rr_students onSnapshot error:', err)
    );

    const unsubSeats = onSnapshot(
      collection(firestore, 'rr_seats'),
      (snap) => {
        const loaded: RRSeat[] = snap.docs
          .map((d) => ({ ...(d.data() as RRSeat), id: d.id }))
          .filter((s) => (s.libraryId || 'lib_main') === currentLibraryId);

        // Sort seats by seatNumber naturally
        loaded.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true }));
        setSeats(loaded);
      },
      (err) => console.error('rr_seats onSnapshot error:', err)
    );

    const unsubPlans = onSnapshot(
      collection(firestore, 'rr_plans'),
      (snap) => {
        const loaded: RRPlan[] = snap.docs
          .map((d) => ({ ...(d.data() as RRPlan), id: d.id }))
          .filter((p) => (p.libraryId || 'lib_main') === currentLibraryId);
        setPlans(loaded);
      },
      (err) => console.error('rr_plans onSnapshot error:', err)
    );

    const unsubPayments = onSnapshot(
      collection(firestore, 'rr_payments'),
      (snap) => {
        const loaded: RRPayment[] = snap.docs
          .map((d) => ({ ...(d.data() as RRPayment), id: d.id }))
          .filter((p) => (p.libraryId || 'lib_main') === currentLibraryId);
        loaded.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
        setPayments(loaded);
      },
      (err) => console.error('rr_payments onSnapshot error:', err)
    );

    const unsubAttendance = onSnapshot(
      collection(firestore, 'rr_attendance'),
      (snap) => {
        const loaded: RRAttendance[] = snap.docs
          .map((d) => ({ ...(d.data() as RRAttendance), id: d.id }))
          .filter((a) => (a.libraryId || 'lib_main') === currentLibraryId);
        loaded.sort((a, b) => b.date.localeCompare(a.date));
        setAttendance(loaded);
      },
      (err) => console.error('rr_attendance onSnapshot error:', err)
    );

    return () => {
      unsubStudents();
      unsubSeats();
      unsubPlans();
      unsubPayments();
      unsubAttendance();
    };
  }, [currentLibraryId]);

  // Receipt Number Generator: RCP-RR-YYYY-XXXX
  const generateNextReceiptNumber = (): string => {
    const year = new Date().getFullYear();
    const count = payments.length + 1001;
    return `RCP-RR-${year}-${count}`;
  };

  // Metrics computation
  const metrics = useMemo<ReadingRoomMetrics>(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.status === 'active').length;
    const occupiedSeats = seats.filter((s) => s.status === 'occupied').length;
    const availableSeats = seats.filter((s) => s.status === 'available').length;
    const reservedSeats = seats.filter((s) => s.status === 'reserved').length;
    const totalSeats = seats.length;

    const today = new Date().toISOString().split('T')[0];
    const todayLogs = attendance.filter((a) => a.date === today && a.status === 'present');
    const todayAttendance = todayLogs.length;
    const currentlyPresent = todayLogs.filter((a) => !a.checkOutTime).length;

    // Monthly Fee Collection (current month payments)
    const currentMonthPrefix = today.slice(0, 7); // e.g. "2026-02"
    const monthlyFeeCollection = payments
      .filter((p) => p.paymentDate.startsWith(currentMonthPrefix))
      .reduce((sum, p) => sum + (p.netAmount || 0), 0);

    const pendingFees = students.reduce((sum, s) => sum + (s.dueAmount || 0), 0);

    // Expiry alerts
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const threeDaysStr = threeDaysLater.toISOString().split('T')[0];

    const expiringIn3Days = students.filter(
      (s) => s.status === 'active' && s.expiryDate >= today && s.expiryDate <= threeDaysStr
    ).length;

    const expiredCount = students.filter((s) => s.status === 'expired' || s.expiryDate < today).length;

    return {
      totalStudents,
      activeStudents,
      occupiedSeats,
      availableSeats,
      reservedSeats,
      totalSeats,
      todayAttendance,
      currentlyPresent,
      monthlyFeeCollection,
      pendingFees,
      expiringIn3Days,
      expiredCount,
    };
  }, [students, seats, payments, attendance]);

  // Actions

  // 1. Register Student
  const registerStudent = async (data: RegisterStudentInput) => {
    try {
      const selectedPlan = plans.find((p) => p.id === data.planId) || plans[0];
      const duration = selectedPlan ? selectedPlan.durationDays : 30;

      const startDate = new Date(data.joiningDate || new Date());
      const expiry = new Date(startDate);
      expiry.setDate(expiry.getDate() + duration);
      const expiryDateStr = expiry.toISOString().split('T')[0];

      // Auto generated code: RR-YYYY-XXX
      const year = new Date().getFullYear();
      const codeIndex = students.length + 1;
      const studentCode = `RR-${year}-${codeIndex.toString().padStart(3, '0')}`;
      const newStudentId = `stu_rr_${Date.now()}`;

      // Seat checking
      let allottedSeat: RRSeat | undefined;
      if (data.allottedSeatId) {
        allottedSeat = seats.find((s) => s.id === data.allottedSeatId);
        if (allottedSeat && allottedSeat.status === 'occupied') {
          return { success: false, error: `Seat ${allottedSeat.seatNumber} is already occupied by another active student!` };
        }
      }

      const initialPaid = data.initialPayment ? data.initialPayment.amount : 0;
      const discount = data.initialPayment?.discount || 0;
      const netPayable = Math.max(0, selectedPlan.fee - discount);
      const due = Math.max(0, netPayable - initialPaid);

      const defaultAvatar =
        data.photoUrl ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80`;

      const newStudent: RRStudent = {
        id: newStudentId,
        studentId: studentCode,
        name: data.name.trim(),
        photoUrl: defaultAvatar,
        mobile: data.mobile.trim(),
        email: data.email?.trim() || '',
        address: data.address.trim(),
        fatherOrGuardianName: data.fatherOrGuardianName?.trim() || '',
        bloodGroup: data.bloodGroup || '',
        shift: data.shift || 'full_day',
        joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
        expiryDate: expiryDateStr,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        planType: selectedPlan.planType,
        allottedSeatId: allottedSeat ? allottedSeat.id : undefined,
        allottedSeatNumber: allottedSeat ? allottedSeat.seatNumber : undefined,
        feeAmount: selectedPlan.fee,
        paidAmount: initialPaid,
        dueAmount: due,
        status: 'active',
        emergencyContact: data.emergencyContact || '',
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Save student to Firestore
      await setDoc(doc(firestore, 'rr_students', newStudentId), newStudent);

      // 2. If seat allotted, mark seat occupied in Firestore
      if (allottedSeat) {
        const seatUpdate = {
          status: 'occupied' as const,
          currentStudentId: newStudentId,
          currentStudentName: newStudent.name,
          allottedAt: newStudent.joiningDate,
        };
        await updateDoc(doc(firestore, 'rr_seats', allottedSeat.id), seatUpdate);
      }

      // 3. If payment made, record payment and generate receipt
      let generatedReceipt: RRPayment | undefined;
      if (data.initialPayment && initialPaid > 0) {
        const receiptNo = generateNextReceiptNumber();
        const payId = `pay_rr_${Date.now()}`;
        generatedReceipt = {
          id: payId,
          receiptNumber: receiptNo,
          studentId: newStudentId,
          studentCode: studentCode,
          studentName: newStudent.name,
          mobile: newStudent.mobile,
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          seatNumber: allottedSeat ? allottedSeat.seatNumber : undefined,
          amount: initialPaid,
          discount,
          netAmount: initialPaid,
          paymentMethod: data.initialPayment.paymentMethod,
          paymentDate: new Date().toISOString().split('T')[0],
          periodStart: newStudent.joiningDate,
          periodEnd: expiryDateStr,
          collectedBy: 'Library Desk',
          notes: 'Admission initial fee payment',
        };
        await setDoc(doc(firestore, 'rr_payments', payId), generatedReceipt);
      }

      // Local optimistic update
      setStudents((prev) => [newStudent, ...prev]);
      if (allottedSeat) {
        setSeats((prev) =>
          prev.map((s) =>
            s.id === allottedSeat!.id
              ? {
                  ...s,
                  status: 'occupied',
                  currentStudentId: newStudentId,
                  currentStudentName: newStudent.name,
                  allottedAt: newStudent.joiningDate,
                }
              : s
          )
        );
      }
      if (generatedReceipt) {
        setPayments((prev) => [generatedReceipt!, ...prev]);
      }

      return { success: true, student: newStudent, receipt: generatedReceipt };
    } catch (err: any) {
      console.error('Error registering reading room student:', err);
      return { success: false, error: err?.message || 'Failed to register student.' };
    }
  };

  // 2. Update Student
  const updateStudent = async (id: string, updates: Partial<RRStudent>) => {
    try {
      const payload = { ...updates, updatedAt: new Date().toISOString() };
      await updateDoc(doc(firestore, 'rr_students', id), payload);

      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...payload } : s))
      );

      // If name updated, also update occupied seat occupant name
      if (updates.name) {
        const student = students.find((s) => s.id === id);
        if (student && student.allottedSeatId) {
          await updateDoc(doc(firestore, 'rr_seats', student.allottedSeatId), {
            currentStudentName: updates.name,
          });
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error updating student:', err);
      return { success: false, error: err?.message || 'Failed to update student.' };
    }
  };

  // 3. Deactivate Student & Vacate Seat
  const deactivateStudent = async (id: string) => {
    try {
      const student = students.find((s) => s.id === id);
      if (!student) return { success: false, error: 'Student not found.' };

      if (student.allottedSeatId) {
        await vacateSeat(student.allottedSeatId);
      }

      await updateDoc(doc(firestore, 'rr_students', id), {
        status: 'inactive',
        allottedSeatId: null,
        allottedSeatNumber: null,
        updatedAt: new Date().toISOString(),
      });

      setStudents((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: 'inactive', allottedSeatId: undefined, allottedSeatNumber: undefined }
            : s
        )
      );

      return { success: true };
    } catch (err: any) {
      console.error('Error deactivating student:', err);
      return { success: false, error: err?.message || 'Failed to deactivate student.' };
    }
  };

  // 4. Allot Seat (Enforce strictly single student per seat)
  const allotSeat = async (seatId: string, studentId: string) => {
    try {
      const targetSeat = seats.find((s) => s.id === seatId);
      if (!targetSeat) return { success: false, error: 'Seat does not exist.' };

      if (targetSeat.status === 'occupied' && targetSeat.currentStudentId !== studentId) {
        return {
          success: false,
          error: `Seat ${targetSeat.seatNumber} is already occupied by ${targetSeat.currentStudentName || 'another student'}. Vacate it first.`,
        };
      }

      const targetStudent = students.find((s) => s.id === studentId);
      if (!targetStudent) return { success: false, error: 'Student does not exist.' };

      // If student already has another seat, vacate previous seat
      if (targetStudent.allottedSeatId && targetStudent.allottedSeatId !== seatId) {
        await vacateSeat(targetStudent.allottedSeatId);
      }

      // 1. Update seat
      const seatUpdate = {
        status: 'occupied' as const,
        currentStudentId: targetStudent.id,
        currentStudentName: targetStudent.name,
        allottedAt: new Date().toISOString().split('T')[0],
      };
      await updateDoc(doc(firestore, 'rr_seats', seatId), seatUpdate);

      // 2. Update student
      const studentUpdate = {
        allottedSeatId: targetSeat.id,
        allottedSeatNumber: targetSeat.seatNumber,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(firestore, 'rr_students', studentId), studentUpdate);

      // Local update
      setSeats((prev) =>
        prev.map((s) => (s.id === seatId ? { ...s, ...seatUpdate } : s))
      );
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, ...studentUpdate } : s))
      );

      return { success: true };
    } catch (err: any) {
      console.error('Error allotting seat:', err);
      return { success: false, error: err?.message || 'Failed to allot seat.' };
    }
  };

  // 5. Vacate Seat
  const vacateSeat = async (seatId: string) => {
    try {
      const targetSeat = seats.find((s) => s.id === seatId);
      if (!targetSeat) return { success: false, error: 'Seat not found.' };

      const studentId = targetSeat.currentStudentId;

      const seatUpdate = {
        status: 'available' as const,
        currentStudentId: null,
        currentStudentName: null,
        allottedAt: null,
      };
      await updateDoc(doc(firestore, 'rr_seats', seatId), seatUpdate);

      if (studentId) {
        await updateDoc(doc(firestore, 'rr_students', studentId), {
          allottedSeatId: null,
          allottedSeatNumber: null,
          updatedAt: new Date().toISOString(),
        });
        setStudents((prev) =>
          prev.map((s) =>
            s.id === studentId
              ? { ...s, allottedSeatId: undefined, allottedSeatNumber: undefined }
              : s
          )
        );
      }

      setSeats((prev) =>
        prev.map((s) =>
          s.id === seatId
            ? {
                ...s,
                status: 'available',
                currentStudentId: undefined,
                currentStudentName: undefined,
                allottedAt: undefined,
              }
            : s
        )
      );

      return { success: true };
    } catch (err: any) {
      console.error('Error vacating seat:', err);
      return { success: false, error: err?.message || 'Failed to vacate seat.' };
    }
  };

  // 6. Set Seat Status (Available, Reserved, Maintenance)
  const setSeatStatus = async (seatId: string, status: RRSeat['status']) => {
    try {
      const targetSeat = seats.find((s) => s.id === seatId);
      if (!targetSeat) return { success: false, error: 'Seat not found.' };

      if (status === 'available' || status === 'reserved' || status === 'maintenance') {
        if (targetSeat.currentStudentId) {
          await vacateSeat(seatId);
        }
      }

      await updateDoc(doc(firestore, 'rr_seats', seatId), { status });
      setSeats((prev) => prev.map((s) => (s.id === seatId ? { ...s, status } : s)));
      return { success: true };
    } catch (err: any) {
      console.error('Error updating seat status:', err);
      return { success: false, error: err?.message || 'Failed to update seat status.' };
    }
  };

  // 7. Add New Seat
  const addSeat = async (seatData: Omit<RRSeat, 'id'>) => {
    try {
      if (seats.some((s) => s.seatNumber.toLowerCase() === seatData.seatNumber.toLowerCase())) {
        return { success: false, error: `Seat "${seatData.seatNumber}" already exists.` };
      }
      const newId = `seat_${Date.now()}`;
      const newSeat: RRSeat = { ...seatData, id: newId };
      await setDoc(doc(firestore, 'rr_seats', newId), newSeat);
      setSeats((prev) => [...prev, newSeat]);
      return { success: true };
    } catch (err: any) {
      console.error('Error adding seat:', err);
      return { success: false, error: err?.message || 'Failed to add seat.' };
    }
  };

  // 8. Save Plan
  const savePlan = async (plan: Omit<RRPlan, 'id'> & { id?: string }) => {
    try {
      const planId = plan.id || `plan_${Date.now()}`;
      const fullPlan: RRPlan = { ...plan, id: planId };
      await setDoc(doc(firestore, 'rr_plans', planId), fullPlan);
      setPlans((prev) => {
        const idx = prev.findIndex((p) => p.id === planId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = fullPlan;
          return updated;
        }
        return [...prev, fullPlan];
      });
      return { success: true };
    } catch (err: any) {
      console.error('Error saving plan:', err);
      return { success: false, error: err?.message || 'Failed to save membership plan.' };
    }
  };

  // 9. Toggle Plan Status
  const togglePlanStatus = async (planId: string) => {
    try {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return { success: false, error: 'Plan not found.' };
      const newStatus = !plan.isActive;
      await updateDoc(doc(firestore, 'rr_plans', planId), { isActive: newStatus });
      setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, isActive: newStatus } : p)));
      return { success: true };
    } catch (err: any) {
      console.error('Error toggling plan:', err);
      return { success: false, error: err?.message || 'Failed to toggle plan.' };
    }
  };

  // 10. Collect Fee & Generate Receipt
  const collectFee = async (params: {
    studentId: string;
    amount: number;
    paymentMethod: 'CASH' | 'UPI' | 'ONLINE' | 'CARD';
    discount?: number;
    planId?: string;
    notes?: string;
  }) => {
    try {
      const student = students.find((s) => s.id === params.studentId);
      if (!student) return { success: false, error: 'Student not found.' };

      const plan = params.planId ? plans.find((p) => p.id === params.planId) || plans[0] : plans.find((p) => p.id === student.planId) || plans[0];
      const receiptNo = generateNextReceiptNumber();
      const payId = `pay_rr_${Date.now()}`;
      const today = new Date().toISOString().split('T')[0];

      // Calculate extended expiry date
      let newExpiry = student.expiryDate;
      const baseDate = new Date(student.expiryDate > today ? student.expiryDate : today);
      baseDate.setDate(baseDate.getDate() + (plan ? plan.durationDays : 30));
      newExpiry = baseDate.toISOString().split('T')[0];

      const newPaid = (student.paidAmount || 0) + params.amount;
      const discount = params.discount || 0;
      const newDue = Math.max(0, (student.dueAmount || 0) - params.amount - discount);

      const receipt: RRPayment = {
        id: payId,
        receiptNumber: receiptNo,
        studentId: student.id,
        studentCode: student.studentId,
        studentName: student.name,
        mobile: student.mobile,
        planId: plan.id,
        planName: plan.name,
        seatNumber: student.allottedSeatNumber,
        amount: params.amount,
        discount,
        netAmount: params.amount,
        paymentMethod: params.paymentMethod,
        paymentDate: today,
        periodStart: today,
        periodEnd: newExpiry,
        collectedBy: 'Library Desk',
        notes: params.notes || `Fee renewal for ${plan.name}`,
      };

      await setDoc(doc(firestore, 'rr_payments', payId), receipt);

      // Update student record
      const studentUpdate = {
        paidAmount: newPaid,
        dueAmount: newDue,
        expiryDate: newExpiry,
        status: 'active' as const,
        planId: plan.id,
        planName: plan.name,
        planType: plan.planType,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(firestore, 'rr_students', student.id), studentUpdate);

      setPayments((prev) => [receipt, ...prev]);
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, ...studentUpdate } : s))
      );

      return { success: true, receipt };
    } catch (err: any) {
      console.error('Error collecting fee:', err);
      return { success: false, error: err?.message || 'Failed to record fee payment.' };
    }
  };

  // 11. Attendance: Check In
  const checkInStudent = async (studentId: string) => {
    try {
      const student = students.find((s) => s.id === studentId);
      if (!student) return { success: false, error: 'Student not found.' };

      const today = new Date().toISOString().split('T')[0];
      const existing = attendance.find((a) => a.studentId === studentId && a.date === today);

      const nowTimeStr = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      if (existing) {
        if (!existing.checkOutTime) {
          return { success: false, error: `${student.name} is already checked in at ${existing.checkInTime}!` };
        }
        // Re-check in on same day
        const updated = { ...existing, checkOutTime: null, checkInTime: nowTimeStr };
        await updateDoc(doc(firestore, 'rr_attendance', existing.id), updated);
        setAttendance((prev) => prev.map((a) => (a.id === existing.id ? { ...a, checkOutTime: undefined, checkInTime: nowTimeStr } : a)));
        return { success: true };
      }

      const attId = `att_rr_${Date.now()}`;
      const record: RRAttendance = {
        id: attId,
        studentId: student.id,
        studentCode: student.studentId,
        studentName: student.name,
        seatNumber: student.allottedSeatNumber,
        date: today,
        checkInTime: nowTimeStr,
        status: 'present',
        shift: student.shift,
      };

      await setDoc(doc(firestore, 'rr_attendance', attId), record);
      setAttendance((prev) => [record, ...prev]);
      return { success: true };
    } catch (err: any) {
      console.error('Error during check in:', err);
      return { success: false, error: err?.message || 'Failed to check in.' };
    }
  };

  // 12. Attendance: Check Out
  const checkOutStudent = async (studentId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existing = attendance.find((a) => a.studentId === studentId && a.date === today && !a.checkOutTime);
      if (!existing) {
        return { success: false, error: 'No active check-in found for this student today.' };
      }

      const nowTimeStr = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      await updateDoc(doc(firestore, 'rr_attendance', existing.id), { checkOutTime: nowTimeStr });
      setAttendance((prev) =>
        prev.map((a) => (a.id === existing.id ? { ...a, checkOutTime: nowTimeStr } : a))
      );
      return { success: true };
    } catch (err: any) {
      console.error('Error during check out:', err);
      return { success: false, error: err?.message || 'Failed to check out.' };
    }
  };

  // 13. Manual Attendance Record
  const markAttendance = async (record: Omit<RRAttendance, 'id'>) => {
    try {
      const attId = `att_rr_${Date.now()}`;
      const fullRecord: RRAttendance = { ...record, id: attId };
      await setDoc(doc(firestore, 'rr_attendance', attId), fullRecord);
      setAttendance((prev) => [fullRecord, ...prev]);
      return { success: true };
    } catch (err: any) {
      console.error('Error marking attendance:', err);
      return { success: false, error: err?.message || 'Failed to record attendance.' };
    }
  };

  return (
    <ReadingRoomContext.Provider
      value={{
        students,
        seats,
        plans,
        payments,
        attendance,
        metrics,
        isLoading,
        registerStudent,
        updateStudent,
        deactivateStudent,
        allotSeat,
        vacateSeat,
        setSeatStatus,
        addSeat,
        savePlan,
        togglePlanStatus,
        collectFee,
        checkInStudent,
        checkOutStudent,
        markAttendance,
        generateNextReceiptNumber,
      }}
    >
      {children}
    </ReadingRoomContext.Provider>
  );
};

export const useReadingRoom = () => {
  const context = useContext(ReadingRoomContext);
  if (!context) {
    throw new Error('useReadingRoom must be used within a ReadingRoomProvider');
  }
  return context;
};
