import { Book, Member, Loan, LibrarySettings, FineRecord, ActivityLog } from '../types';

export interface IssueValidationResult {
  allowed: boolean;
  reason?: string;
}

export const CirculationService = {
  /**
   * Validates if a member can borrow a book and if the book is available.
   */
  validateIssueEligibility(
    book: Book,
    member: Member,
    settings: LibrarySettings,
    activeLoansForMember: Loan[]
  ): IssueValidationResult {
    // 1. Book availability check
    if (book.status !== 'available') {
      return { allowed: false, reason: `Book is currently ${book.status} and cannot be checked out.` };
    }
    if (book.availableCopies <= 0) {
      return { allowed: false, reason: 'No physical copies available for this title.' };
    }

    // 2. Member status check
    if (member.status === 'suspended') {
      return { allowed: false, reason: 'Member account is currently SUSPENDED.' };
    }
    if (member.status === 'expired') {
      return { allowed: false, reason: 'Membership card has expired. Please renew membership.' };
    }

    // Check membership expiry date
    const now = new Date();
    const expiry = new Date(member.expiryDate);
    if (expiry < now) {
      return { allowed: false, reason: `Membership expired on ${member.expiryDate}.` };
    }

    // 3. Outstanding fines threshold check
    if (member.outstandingFines >= settings.maxFineBeforeBlock) {
      return {
        allowed: false,
        reason: `Outstanding fines (${settings.currencySymbol}${member.outstandingFines.toFixed(2)}) exceed the borrowing threshold (${settings.currencySymbol}${settings.maxFineBeforeBlock.toFixed(2)}). Pay pending dues first.`,
      };
    }

    // 4. Overdue loans check
    const hasOverdueLoans = activeLoansForMember.some(
      (l) => l.status === 'overdue' || (l.status === 'active' && new Date(l.dueDate) < now)
    );
    if (hasOverdueLoans) {
      return {
        allowed: false,
        reason: 'Member holds overdue books that must be returned before new issues are permitted.',
      };
    }

    // 5. Loan count limit check
    const maxLimit =
      member.maxLoansAllowed ||
      (member.memberType === 'faculty'
        ? settings.maxBooksFaculty
        : member.memberType === 'student'
        ? settings.maxBooksStudent
        : settings.maxBooksGeneral);

    if (activeLoansForMember.length >= maxLimit) {
      return {
        allowed: false,
        reason: `Maximum loan quota of ${maxLimit} books reached for ${member.memberType} member type.`,
      };
    }

    // 6. Already borrowed same book check
    const alreadyBorrowed = activeLoansForMember.some(
      (l) => l.bookId === book.id && (l.status === 'active' || l.status === 'overdue')
    );
    if (alreadyBorrowed) {
      return {
        allowed: false,
        reason: 'Member already has an active copy of this exact title checked out.',
      };
    }

    return { allowed: true };
  },

  /**
   * Computes the due date based on member type and settings.
   */
  calculateDueDate(memberType: Member['memberType'], settings: LibrarySettings, startDate: Date = new Date()): Date {
    const days = memberType === 'faculty' ? settings.facultyLoanPeriodDays : settings.defaultLoanPeriodDays;
    const due = new Date(startDate);
    due.setDate(due.getDate() + days);
    due.setHours(23, 59, 59, 999);
    return due;
  },

  /**
   * Calculates overdue days and fine amount based on grace period and fine rate.
   */
  calculateOverdueFine(
    dueDateStr: string,
    settings: LibrarySettings,
    returnDate: Date = new Date()
  ): { overdueDays: number; chargeableDays: number; fineAmount: number } {
    const dueDate = new Date(dueDateStr);
    const diffMs = returnDate.getTime() - dueDate.getTime();
    if (diffMs <= 0) {
      return { overdueDays: 0, chargeableDays: 0, fineAmount: 0 };
    }

    const overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const chargeableDays = Math.max(0, overdueDays - settings.gracePeriodDays);
    const fineAmount = parseFloat((chargeableDays * settings.finePerDay).toFixed(2));

    return { overdueDays, chargeableDays, fineAmount };
  },

  /**
   * Validates if a loan can be renewed.
   */
  validateRenewalEligibility(loan: Loan, settings: LibrarySettings): { allowed: boolean; reason?: string } {
    if (loan.status === 'returned') {
      return { allowed: false, reason: 'Cannot renew a book that has already been returned.' };
    }
    if (loan.renewalCount >= settings.maxRenewalsAllowed) {
      return { allowed: false, reason: `Maximum limit of ${settings.maxRenewalsAllowed} renewals reached for this loan.` };
    }
    return { allowed: true };
  },
};
