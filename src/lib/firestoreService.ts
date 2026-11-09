import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  limit,
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import {
  Book,
  Member,
  Loan,
  Reservation,
  FineRecord,
  LibraryUser,
  LibrarySettings,
  ActivityLog,
} from '../types';
import {
  INITIAL_BOOKS,
  INITIAL_MEMBERS,
  INITIAL_LOANS,
  INITIAL_RESERVATIONS,
  INITIAL_FINES,
  INITIAL_USERS,
  INITIAL_SETTINGS,
  INITIAL_LOGS,
} from './initialData';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operation: OperationType;
  path: string | null;
  authInfo: {
    userId: string | null;
    email: string | null;
    isAuthenticated: boolean;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operation: operationType,
    path: path,
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      isAuthenticated: !!currentUser,
    },
  };
  console.error('[Firestore Error Details]:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// Collection References
export const collections = {
  books: collection(db, 'books'),
  members: collection(db, 'members'),
  loans: collection(db, 'loans'),
  fines: collection(db, 'fines'),
  reservations: collection(db, 'reservations'),
  users: collection(db, 'users'),
  settings: collection(db, 'settings'),
  activityLogs: collection(db, 'activity_logs'),
};

/**
 * Test connectivity to provisioned Firestore database
 */
export async function testFirestoreConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const testQuery = query(collections.books, limit(1));
    await getDocs(testQuery);
    return { connected: true };
  } catch (err: any) {
    console.error('Firestore connection test failed:', err);
    return { connected: false, error: err?.message || String(err) };
  }
}

/**
 * Seed initial data to Firestore if collections are empty
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    // 1. Books
    const booksSnapshot = await getDocs(query(collections.books, limit(1)));
    if (booksSnapshot.empty) {
      console.log('Seeding initial books to Firestore...');
      for (const b of INITIAL_BOOKS) {
        await setDoc(doc(db, 'books', b.id), b);
      }
    }

    // 2. Members
    const membersSnapshot = await getDocs(query(collections.members, limit(1)));
    if (membersSnapshot.empty) {
      console.log('Seeding initial members to Firestore...');
      for (const m of INITIAL_MEMBERS) {
        await setDoc(doc(db, 'members', m.id), m);
      }
    }

    // 3. Loans
    const loansSnapshot = await getDocs(query(collections.loans, limit(1)));
    if (loansSnapshot.empty) {
      console.log('Seeding initial loans to Firestore...');
      for (const l of INITIAL_LOANS) {
        await setDoc(doc(db, 'loans', l.id), l);
      }
    }

    // 4. Reservations
    const resSnapshot = await getDocs(query(collections.reservations, limit(1)));
    if (resSnapshot.empty) {
      console.log('Seeding initial reservations to Firestore...');
      for (const r of INITIAL_RESERVATIONS) {
        await setDoc(doc(db, 'reservations', r.id), r);
      }
    }

    // 5. Fines
    const finesSnapshot = await getDocs(query(collections.fines, limit(1)));
    if (finesSnapshot.empty) {
      console.log('Seeding initial fines to Firestore...');
      for (const f of INITIAL_FINES) {
        await setDoc(doc(db, 'fines', f.id), f);
      }
    }

    // 6. Users
    const usersSnapshot = await getDocs(query(collections.users, limit(1)));
    if (usersSnapshot.empty) {
      console.log('Seeding initial users to Firestore...');
      for (const u of INITIAL_USERS) {
        await setDoc(doc(db, 'users', u.id), u);
      }
    }

    // 7. Settings
    const settingsDoc = await getDoc(doc(db, 'settings', 'main_config'));
    if (!settingsDoc.exists()) {
      console.log('Seeding initial settings to Firestore...');
      await setDoc(doc(db, 'settings', 'main_config'), INITIAL_SETTINGS);
    }

    // 8. Logs
    const logsSnapshot = await getDocs(query(collections.activityLogs, limit(1)));
    if (logsSnapshot.empty) {
      console.log('Seeding initial activity logs to Firestore...');
      for (const log of INITIAL_LOGS) {
        await setDoc(doc(db, 'activity_logs', log.id), log);
      }
    }
  } catch (err) {
    console.warn('Initial data seeding error:', err);
  }
}

/**
 * Firestore Service for Books
 */
export const FirestoreBooks = {
  subscribe(callback: (books: Book[]) => void, onError?: (err: any) => void) {
    return onSnapshot(
      collections.books,
      (snapshot) => {
        const booksList: Book[] = [];
        snapshot.forEach((docSnap) => {
          booksList.push({ ...docSnap.data(), id: docSnap.id } as Book);
        });
        callback(booksList);
      },
      (error) => {
        console.error('Error listening to books:', error);
        if (onError) onError(error);
      }
    );
  },

  async add(book: Book): Promise<void> {
    try {
      await setDoc(doc(db, 'books', book.id), book);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `books/${book.id}`);
    }
  },

  async update(id: string, updates: Partial<Book>): Promise<void> {
    try {
      await updateDoc(doc(db, 'books', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `books/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'books', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `books/${id}`);
    }
  },
};

/**
 * Firestore Service for Members
 */
export const FirestoreMembers = {
  subscribe(callback: (members: Member[]) => void, onError?: (err: any) => void) {
    return onSnapshot(
      collections.members,
      (snapshot) => {
        const membersList: Member[] = [];
        snapshot.forEach((docSnap) => {
          membersList.push({ ...docSnap.data(), id: docSnap.id } as Member);
        });
        callback(membersList);
      },
      (error) => {
        console.error('Error listening to members:', error);
        if (onError) onError(error);
      }
    );
  },

  async add(member: Member): Promise<void> {
    try {
      await setDoc(doc(db, 'members', member.id), member);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `members/${member.id}`);
    }
  },

  async update(id: string, updates: Partial<Member>): Promise<void> {
    try {
      await updateDoc(doc(db, 'members', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `members/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'members', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `members/${id}`);
    }
  },
};

/**
 * Firestore Service for Loans
 */
export const FirestoreLoans = {
  subscribe(callback: (loans: Loan[]) => void, onError?: (err: any) => void) {
    return onSnapshot(
      collections.loans,
      (snapshot) => {
        const loansList: Loan[] = [];
        snapshot.forEach((docSnap) => {
          loansList.push({ ...docSnap.data(), id: docSnap.id } as Loan);
        });
        callback(loansList);
      },
      (error) => {
        console.error('Error listening to loans:', error);
        if (onError) onError(error);
      }
    );
  },

  async add(loan: Loan): Promise<void> {
    try {
      await setDoc(doc(db, 'loans', loan.id), loan);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `loans/${loan.id}`);
    }
  },

  async update(id: string, updates: Partial<Loan>): Promise<void> {
    try {
      await updateDoc(doc(db, 'loans', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `loans/${id}`);
    }
  },
};

/**
 * Firestore Service for Fines
 */
export const FirestoreFines = {
  subscribe(callback: (fines: FineRecord[]) => void, onError?: (err: any) => void) {
    return onSnapshot(
      collections.fines,
      (snapshot) => {
        const finesList: FineRecord[] = [];
        snapshot.forEach((docSnap) => {
          finesList.push({ ...docSnap.data(), id: docSnap.id } as FineRecord);
        });
        callback(finesList);
      },
      (error) => {
        console.error('Error listening to fines:', error);
        if (onError) onError(error);
      }
    );
  },

  async add(fine: FineRecord): Promise<void> {
    try {
      await setDoc(doc(db, 'fines', fine.id), fine);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `fines/${fine.id}`);
    }
  },

  async update(id: string, updates: Partial<FineRecord>): Promise<void> {
    try {
      await updateDoc(doc(db, 'fines', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `fines/${id}`);
    }
  },
};

/**
 * Firestore Service for Reservations
 */
export const FirestoreReservations = {
  subscribe(callback: (reservations: Reservation[]) => void, onError?: (err: any) => void) {
    return onSnapshot(
      collections.reservations,
      (snapshot) => {
        const list: Reservation[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as Reservation);
        });
        callback(list);
      },
      (error) => {
        console.error('Error listening to reservations:', error);
        if (onError) onError(error);
      }
    );
  },

  async add(reservation: Reservation): Promise<void> {
    try {
      await setDoc(doc(db, 'reservations', reservation.id), reservation);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reservations/${reservation.id}`);
    }
  },

  async update(id: string, updates: Partial<Reservation>): Promise<void> {
    try {
      await updateDoc(doc(db, 'reservations', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reservations/${id}`);
    }
  },
};

/**
 * Firestore Service for Settings
 */
export const FirestoreSettings = {
  subscribe(callback: (settings: LibrarySettings) => void, onError?: (err: any) => void) {
    return onSnapshot(
      doc(db, 'settings', 'main_config'),
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as LibrarySettings);
        }
      },
      (error) => {
        console.error('Error listening to settings:', error);
        if (onError) onError(error);
      }
    );
  },

  async save(settings: LibrarySettings): Promise<void> {
    try {
      await setDoc(doc(db, 'settings', 'main_config'), settings);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/main_config');
    }
  },
};

/**
 * Firestore Service for Activity Logs
 */
export const FirestoreLogs = {
  subscribe(callback: (logs: ActivityLog[]) => void, onError?: (err: any) => void) {
    return onSnapshot(
      collections.activityLogs,
      (snapshot) => {
        const list: ActivityLog[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as ActivityLog);
        });
        // Sort descending by timestamp
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(list);
      },
      (error) => {
        console.error('Error listening to activity logs:', error);
        if (onError) onError(error);
      }
    );
  },

  async add(log: ActivityLog): Promise<void> {
    try {
      await setDoc(doc(db, 'activity_logs', log.id), log);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `activity_logs/${log.id}`);
    }
  },
};

/**
 * Firestore Service for Users
 */
export const FirestoreUsers = {
  subscribe(callback: (users: LibraryUser[]) => void, onError?: (err: any) => void) {
    return onSnapshot(
      collections.users,
      (snapshot) => {
        const list: LibraryUser[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as LibraryUser);
        });
        callback(list);
      },
      (error) => {
        console.error('Error listening to users:', error);
        if (onError) onError(error);
      }
    );
  },

  async add(user: LibraryUser): Promise<void> {
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.id}`);
    }
  },

  async update(id: string, updates: Partial<LibraryUser>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
    }
  },
};
