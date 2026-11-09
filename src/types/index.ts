export type Role = 'SUPER_ADMIN' | 'OWNER' | 'LIBRARIAN' | 'ASSISTANT';

export type BookCategory = 
  | 'Computer Science' 
  | 'Engineering' 
  | 'Mathematics' 
  | 'Physics' 
  | 'Literature & Fiction' 
  | 'Business & Economics' 
  | 'History & Politics' 
  | 'Medical & Health' 
  | 'Arts & Design' 
  | 'General Reference';

export type BookStatus = 'available' | 'maintenance' | 'archived';

export interface Book {
  id: string;
  libraryId: string;
  title: string;
  isbn: string;
  author: string;
  publisher: string;
  publishYear: number;
  edition?: string;
  category: BookCategory;
  shelfNumber: string; // e.g. "A3-Rack4"
  callNumber: string;  // e.g. "005.133 JAV"
  totalCopies: number;
  availableCopies: number;
  coverImage?: string;
  language: string;
  description: string;
  status: BookStatus;
  createdAt: string;
  updatedAt: string;
}

export type MemberType = 'student' | 'faculty' | 'staff' | 'general';
export type MemberStatus = 'active' | 'suspended' | 'expired';

export interface Member {
  id: string;
  libraryId: string;
  memberCode: string; // e.g. "MEM-2026-001"
  fullName: string;
  email: string;
  phone: string;
  memberType: MemberType;
  department: string; // e.g. "Computer Science & Eng"
  status: MemberStatus;
  joinDate: string;
  expiryDate: string;
  maxLoansAllowed: number;
  currentLoansCount: number;
  outstandingFines: number;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LoanStatus = 'active' | 'returned' | 'overdue' | 'lost';

export interface Loan {
  id: string;
  libraryId: string;
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  memberId: string;
  memberCode: string;
  memberName: string;
  memberEmail: string;
  issuedAt: string;
  dueDate: string;
  returnedAt?: string;
  status: LoanStatus;
  renewalCount: number;
  maxRenewals: number;
  issuedByUserId: string;
  issuedByUserName: string;
  fineAmount: number;
  finePaid: boolean;
  notes?: string;
}

export type ReservationStatus = 'pending' | 'ready_for_pickup' | 'fulfilled' | 'cancelled' | 'expired';

export interface Reservation {
  id: string;
  libraryId: string;
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  memberId: string;
  memberCode: string;
  memberName: string;
  queuePosition: number;
  status: ReservationStatus;
  reservedAt: string;
  readyUntil?: string;
  fulfilledAt?: string;
  notes?: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'ONLINE' | 'BANK_TRANSFER';
export type FineStatus = 'pending' | 'paid' | 'waived';

export interface FineRecord {
  id: string;
  libraryId: string;
  loanId: string;
  memberId: string;
  memberCode: string;
  memberName: string;
  bookTitle: string;
  amount: number;
  overdueDays: number;
  status: FineStatus;
  reason: string;
  createdAt: string;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  receiptNumber?: string;
  collectedByUserId?: string;
  collectedByUserName?: string;
  notes?: string;
}

export interface LibraryUser {
  id: string;
  libraryId: string;
  email: string;
  displayName: string;
  role: Role;
  status: 'active' | 'inactive';
  lastLoginAt?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface LibrarySettings {
  id: string;
  libraryId: string;
  libraryName: string;
  institutionName: string;
  branchCode: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  currency: string;
  currencySymbol: string;
  defaultLoanPeriodDays: number;
  facultyLoanPeriodDays: number;
  maxBooksStudent: number;
  maxBooksFaculty: number;
  maxBooksGeneral: number;
  gracePeriodDays: number;
  finePerDay: number;
  maxFineBeforeBlock: number;
  maxRenewalsAllowed: number;
  receiptHeader: string;
  receiptFooter: string;
  autoSendEmailAlerts: boolean;
}

export type ActivityAction = 
  | 'BOOK_CREATED'
  | 'BOOK_UPDATED'
  | 'BOOK_ARCHIVED'
  | 'MEMBER_REGISTERED'
  | 'MEMBER_UPDATED'
  | 'MEMBER_STATUS_CHANGED'
  | 'BOOK_ISSUED'
  | 'BOOK_RETURNED'
  | 'LOAN_RENEWED'
  | 'RESERVATION_CREATED'
  | 'RESERVATION_STATUS_CHANGED'
  | 'FINE_COLLECTED'
  | 'FINE_WAIVED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'SETTINGS_UPDATED'
  | 'DATA_EXPORTED'
  | 'DATA_RESTORED';

export interface ActivityLog {
  id: string;
  libraryId: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: ActivityAction;
  entityType: 'BOOK' | 'MEMBER' | 'LOAN' | 'RESERVATION' | 'FINE' | 'USER' | 'SETTINGS' | 'SYSTEM';
  entityId: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DashboardMetrics {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  issuedBooks: number;
  activeMembers: number;
  overdueLoans: number;
  pendingFines: number;
  todayIssues: number;
  todayReturns: number;
  activeReservations: number;
}

export type LibraryStatus = 'active' | 'suspended' | 'pending';
export type LibraryPlan = 'starter' | 'pro' | 'enterprise';

export interface LibraryTenant {
  id: string; // unique libraryId e.g. "lib_main"
  name: string;
  code: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  plan: LibraryPlan;
  status: LibraryStatus;
  maxSeats: number;
  maxBooks: number;
  createdAt: string;
  updatedAt: string;
  suspendedReason?: string;
  suspendedAt?: string;
}

export interface SuperAdminStats {
  totalLibraries: number;
  activeLibraries: number;
  suspendedLibraries: number;
  totalBooksAcrossTenants: number;
  totalStudentsAcrossTenants: number;
  totalSeatsAcrossTenants: number;
  totalRevenueAcrossTenants: number;
}

export * from './readingRoom';
