export type PlanType = 'daily' | 'monthly' | 'quarterly' | 'yearly';
export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';
export type ShiftType = 'full_day' | 'morning' | 'evening' | 'night';
export type AttendanceStatus = 'present' | 'absent' | 'half_day';
export type RRRole = 'SUPER_ADMIN' | 'LIBRARIAN' | 'ASSISTANT';

export interface RRPlan {
  id: string;
  libraryId?: string;
  name: string;
  planType: PlanType;
  durationDays: number;
  fee: number;
  description: string;
  features?: string[];
  isActive: boolean;
}

export interface RRStudent {
  id: string;
  libraryId?: string;
  studentId: string; // e.g. RR-2026-001
  name: string;
  photoUrl: string;
  mobile: string;
  email?: string;
  address: string;
  fatherOrGuardianName?: string;
  bloodGroup?: string;
  shift: ShiftType;
  joiningDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  planId: string;
  planName: string;
  planType: PlanType;
  allottedSeatId?: string;
  allottedSeatNumber?: string;
  feeAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'active' | 'expired' | 'inactive';
  emergencyContact?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RRSeat {
  id: string;
  libraryId?: string;
  seatNumber: string; // e.g. "S-01", "S-02"
  floor: string; // e.g. "Ground Floor"
  section: string; // e.g. "Silent Zone", "AC Hall"
  status: SeatStatus;
  currentStudentId?: string;
  currentStudentName?: string;
  allottedAt?: string;
  hasSocket: boolean;
  hasLight: boolean;
}

export interface RRPayment {
  id: string;
  libraryId?: string;
  receiptNumber: string; // e.g. RCP-RR-2026-1001
  studentId: string;
  studentCode: string;
  studentName: string;
  mobile?: string;
  planId: string;
  planName: string;
  seatNumber?: string;
  amount: number;
  discount: number;
  netAmount: number;
  paymentMethod: 'CASH' | 'UPI' | 'ONLINE' | 'CARD';
  paymentDate: string; // YYYY-MM-DD or ISO
  periodStart: string;
  periodEnd: string;
  collectedBy: string;
  notes?: string;
}

export interface RRAttendance {
  id: string;
  libraryId?: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  seatNumber?: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // e.g. "08:30 AM" or ISO
  checkOutTime?: string; // e.g. "01:30 PM"
  status: AttendanceStatus;
  shift?: ShiftType;
}

export interface ReadingRoomMetrics {
  totalStudents: number;
  activeStudents: number;
  occupiedSeats: number;
  availableSeats: number;
  reservedSeats: number;
  totalSeats: number;
  todayAttendance: number;
  currentlyPresent: number;
  monthlyFeeCollection: number;
  pendingFees: number;
  expiringIn3Days: number;
  expiredCount: number;
}
