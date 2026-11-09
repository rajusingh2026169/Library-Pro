import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Book,
  Member,
  Loan,
  Reservation,
  FineRecord,
  LibraryUser,
  LibrarySettings,
  ActivityLog,
  Role,
  PaymentMethod,
  DashboardMetrics,
} from '../types';
import { StorageService } from '../lib/storage';
import { CirculationService } from '../services/circulationService';
import {
  auth,
  firestore,
  storage,
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  onSnapshot,
  setDoc,
} from '../services/firebase';
import {
  seedInitialDataIfEmpty,
  FirestoreBooks,
  FirestoreMembers,
  FirestoreLoans,
  FirestoreFines,
  FirestoreReservations,
  FirestoreSettings,
  FirestoreLogs,
  FirestoreUsers,
} from '../lib/firestoreService';
import { useTenant } from './TenantContext';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface AppContextType {
  // Firebase Services
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;

  // State collections
  books: Book[];
  members: Member[];
  loans: Loan[];
  reservations: Reservation[];
  fines: FineRecord[];
  users: LibraryUser[];
  settings: LibrarySettings;
  logs: ActivityLog[];
  currentUser: LibraryUser;
  toasts: ToastMessage[];
  metrics: DashboardMetrics;
  language: 'hi' | 'en';
  setLanguage: (lang: 'hi' | 'en') => void;

  // Helpers
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  setCurrentUserRole: (role: Role) => void;
  hasPermission: (requiredRole: Role) => boolean;

  // Book Actions
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'libraryId'>) => { success: boolean; error?: string };
  updateBook: (id: string, updates: Partial<Book>) => { success: boolean; error?: string };
  archiveBook: (id: string) => void;
  restoreBook: (id: string) => void;

  // Member Actions
  addMember: (member: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'libraryId' | 'currentLoansCount' | 'outstandingFines'>) => { success: boolean; error?: string };
  updateMember: (id: string, updates: Partial<Member>) => { success: boolean; error?: string };
  updateMemberStatus: (id: string, status: Member['status']) => void;

  // Circulation Actions
  issueBook: (bookId: string, memberId: string, customDueDate?: string, notes?: string) => { success: boolean; error?: string; loan?: Loan };
  returnBook: (loanId: string, options?: { payFineNow?: boolean; paymentMethod?: PaymentMethod; notes?: string }) => { success: boolean; error?: string; fineRecord?: FineRecord };
  renewLoan: (loanId: string) => { success: boolean; error?: string };

  // Reservation Actions
  createReservation: (bookId: string, memberId: string, notes?: string) => { success: boolean; error?: string };
  updateReservationStatus: (id: string, status: Reservation['status']) => void;
  cancelReservation: (id: string) => void;

  // Fine & Payment Actions
  collectFinePayment: (fineId: string, method: PaymentMethod, notes?: string) => { success: boolean; receiptNumber?: string; error?: string };
  waiveFine: (fineId: string, reason: string) => { success: boolean; error?: string };

  // Settings & Management
  updateSettings: (newSettings: Partial<LibrarySettings>) => void;
  addUser: (user: Omit<LibraryUser, 'id' | 'createdAt' | 'libraryId'>) => { success: boolean; error?: string };
  updateUserRole: (userId: string, role: Role) => void;
  toggleUserStatus: (userId: string) => void;
  resetAllDemoData: () => void;
  importBackupData: (json: string) => { success: boolean; error?: string };
  exportBackupData: () => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentLibraryId, currentLibrary } = useTenant();

  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [fines, setFines] = useState<FineRecord[]>([]);
  const [users, setUsers] = useState<LibraryUser[]>([]);
  const [settings, setSettings] = useState<LibrarySettings>(() => StorageService.getSettings());
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [language, setLanguageState] = useState<'hi' | 'en'>(() => {
    return (localStorage.getItem('librarypro_lang_pref') as 'hi' | 'en') || 'en';
  });

  const setLanguage = (lang: 'hi' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem('librarypro_lang_pref', lang);
  };

  // Current active user
  const [currentUserId, setCurrentUserId] = useState<string>(() => StorageService.getCurrentUserId());

  const currentUser = useMemo<LibraryUser>(() => {
    const authEmail = auth.currentUser?.email?.toLowerCase();
    const found = users.find((u) => u.id === currentUserId || (authEmail && u.email?.toLowerCase() === authEmail));
    if (found) return found;
    if (users.length > 0) return users[0];
    return {
      id: auth.currentUser?.uid || 'user_active',
      libraryId: currentLibraryId || 'lib_main',
      email: auth.currentUser?.email || 'admin@librarypro.com',
      displayName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Librarian',
      role: 'OWNER' as Role,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    };
  }, [users, currentUserId, currentLibraryId]);

  // Initial Firestore synchronization with getDocs filtered by currentLibraryId
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const booksSnap = await getDocs(collection(firestore, 'books'));
        const loadedBooks = booksSnap.docs
          .map((docSnap) => ({
            ...(docSnap.data() as Book),
            id: docSnap.id,
          }))
          .filter((b) => (b.libraryId || 'lib_main') === currentLibraryId);
        setBooks(loadedBooks);

        const membersSnap = await getDocs(collection(firestore, 'members'));
        if (!membersSnap.empty) {
          const loadedMembers = membersSnap.docs
            .map((d) => ({ ...(d.data() as Member), id: d.id }))
            .filter((m) => (m.libraryId || 'lib_main') === currentLibraryId);
          setMembers(loadedMembers);
        }

        const loansSnap = await getDocs(collection(firestore, 'loans'));
        if (!loansSnap.empty) {
          const loadedLoans = loansSnap.docs
            .map((d) => ({ ...(d.data() as Loan), id: d.id }))
            .filter((l) => (l.libraryId || 'lib_main') === currentLibraryId);
          setLoans(loadedLoans);
        }

        const resSnap = await getDocs(collection(firestore, 'reservations'));
        if (!resSnap.empty) {
          const loadedRes = resSnap.docs
            .map((d) => ({ ...(d.data() as Reservation), id: d.id }))
            .filter((r) => (r.libraryId || 'lib_main') === currentLibraryId);
          setReservations(loadedRes);
        }

        const finesSnap = await getDocs(collection(firestore, 'fines'));
        if (!finesSnap.empty) {
          const loadedFines = finesSnap.docs
            .map((d) => ({ ...(d.data() as FineRecord), id: d.id }))
            .filter((f) => (f.libraryId || 'lib_main') === currentLibraryId);
          setFines(loadedFines);
        }
      } catch (err) {
        console.warn('Initial getDocs synchronization info:', err);
      }
    };

    fetchInitialData();
  }, [currentLibraryId]);

  // Real-time synchronization for books, members, loans, reservations, and fines scoped to currentLibraryId
  useEffect(() => {
    const unsubBooks = onSnapshot(
      collection(firestore, 'books'),
      (snapshot) => {
        const loaded: Book[] = snapshot.docs
          .map((docSnap) => ({
            ...(docSnap.data() as Book),
            id: docSnap.id,
          }))
          .filter((b) => (b.libraryId || 'lib_main') === currentLibraryId);
        setBooks(loaded);
      },
      (err) => console.error('Books onSnapshot sync error:', err)
    );

    const unsubMembers = onSnapshot(
      collection(firestore, 'members'),
      (snapshot) => {
        const loaded: Member[] = snapshot.docs
          .map((docSnap) => ({
            ...(docSnap.data() as Member),
            id: docSnap.id,
          }))
          .filter((m) => (m.libraryId || 'lib_main') === currentLibraryId);
        setMembers(loaded);
      },
      (err) => console.error('Members onSnapshot sync error:', err)
    );

    const unsubLoans = onSnapshot(
      collection(firestore, 'loans'),
      (snapshot) => {
        const loaded: Loan[] = snapshot.docs
          .map((docSnap) => ({
            ...(docSnap.data() as Loan),
            id: docSnap.id,
          }))
          .filter((l) => (l.libraryId || 'lib_main') === currentLibraryId);
        setLoans(loaded);
      },
      (err) => console.error('Loans onSnapshot sync error:', err)
    );

    const unsubReservations = onSnapshot(
      collection(firestore, 'reservations'),
      (snapshot) => {
        const loaded: Reservation[] = snapshot.docs
          .map((docSnap) => ({
            ...(docSnap.data() as Reservation),
            id: docSnap.id,
          }))
          .filter((r) => (r.libraryId || 'lib_main') === currentLibraryId);
        setReservations(loaded);
      },
      (err) => console.error('Reservations onSnapshot sync error:', err)
    );

    const unsubFines = onSnapshot(
      collection(firestore, 'fines'),
      (snapshot) => {
        const loaded: FineRecord[] = snapshot.docs
          .map((docSnap) => ({
            ...(docSnap.data() as FineRecord),
            id: docSnap.id,
          }))
          .filter((f) => (f.libraryId || 'lib_main') === currentLibraryId);
        setFines(loaded);
      },
      (err) => console.error('Fines onSnapshot sync error:', err)
    );

    // Settings listener - tenant specific or fallback
    const settingsDocId = currentLibraryId === 'lib_main' ? 'main_config' : `settings_${currentLibraryId}`;
    const unsubSettings = onSnapshot(
      doc(firestore, 'settings', settingsDocId),
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as LibrarySettings);
        } else if (currentLibrary) {
          // Adapt default settings from current library
          setSettings((prev) => ({
            ...prev,
            libraryId: currentLibrary.id,
            libraryName: currentLibrary.name,
            branchCode: currentLibrary.code,
            email: currentLibrary.ownerEmail,
            phone: currentLibrary.phone,
          }));
        }
      },
      (err) => console.error('Settings onSnapshot error:', err)
    );

    const unsubLogs = onSnapshot(
      collection(firestore, 'activity_logs'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map((d) => ({ ...(d.data() as ActivityLog), id: d.id }));
          loaded.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setLogs(loaded);
        }
      },
      (err) => console.error('Activity logs onSnapshot error:', err)
    );

    const unsubUsers = onSnapshot(
      collection(firestore, 'users'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map((d) => ({ ...(d.data() as LibraryUser), id: d.id }));
          setUsers(loaded);
        }
      },
      (err) => console.error('Users onSnapshot error:', err)
    );

    return () => {
      unsubBooks();
      unsubMembers();
      unsubLoans();
      unsubReservations();
      unsubFines();
      unsubSettings();
      unsubLogs();
      unsubUsers();
    };
  }, []);

  // Sync to local cache storage on updates as fallback
  useEffect(() => {
    StorageService.saveBooks(books);
  }, [books]);

  useEffect(() => {
    StorageService.saveMembers(members);
  }, [members]);

  useEffect(() => {
    StorageService.saveLoans(loans);
  }, [loans]);

  useEffect(() => {
    StorageService.saveReservations(reservations);
  }, [reservations]);

  useEffect(() => {
    StorageService.saveFines(fines);
  }, [fines]);

  useEffect(() => {
    StorageService.saveUsers(users);
  }, [users]);

  useEffect(() => {
    StorageService.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    StorageService.saveLogs(logs);
  }, [logs]);

  useEffect(() => {
    StorageService.saveCurrentUserId(currentUserId);
  }, [currentUserId]);

  // Check and update overdue statuses periodically
  useEffect(() => {
    const now = new Date();
    let hasChanges = false;
    const updatedLoans = loans.map((loan) => {
      if (loan.status === 'active' && new Date(loan.dueDate) < now) {
        hasChanges = true;
        const { fineAmount } = CirculationService.calculateOverdueFine(loan.dueDate, settings, now);
        const updated = {
          ...loan,
          status: 'overdue' as const,
          fineAmount,
        };
        updateDoc(doc(firestore, 'loans', loan.id), { status: 'overdue', fineAmount }).catch(console.error);
        return updated;
      }
      return loan;
    });

    if (hasChanges) {
      setLoans(updatedLoans);
    }
  }, [settings]);

  // Toast helpers
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Role permissions
  const hasPermission = (requiredRole: Role): boolean => {
    const roleHierarchy: Record<Role, number> = {
      SUPER_ADMIN: 4,
      OWNER: 3,
      LIBRARIAN: 2,
      ASSISTANT: 1,
    };
    return (roleHierarchy[currentUser.role] || 1) >= (roleHierarchy[requiredRole] || 1);
  };

  const setCurrentUserRole = (role: Role) => {
    const targetUser = users.find((u) => u.role === role);
    if (targetUser) {
      setCurrentUserId(targetUser.id);
      addToast({
        type: 'info',
        title: `Switched Active User`,
        message: `Now acting as ${targetUser.displayName} (${role.replace('_', ' ')})`,
      });
    }
  };

  // Activity Logger
  const logActivity = (
    action: ActivityLog['action'],
    entityType: ActivityLog['entityType'],
    entityId: string,
    description: string
  ) => {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newLog: ActivityLog = {
      id: logId,
      libraryId: settings.libraryId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      userRole: currentUser.role,
      action,
      entityType,
      entityId,
      description,
      timestamp: new Date().toISOString(),
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 199)]);
    setDoc(doc(firestore, 'activity_logs', logId), newLog).catch((err) =>
      console.error('Failed to log to Firestore:', err)
    );
  };

  // Dashboard Metrics
  const metrics = useMemo<DashboardMetrics>(() => {
    const totalBooks = books.length;
    const totalCopies = books.reduce((sum, b) => sum + (b.totalCopies || 0), 0);
    const availableCopies = books.reduce((sum, b) => sum + (b.availableCopies || 0), 0);
    const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue');
    const issuedBooks = activeLoans.length;
    const activeMembers = members.filter((m) => m.status === 'active').length;
    const overdueLoans = loans.filter((l) => l.status === 'overdue').length;
    const pendingFines = fines
      .filter((f) => f.status === 'pending')
      .reduce((sum, f) => sum + (f.amount || 0), 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayIssues = loans.filter((l) => l.issuedAt && l.issuedAt.startsWith(todayStr)).length;
    const todayReturns = loans.filter((l) => l.returnedAt && l.returnedAt.startsWith(todayStr)).length;
    const activeReservations = reservations.filter(
      (r) => r.status === 'pending' || r.status === 'ready_for_pickup'
    ).length;

    return {
      totalBooks,
      totalCopies,
      availableCopies,
      issuedBooks,
      activeMembers,
      overdueLoans,
      pendingFines,
      todayIssues,
      todayReturns,
      activeReservations,
    };
  }, [books, members, loans, reservations, fines]);

  // Book Actions
  const addBook = (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'libraryId'>) => {
    if (!hasPermission('LIBRARIAN')) {
      addToast({ type: 'error', title: 'Unauthorized', message: 'Only Librarians and Admins can catalog books.' });
      return { success: false, error: 'Unauthorized' };
    }

    if (books.some((b) => b.isbn.trim() === bookData.isbn.trim())) {
      const err = `A book with ISBN "${bookData.isbn}" already exists in the catalog.`;
      addToast({ type: 'error', title: 'Duplicate ISBN', message: err });
      return { success: false, error: err };
    }

    const docRef = doc(collection(firestore, 'books'));
    const bookId = docRef.id;
    const nowIso = new Date().toISOString();
    const newBook: Book = {
      ...bookData,
      id: bookId,
      libraryId: settings.libraryId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setBooks((prev) => [newBook, ...prev.filter((b) => b.id !== bookId)]);

    // Save directly to Firestore with guaranteed consistent ID
    setDoc(docRef, newBook).catch((err) => {
      console.error('Error saving book to Firestore with setDoc:', err);
    });

    logActivity('BOOK_CREATED', 'BOOK', bookId, `Cataloged new book "${newBook.title}" (ISBN: ${newBook.isbn})`);
    addToast({ type: 'success', title: 'Book Added', message: `"${newBook.title}" added to catalog.` });
    return { success: true };
  };

  const updateBook = (id: string, updates: Partial<Book>) => {
    if (!hasPermission('LIBRARIAN')) {
      addToast({ type: 'error', title: 'Unauthorized', message: 'Permission denied.' });
      return { success: false, error: 'Unauthorized' };
    }

    let updatedBook: Book | null = null;
    const updatedPayload = { ...updates, updatedAt: new Date().toISOString() };

    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          updatedBook = {
            ...b,
            ...updatedPayload,
          };
          return updatedBook;
        }
        return b;
      })
    );

    if (updatedBook) {
      updateDoc(doc(firestore, 'books', id), updatedPayload).catch((err) =>
        console.error('Error updating book in Firestore with updateDoc:', err)
      );
      logActivity('BOOK_UPDATED', 'BOOK', id, `Updated details for book "${(updatedBook as Book).title}"`);
      addToast({ type: 'success', title: 'Book Updated', message: 'Catalog record saved.' });
      return { success: true };
    }
    return { success: false, error: 'Book not found' };
  };

  const archiveBook = (id: string) => {
    if (!hasPermission('SUPER_ADMIN')) {
      addToast({ type: 'error', title: 'Unauthorized', message: 'Only Super Admins can archive books.' });
      return;
    }
    const updatedAt = new Date().toISOString();
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'archived', updatedAt } : b))
    );
    updateDoc(doc(firestore, 'books', id), { status: 'archived', updatedAt }).catch(console.error);
    logActivity('BOOK_ARCHIVED', 'BOOK', id, `Archived book record (ID: ${id})`);
    addToast({ type: 'info', title: 'Book Archived', message: 'Book marked as archived.' });
  };

  const restoreBook = (id: string) => {
    if (!hasPermission('SUPER_ADMIN')) {
      addToast({ type: 'error', title: 'Unauthorized', message: 'Permission denied.' });
      return;
    }
    const updatedAt = new Date().toISOString();
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'available', updatedAt } : b))
    );
    updateDoc(doc(firestore, 'books', id), { status: 'available', updatedAt }).catch(console.error);
    addToast({ type: 'success', title: 'Book Restored', message: 'Book marked as available in catalog.' });
  };

  // Member Actions
  const addMember = (
    memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'libraryId' | 'currentLoansCount' | 'outstandingFines'>
  ) => {
    if (!hasPermission('ASSISTANT')) {
      addToast({ type: 'error', title: 'Unauthorized', message: 'Permission denied.' });
      return { success: false, error: 'Unauthorized' };
    }

    if (members.some((m) => m.memberCode.toLowerCase() === memberData.memberCode.toLowerCase())) {
      const err = `Member Code "${memberData.memberCode}" is already in use.`;
      addToast({ type: 'error', title: 'Duplicate Member Code', message: err });
      return { success: false, error: err };
    }

    const docRef = doc(collection(firestore, 'members'));
    const memberId = docRef.id;
    const nowIso = new Date().toISOString();
    const newMember: Member = {
      ...memberData,
      id: memberId,
      libraryId: settings.libraryId,
      currentLoansCount: 0,
      outstandingFines: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setMembers((prev) => [newMember, ...prev.filter((m) => m.id !== memberId)]);

    // Save directly to Firestore with guaranteed consistent ID
    setDoc(docRef, newMember).catch((err) => {
      console.error('Error saving member to Firestore with setDoc:', err);
    });

    logActivity('MEMBER_REGISTERED', 'MEMBER', memberId, `Registered member ${newMember.fullName} (${newMember.memberCode})`);
    addToast({ type: 'success', title: 'Member Registered', message: `Added ${newMember.fullName} to member registry.` });
    return { success: true };
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    const updatedPayload = { ...updates, updatedAt: new Date().toISOString() };
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updatedPayload } : m))
    );
    updateDoc(doc(firestore, 'members', id), updatedPayload).catch((err) =>
      console.error('Error updating member in Firestore with updateDoc:', err)
    );
    logActivity('MEMBER_UPDATED', 'MEMBER', id, `Updated profile for member ID: ${id}`);
    addToast({ type: 'success', title: 'Member Updated', message: 'Patron profile updated successfully.' });
    return { success: true };
  };

  const updateMemberStatus = (id: string, status: Member['status']) => {
    const updatedAt = new Date().toISOString();
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status, updatedAt } : m))
    );
    updateDoc(doc(firestore, 'members', id), { status, updatedAt }).catch(console.error);
    logActivity('MEMBER_STATUS_CHANGED', 'MEMBER', id, `Changed member status to ${status.toUpperCase()}`);
    addToast({ type: 'info', title: 'Status Changed', message: `Member is now marked as ${status}.` });
  };

  // Issue Book (Circulation)
  const issueBook = (bookId: string, memberId: string, customDueDate?: string, notes?: string) => {
    const book = books.find((b) => b.id === bookId);
    const member = members.find((m) => m.id === memberId);

    if (!book) return { success: false, error: 'Selected book not found.' };
    if (!member) return { success: false, error: 'Selected member not found.' };

    const activeMemberLoans = loans.filter(
      (l) => l.memberId === memberId && (l.status === 'active' || l.status === 'overdue')
    );

    const validation = CirculationService.validateIssueEligibility(book, member, settings, activeMemberLoans);
    if (!validation.allowed) {
      addToast({ type: 'error', title: 'Issue Blocked', message: validation.reason });
      return { success: false, error: validation.reason };
    }

    const calculatedDueDate = customDueDate || CirculationService.calculateDueDate(member.memberType, settings).toISOString();
    const loanDocRef = doc(collection(firestore, 'loans'));
    const loanId = loanDocRef.id;

    const newLoan: Loan = {
      id: loanId,
      libraryId: settings.libraryId,
      bookId: book.id,
      bookTitle: book.title,
      bookIsbn: book.isbn,
      memberId: member.id,
      memberCode: member.memberCode,
      memberName: member.fullName,
      memberEmail: member.email,
      issuedAt: new Date().toISOString(),
      dueDate: calculatedDueDate,
      status: 'active' as const,
      renewalCount: 0,
      maxRenewals: settings.maxRenewalsAllowed,
      issuedByUserId: currentUser.id,
      issuedByUserName: currentUser.displayName,
      fineAmount: 0,
      finePaid: false,
      notes: notes || '',
    };

    const newCopies = Math.max(0, book.availableCopies - 1);
    setBooks((prev) =>
      prev.map((b) => (b.id === book.id ? { ...b, availableCopies: newCopies } : b))
    );
    updateDoc(doc(firestore, 'books', book.id), { availableCopies: newCopies }).catch(console.error);

    const newCount = member.currentLoansCount + 1;
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, currentLoansCount: newCount } : m))
    );
    updateDoc(doc(firestore, 'members', member.id), { currentLoansCount: newCount }).catch(console.error);

    setLoans((prev) => [newLoan, ...prev.filter((l) => l.id !== loanId)]);

    // Save directly to Firestore with guaranteed consistent ID
    setDoc(loanDocRef, newLoan).catch((err) =>
      console.error('Error saving loan to Firestore with setDoc:', err)
    );

    setReservations((prev) =>
      prev.map((r) => {
        if (r.bookId === book.id && r.memberId === member.id && (r.status === 'pending' || r.status === 'ready_for_pickup')) {
          const fulfilledAt = new Date().toISOString();
          updateDoc(doc(firestore, 'reservations', r.id), { status: 'fulfilled', fulfilledAt }).catch(console.error);
          return { ...r, status: 'fulfilled', fulfilledAt };
        }
        return r;
      })
    );

    logActivity(
      'BOOK_ISSUED',
      'LOAN',
      loanId,
      `Issued "${book.title}" to ${member.fullName} (${member.memberCode}). Due: ${new Date(calculatedDueDate).toLocaleDateString()}`
    );

    addToast({
      type: 'success',
      title: 'Book Issued Successfully',
      message: `"${book.title}" checked out to ${member.fullName}.`,
    });

    return { success: true, loan: newLoan };
  };

  // Return Book (Circulation)
  const returnBook = (
    loanId: string,
    options?: { payFineNow?: boolean; paymentMethod?: PaymentMethod; notes?: string }
  ) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return { success: false, error: 'Loan record not found.' };

    if (loan.status === 'returned') {
      addToast({ type: 'warning', title: 'Already Returned', message: 'This book has already been marked as returned.' });
      return { success: false, error: 'Book already returned' };
    }

    const returnDate = new Date();
    const { overdueDays, fineAmount } = CirculationService.calculateOverdueFine(loan.dueDate, settings, returnDate);

    let createdFine: FineRecord | undefined;
    const isFineApplicable = fineAmount > 0;

    if (isFineApplicable) {
      const fineDocRef = doc(collection(firestore, 'fines'));
      const fineId = fineDocRef.id;
      const receiptNo = options?.payFineNow
        ? `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        : undefined;

      createdFine = {
        id: fineId,
        libraryId: settings.libraryId,
        loanId: loan.id,
        memberId: loan.memberId,
        memberCode: loan.memberCode,
        memberName: loan.memberName,
        bookTitle: loan.bookTitle,
        amount: fineAmount,
        overdueDays,
        status: options?.payFineNow ? ('paid' as const) : ('pending' as const),
        reason: `Late return by ${overdueDays} days (${settings.gracePeriodDays} days grace period applied).`,
        createdAt: new Date().toISOString(),
        paidAt: options?.payFineNow ? new Date().toISOString() : undefined,
        paymentMethod: options?.payFineNow ? options.paymentMethod || 'CASH' : undefined,
        receiptNumber: receiptNo,
        collectedByUserId: options?.payFineNow ? currentUser.id : undefined,
        collectedByUserName: options?.payFineNow ? currentUser.displayName : undefined,
      };

      setFines((prev) => [createdFine!, ...prev.filter((f) => f.id !== fineId)]);

      // Save directly to Firestore with guaranteed consistent ID
      setDoc(fineDocRef, createdFine).catch((err) =>
        console.error('Error saving fine to Firestore with setDoc:', err)
      );
    }

    const updatedLoanFields = {
      status: 'returned' as const,
      returnedAt: returnDate.toISOString(),
      fineAmount,
      finePaid: Boolean(options?.payFineNow),
      notes: options?.notes ? `${loan.notes ? loan.notes + ' | ' : ''}${options.notes}` : loan.notes,
    };

    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, ...updatedLoanFields } : l))
    );
    updateDoc(doc(firestore, 'loans', loanId), updatedLoanFields).catch(console.error);

    const book = books.find((b) => b.id === loan.bookId);
    if (book) {
      const newAvail = Math.min(book.totalCopies, book.availableCopies + 1);
      setBooks((prev) =>
        prev.map((b) => (b.id === loan.bookId ? { ...b, availableCopies: newAvail } : b))
      );
      updateDoc(doc(firestore, 'books', loan.bookId), { availableCopies: newAvail }).catch(console.error);
    }

    const member = members.find((m) => m.id === loan.memberId);
    if (member) {
      const addedUnpaidFine = isFineApplicable && !options?.payFineNow ? fineAmount : 0;
      const newLoansCount = Math.max(0, member.currentLoansCount - 1);
      const newFines = member.outstandingFines + addedUnpaidFine;
      setMembers((prev) =>
        prev.map((m) =>
          m.id === loan.memberId
            ? {
                ...m,
                currentLoansCount: newLoansCount,
                outstandingFines: newFines,
              }
            : m
        )
      );
      updateDoc(doc(firestore, 'members', loan.memberId), {
        currentLoansCount: newLoansCount,
        outstandingFines: newFines,
      }).catch(console.error);
    }

    setReservations((prev) => {
      const pendingReservations = prev
        .filter((r) => r.bookId === loan.bookId && r.status === 'pending')
        .sort((a, b) => a.queuePosition - b.queuePosition);

      if (pendingReservations.length > 0) {
        const top = pendingReservations[0];
        const holdDate = new Date();
        holdDate.setDate(holdDate.getDate() + 3);

        addToast({
          type: 'info',
          title: 'Reservation Alert',
          message: `Book placed on hold for next member in queue: ${top.memberName}`,
        });

        updateDoc(doc(firestore, 'reservations', top.id), {
          status: 'ready_for_pickup',
          readyUntil: holdDate.toISOString(),
        }).catch(console.error);

        return prev.map((r) =>
          r.id === top.id
            ? { ...r, status: 'ready_for_pickup', readyUntil: holdDate.toISOString() }
            : r
        );
      }
      return prev;
    });

    logActivity(
      'BOOK_RETURNED',
      'LOAN',
      loan.id,
      `Returned "${loan.bookTitle}" from ${loan.memberName}. ${
        fineAmount > 0
          ? `Overdue fine: ${settings.currencySymbol}${fineAmount.toFixed(2)} (${options?.payFineNow ? 'Paid' : 'Pending'})`
          : 'Returned on time.'
      }`
    );

    addToast({
      type: 'success',
      title: 'Book Returned',
      message: `"${loan.bookTitle}" is restocked. ${
        fineAmount > 0
          ? `Fine assessed: ${settings.currencySymbol}${fineAmount.toFixed(2)} (${options?.payFineNow ? 'Paid' : 'Pending'})`
          : ''
      }`,
    });

    return { success: true, fineRecord: createdFine };
  };

  // Renew Loan
  const renewLoan = (loanId: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return { success: false, error: 'Loan not found.' };

    const val = CirculationService.validateRenewalEligibility(loan, settings);
    if (!val.allowed) {
      addToast({ type: 'error', title: 'Renewal Denied', message: val.reason });
      return { success: false, error: val.reason };
    }

    const hasReservation = reservations.some(
      (r) => r.bookId === loan.bookId && (r.status === 'pending' || r.status === 'ready_for_pickup')
    );
    if (hasReservation) {
      addToast({
        type: 'error',
        title: 'Renewal Blocked',
        message: 'Another patron has an active reservation hold on this book. Renewal is not allowed.',
      });
      return { success: false, error: 'Reserved by another patron.' };
    }

    const currentDue = new Date(loan.dueDate);
    const newDueDate = new Date(currentDue);
    newDueDate.setDate(newDueDate.getDate() + settings.defaultLoanPeriodDays);

    const renewalUpdates = {
      dueDate: newDueDate.toISOString(),
      renewalCount: loan.renewalCount + 1,
      status: 'active' as const,
      fineAmount: 0,
    };

    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, ...renewalUpdates } : l))
    );
    updateDoc(doc(firestore, 'loans', loanId), renewalUpdates).catch(console.error);

    logActivity(
      'LOAN_RENEWED',
      'LOAN',
      loan.id,
      `Renewed loan for "${loan.bookTitle}". New due date: ${newDueDate.toLocaleDateString()}`
    );

    addToast({
      type: 'success',
      title: 'Loan Renewed',
      message: `New due date is ${newDueDate.toLocaleDateString()} (Renewal #${loan.renewalCount + 1}/${settings.maxRenewalsAllowed}).`,
    });

    return { success: true };
  };

  // Reservation Actions
  const createReservation = (bookId: string, memberId: string, notes?: string) => {
    const book = books.find((b) => b.id === bookId);
    const member = members.find((m) => m.id === memberId);

    if (!book || !member) return { success: false, error: 'Invalid book or member.' };

    const existing = reservations.find(
      (r) => r.bookId === bookId && r.memberId === memberId && (r.status === 'pending' || r.status === 'ready_for_pickup')
    );
    if (existing) {
      addToast({ type: 'warning', title: 'Already Reserved', message: 'Member already has an active hold queue entry for this title.' });
      return { success: false, error: 'Already reserved.' };
    }

    const currentQueue = reservations.filter(
      (r) => r.bookId === bookId && (r.status === 'pending' || r.status === 'ready_for_pickup')
    ).length;

    const resDocRef = doc(collection(firestore, 'reservations'));
    const resId = resDocRef.id;
    const newRes: Reservation = {
      id: resId,
      libraryId: settings.libraryId,
      bookId: book.id,
      bookTitle: book.title,
      bookIsbn: book.isbn,
      memberId: member.id,
      memberCode: member.memberCode,
      memberName: member.fullName,
      queuePosition: currentQueue + 1,
      status: book.availableCopies > 0 ? ('ready_for_pickup' as const) : ('pending' as const),
      reservedAt: new Date().toISOString(),
      notes: notes || '',
    };

    setReservations((prev) => [newRes, ...prev.filter((r) => r.id !== resId)]);

    // Save directly to Firestore with guaranteed consistent ID
    setDoc(resDocRef, newRes).catch((err) =>
      console.error('Error saving reservation to Firestore with setDoc:', err)
    );

    logActivity(
      'RESERVATION_CREATED',
      'RESERVATION',
      resId,
      `Reserved "${book.title}" for ${member.fullName} (Queue Position #${newRes.queuePosition})`
    );

    addToast({
      type: 'success',
      title: 'Reservation Confirmed',
      message: `Hold placed for ${member.fullName}. Queue position: #${newRes.queuePosition}`,
    });

    return { success: true };
  };

  const updateReservationStatus = (id: string, status: Reservation['status']) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    updateDoc(doc(firestore, 'reservations', id), { status }).catch(console.error);
    logActivity('RESERVATION_STATUS_CHANGED', 'RESERVATION', id, `Updated reservation status to ${status}`);
    addToast({ type: 'info', title: 'Reservation Updated', message: `Hold status set to ${status}.` });
  };

  const cancelReservation = (id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r))
    );
    updateDoc(doc(firestore, 'reservations', id), { status: 'cancelled' }).catch(console.error);
    logActivity('RESERVATION_STATUS_CHANGED', 'RESERVATION', id, `Cancelled reservation`);
    addToast({ type: 'info', title: 'Hold Cancelled', message: 'Reservation was cancelled.' });
  };

  // Fine Payment Actions
  const collectFinePayment = (fineId: string, method: PaymentMethod, notes?: string) => {
    const fine = fines.find((f) => f.id === fineId);
    if (!fine) return { success: false, error: 'Fine record not found' };
    if (fine.status === 'paid') return { success: false, error: 'Fine is already paid' };

    const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const fineUpdates = {
      status: 'paid' as const,
      paidAt: new Date().toISOString(),
      paymentMethod: method,
      receiptNumber,
      collectedByUserId: currentUser.id,
      collectedByUserName: currentUser.displayName,
      notes: notes ? `${fine.notes ? fine.notes + ' | ' : ''}${notes}` : fine.notes,
    };

    setFines((prev) =>
      prev.map((f) => (f.id === fineId ? { ...f, ...fineUpdates } : f))
    );
    updateDoc(doc(firestore, 'fines', fineId), fineUpdates).catch(console.error);

    const member = members.find((m) => m.id === fine.memberId);
    if (member) {
      const newFines = Math.max(0, member.outstandingFines - fine.amount);
      const newStatus =
        member.status === 'suspended' && newFines < settings.maxFineBeforeBlock
          ? 'active'
          : member.status;

      setMembers((prev) =>
        prev.map((m) =>
          m.id === fine.memberId
            ? {
                ...m,
                outstandingFines: newFines,
                status: newStatus,
              }
            : m
        )
      );
      updateDoc(doc(firestore, 'members', fine.memberId), {
        outstandingFines: newFines,
        status: newStatus,
      }).catch(console.error);
    }

    logActivity(
      'FINE_COLLECTED',
      'FINE',
      fine.id,
      `Collected ${settings.currencySymbol}${fine.amount.toFixed(2)} via ${method} from ${fine.memberName} (Receipt: ${receiptNumber})`
    );

    addToast({
      type: 'success',
      title: 'Payment Recorded',
      message: `Receipt #${receiptNumber} generated for ${settings.currencySymbol}${fine.amount.toFixed(2)}.`,
    });

    return { success: true, receiptNumber };
  };

  const waiveFine = (fineId: string, reason: string) => {
    if (!hasPermission('SUPER_ADMIN')) {
      addToast({ type: 'error', title: 'Unauthorized', message: 'Only Super Admins have permission to waive fines.' });
      return { success: false, error: 'Unauthorized' };
    }

    const fine = fines.find((f) => f.id === fineId);
    if (!fine) return { success: false, error: 'Fine not found' };

    const waiveUpdates = {
      status: 'waived' as const,
      notes: `${fine.notes ? fine.notes + ' | ' : ''}Waived by ${currentUser.displayName}: ${reason}`,
    };

    setFines((prev) =>
      prev.map((f) => (f.id === fineId ? { ...f, ...waiveUpdates } : f))
    );
    updateDoc(doc(firestore, 'fines', fineId), waiveUpdates).catch(console.error);

    const member = members.find((m) => m.id === fine.memberId);
    if (member) {
      const newFines = Math.max(0, member.outstandingFines - fine.amount);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === fine.memberId
            ? {
                ...m,
                outstandingFines: newFines,
              }
            : m
        )
      );
      updateDoc(doc(firestore, 'members', fine.memberId), { outstandingFines: newFines }).catch(console.error);
    }

    logActivity('FINE_WAIVED', 'FINE', fine.id, `Waived ${settings.currencySymbol}${fine.amount.toFixed(2)} for ${fine.memberName}. Reason: ${reason}`);

    addToast({
      type: 'info',
      title: 'Fine Waived',
      message: `Waived fine of ${settings.currencySymbol}${fine.amount.toFixed(2)}.`,
    });

    return { success: true };
  };

  // Settings & Users
  const updateSettings = (newSettings: Partial<LibrarySettings>) => {
    if (!hasPermission('SUPER_ADMIN')) {
      addToast({ type: 'error', title: 'Unauthorized', message: 'Only Super Admins can update system settings.' });
      return;
    }
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    setDoc(doc(firestore, 'settings', 'main_config'), updated).catch(console.error);
    logActivity('SETTINGS_UPDATED', 'SETTINGS', settings.id, 'Updated library configuration and circulation policies');
    addToast({ type: 'success', title: 'Settings Saved', message: 'Library parameters updated.' });
  };

  const addUser = (userData: Omit<LibraryUser, 'id' | 'createdAt' | 'libraryId'>) => {
    if (!hasPermission('SUPER_ADMIN')) {
      addToast({ type: 'error', title: 'Unauthorized', message: 'Permission denied.' });
      return { success: false, error: 'Unauthorized' };
    }

    const userDocRef = doc(collection(firestore, 'users'));
    const userId = userDocRef.id;
    const newUser: LibraryUser = {
      ...userData,
      id: userId,
      libraryId: settings.libraryId,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev.filter((u) => u.id !== userId), newUser]);
    setDoc(userDocRef, newUser).catch(console.error);

    logActivity('USER_CREATED', 'USER', userId, `Added staff account for ${newUser.displayName} (${newUser.role})`);
    addToast({ type: 'success', title: 'User Created', message: `Staff account added for ${newUser.displayName}.` });
    return { success: true };
  };

  const updateUserRole = (userId: string, role: Role) => {
    if (!hasPermission('SUPER_ADMIN')) {
      addToast({ type: 'error', title: 'Unauthorized', message: 'Permission denied.' });
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    updateDoc(doc(firestore, 'users', userId), { role }).catch(console.error);
    logActivity('USER_UPDATED', 'USER', userId, `Changed role to ${role}`);
    addToast({ type: 'info', title: 'Role Updated', message: 'Staff permission tier updated.' });
  };

  const toggleUserStatus = (userId: string) => {
    if (!hasPermission('SUPER_ADMIN')) {
      addToast({ type: 'error', title: 'Unauthorized', message: 'Permission denied.' });
      return;
    }
    if (userId === currentUser.id) {
      addToast({ type: 'error', title: 'Action Denied', message: 'You cannot deactivate your own active session account.' });
      return;
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    updateDoc(doc(firestore, 'users', userId), { status: newStatus }).catch(console.error);
    addToast({ type: 'info', title: 'User Status Toggled', message: 'Staff status updated.' });
  };

  const resetAllDemoData = () => {
    StorageService.resetAllToDemoData();
    setBooks(StorageService.getBooks());
    setMembers(StorageService.getMembers());
    setLoans(StorageService.getLoans());
    setReservations(StorageService.getReservations());
    setFines(StorageService.getFines());
    setUsers(StorageService.getUsers());
    setSettings(StorageService.getSettings());
    setLogs(StorageService.getLogs());
    seedInitialDataIfEmpty().catch(console.error);
    addToast({
      type: 'info',
      title: 'Demo Data Restored',
      message: 'Catalog, loans, patrons, and settings have been reset to demo state and synced to Firestore.',
    });
  };

  const importBackupData = (json: string) => {
    const res = StorageService.importBackup(json);
    if (res.success) {
      const bks = StorageService.getBooks();
      const mems = StorageService.getMembers();
      const lns = StorageService.getLoans();
      const rsvs = StorageService.getReservations();
      const fns = StorageService.getFines();
      const usrs = StorageService.getUsers();
      const setts = StorageService.getSettings();
      const lgs = StorageService.getLogs();

      setBooks(bks);
      setMembers(mems);
      setLoans(lns);
      setReservations(rsvs);
      setFines(fns);
      setUsers(usrs);
      setSettings(setts);
      setLogs(lgs);

      for (const b of bks) FirestoreBooks.add(b).catch(console.error);
      for (const m of mems) FirestoreMembers.add(m).catch(console.error);
      for (const l of lns) FirestoreLoans.add(l).catch(console.error);
      for (const f of fns) FirestoreFines.add(f).catch(console.error);
      for (const r of rsvs) FirestoreReservations.add(r).catch(console.error);
      FirestoreSettings.save(setts).catch(console.error);

      logActivity('DATA_RESTORED', 'SYSTEM', 'system_restore', 'Restored library database from backup archive');
      addToast({ type: 'success', title: 'Backup Restored', message: 'Database successfully imported and synced.' });
    } else {
      addToast({ type: 'error', title: 'Import Failed', message: res.error });
    }
    return res;
  };

  const exportBackupData = () => {
    logActivity('DATA_EXPORTED', 'SYSTEM', 'system_export', 'Exported full library database JSON backup');
    return StorageService.exportFullBackup();
  };

  return (
    <AppContext.Provider
      value={{
        auth,
        firestore,
        storage,
        books,
        members,
        loans,
        reservations,
        fines,
        users,
        settings,
        logs,
        currentUser,
        toasts,
        metrics,
        language,
        setLanguage,
        addToast,
        removeToast,
        setCurrentUserRole,
        hasPermission,
        addBook,
        updateBook,
        archiveBook,
        restoreBook,
        addMember,
        updateMember,
        updateMemberStatus,
        issueBook,
        returnBook,
        renewLoan,
        createReservation,
        updateReservationStatus,
        cancelReservation,
        collectFinePayment,
        waiveFine,
        updateSettings,
        addUser,
        updateUserRole,
        toggleUserStatus,
        resetAllDemoData,
        importBackupData,
        exportBackupData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
