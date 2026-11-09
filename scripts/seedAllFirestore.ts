import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, query, limit, getDoc } from 'firebase/firestore';
import fs from 'fs';
import {
  INITIAL_BOOKS,
  INITIAL_MEMBERS,
  INITIAL_LOANS,
  INITIAL_RESERVATIONS,
  INITIAL_FINES,
  INITIAL_USERS,
  INITIAL_SETTINGS,
  INITIAL_LOGS,
} from '../src/lib/initialData';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

// Default Reading Room data
const DEFAULT_PLANS = [
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

const DEFAULT_SEATS = Array.from({ length: 30 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  const isHall1 = i < 18;
  return {
    id: `seat_${num}`,
    seatNumber: `S-${num}`,
    floor: isHall1 ? 'Ground Floor' : '1st Floor',
    section: isHall1 ? 'AC Main Hall' : 'Silent Reading Zone',
    status: (i === 1 || i === 2 || i === 4 || i === 7 || i === 9) ? 'occupied' : i === 14 ? 'reserved' : 'available',
    currentStudentId: i === 1 ? 'stu_rr_101' : i === 2 ? 'stu_rr_102' : i === 7 ? 'stu_rr_104' : i === 9 ? 'stu_rr_105' : undefined,
    currentStudentName: i === 1 ? 'Aarav Sharma' : i === 2 ? 'Priya Patel' : i === 7 ? 'Sneha Mukherjee' : i === 9 ? 'Vikram Singh Chauhan' : undefined,
    allottedAt: '2026-01-10',
    hasSocket: true,
    hasLight: true,
  };
});

const DEFAULT_STUDENTS = [
  {
    id: 'stu_rr_101',
    studentId: 'RR-2026-001',
    name: 'Aarav Sharma',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    mobile: '9876543210',
    email: 'aarav.sharma@example.com',
    address: '42 Tagore Marg, Civil Lines, Prayagraj',
    fatherOrGuardianName: 'Rajesh Sharma',
    bloodGroup: 'B+',
    shift: 'full_day',
    joiningDate: '2026-01-10',
    expiryDate: '2026-04-10',
    planId: 'plan_quarterly',
    planName: 'Quarterly Scholar',
    planType: 'quarterly',
    allottedSeatId: 'seat_02',
    allottedSeatNumber: 'S-02',
    feeAmount: 2400,
    paidAmount: 2400,
    dueAmount: 0,
    status: 'active',
    emergencyContact: '9876543211',
    createdAt: '2026-01-10T09:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'stu_rr_102',
    studentId: 'RR-2026-002',
    name: 'Priya Patel',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    mobile: '9823456789',
    email: 'priya.patel@example.com',
    address: '15 Gandhi Road, Ahmedabad',
    fatherOrGuardianName: 'Mahesh Patel',
    bloodGroup: 'O+',
    shift: 'morning',
    joiningDate: '2026-02-01',
    expiryDate: '2026-03-03',
    planId: 'plan_monthly',
    planName: 'Monthly Regular',
    planType: 'monthly',
    allottedSeatId: 'seat_03',
    allottedSeatNumber: 'S-03',
    feeAmount: 900,
    paidAmount: 900,
    dueAmount: 0,
    status: 'active',
    emergencyContact: '9823456780',
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'stu_rr_104',
    studentId: 'RR-2026-004',
    name: 'Sneha Mukherjee',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    mobile: '9654123987',
    email: 'sneha.m@example.com',
    address: 'Flat 4B, Lake View Apts, Kolkata',
    fatherOrGuardianName: 'Subir Mukherjee',
    bloodGroup: 'A+',
    shift: 'full_day',
    joiningDate: '2025-11-20',
    expiryDate: '2026-11-20',
    planId: 'plan_yearly',
    planName: 'Yearly Champion',
    planType: 'yearly',
    allottedSeatId: 'seat_08',
    allottedSeatNumber: 'S-08',
    feeAmount: 8500,
    paidAmount: 8500,
    dueAmount: 0,
    status: 'active',
    emergencyContact: '9654123980',
    createdAt: '2025-11-20T12:00:00.000Z',
    updatedAt: '2025-11-20T12:00:00.000Z',
  },
];

const DEFAULT_PAYMENTS = [
  {
    id: 'pay_rr_1',
    receiptNumber: 'RCP-RR-2026-1001',
    studentId: 'stu_rr_101',
    studentCode: 'RR-2026-001',
    studentName: 'Aarav Sharma',
    mobile: '9876543210',
    planId: 'plan_quarterly',
    planName: 'Quarterly Scholar',
    seatNumber: 'S-02',
    amount: 2400,
    discount: 0,
    netAmount: 2400,
    paymentMethod: 'UPI',
    paymentDate: '2026-01-10',
    periodStart: '2026-01-10',
    periodEnd: '2026-04-10',
    collectedBy: 'Admin Librarian',
    notes: 'Quarterly fee payment via UPI',
  },
  {
    id: 'pay_rr_2',
    receiptNumber: 'RCP-RR-2026-1002',
    studentId: 'stu_rr_102',
    studentCode: 'RR-2026-002',
    studentName: 'Priya Patel',
    mobile: '9823456789',
    planId: 'plan_monthly',
    planName: 'Monthly Regular',
    seatNumber: 'S-03',
    amount: 900,
    discount: 0,
    netAmount: 900,
    paymentMethod: 'CASH',
    paymentDate: '2026-02-01',
    periodStart: '2026-02-01',
    periodEnd: '2026-03-03',
    collectedBy: 'Admin Librarian',
    notes: 'Monthly fee paid in cash',
  },
];

const DEFAULT_ATTENDANCE = [
  {
    id: 'att_rr_1',
    studentId: 'stu_rr_101',
    studentCode: 'RR-2026-001',
    studentName: 'Aarav Sharma',
    seatNumber: 'S-02',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '08:30 AM',
    checkOutTime: undefined,
    status: 'present',
    shift: 'full_day',
  },
];

async function seedAll() {
  console.log('Synchronizing all collections into Firestore...');

  // 1. Members
  const memSnap = await getDocs(collection(db, 'members'));
  if (memSnap.empty) {
    console.log('Seeding members...');
    for (const m of INITIAL_MEMBERS) {
      await setDoc(doc(db, 'members', m.id), m);
    }
  }

  // 2. Loans
  const loansSnap = await getDocs(collection(db, 'loans'));
  if (loansSnap.empty) {
    console.log('Seeding loans...');
    for (const l of INITIAL_LOANS) {
      await setDoc(doc(db, 'loans', l.id), l);
    }
  }

  // 3. Reservations
  const resSnap = await getDocs(collection(db, 'reservations'));
  if (resSnap.empty) {
    console.log('Seeding reservations...');
    for (const r of INITIAL_RESERVATIONS) {
      await setDoc(doc(db, 'reservations', r.id), r);
    }
  }

  // 4. Fines
  const finesSnap = await getDocs(collection(db, 'fines'));
  if (finesSnap.empty) {
    console.log('Seeding fines...');
    for (const f of INITIAL_FINES) {
      await setDoc(doc(db, 'fines', f.id), f);
    }
  }

  // 5. Users
  const usersSnap = await getDocs(collection(db, 'users'));
  if (usersSnap.empty) {
    console.log('Seeding users...');
    for (const u of INITIAL_USERS) {
      await setDoc(doc(db, 'users', u.id), u);
    }
  }

  // 6. Settings
  const settingsDoc = await getDoc(doc(db, 'settings', 'main_config'));
  if (!settingsDoc.exists()) {
    console.log('Seeding settings...');
    await setDoc(doc(db, 'settings', 'main_config'), INITIAL_SETTINGS);
  }

  // 7. Activity logs
  const logsSnap = await getDocs(collection(db, 'activity_logs'));
  if (logsSnap.empty) {
    console.log('Seeding logs...');
    for (const log of INITIAL_LOGS) {
      await setDoc(doc(db, 'activity_logs', log.id), log);
    }
  }

function cleanObject(obj: any): any {
  const clean: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      clean[k] = v;
    }
  }
  return clean;
}

  // 8. Reading room seats
  const seatsSnap = await getDocs(collection(db, 'rr_seats'));
  if (seatsSnap.empty) {
    console.log('Seeding rr_seats...');
    for (const seat of DEFAULT_SEATS) {
      await setDoc(doc(db, 'rr_seats', seat.id), cleanObject(seat));
    }
  }

  // 9. Reading room students
  const studentsSnap = await getDocs(collection(db, 'rr_students'));
  if (studentsSnap.empty) {
    console.log('Seeding rr_students...');
    for (const s of DEFAULT_STUDENTS) {
      await setDoc(doc(db, 'rr_students', s.id), cleanObject(s));
    }
  }

  // 10. Reading room payments
  const paymentsSnap = await getDocs(collection(db, 'rr_payments'));
  if (paymentsSnap.empty) {
    console.log('Seeding rr_payments...');
    for (const p of DEFAULT_PAYMENTS) {
      await setDoc(doc(db, 'rr_payments', p.id), cleanObject(p));
    }
  }

  // 11. Reading room attendance
  const attSnap = await getDocs(collection(db, 'rr_attendance'));
  if (attSnap.empty) {
    console.log('Seeding rr_attendance...');
    for (const a of DEFAULT_ATTENDANCE) {
      await setDoc(doc(db, 'rr_attendance', a.id), cleanObject(a));
    }
  }

  console.log('All collections synchronized successfully to Firestore!');
  process.exit(0);
}

seedAll();
