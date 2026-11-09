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

const STORAGE_KEYS = {
  BOOKS: 'librarypro_books_v1',
  MEMBERS: 'librarypro_members_v1',
  LOANS: 'librarypro_loans_v1',
  RESERVATIONS: 'librarypro_reservations_v1',
  FINES: 'librarypro_fines_v1',
  USERS: 'librarypro_users_v1',
  SETTINGS: 'librarypro_settings_v1',
  LOGS: 'librarypro_logs_v1',
  CURRENT_USER_ID: 'librarypro_current_user_id_v1',
};

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

export const StorageService = {
  getBooks(): Book[] {
    return getStored<Book[]>(STORAGE_KEYS.BOOKS, []);
  },
  saveBooks(books: Book[]): void {
    setStored(STORAGE_KEYS.BOOKS, books);
  },

  getMembers(): Member[] {
    return getStored<Member[]>(STORAGE_KEYS.MEMBERS, []);
  },
  saveMembers(members: Member[]): void {
    setStored(STORAGE_KEYS.MEMBERS, members);
  },

  getLoans(): Loan[] {
    return getStored<Loan[]>(STORAGE_KEYS.LOANS, []);
  },
  saveLoans(loans: Loan[]): void {
    setStored(STORAGE_KEYS.LOANS, loans);
  },

  getReservations(): Reservation[] {
    return getStored<Reservation[]>(STORAGE_KEYS.RESERVATIONS, []);
  },
  saveReservations(reservations: Reservation[]): void {
    setStored(STORAGE_KEYS.RESERVATIONS, reservations);
  },

  getFines(): FineRecord[] {
    return getStored<FineRecord[]>(STORAGE_KEYS.FINES, []);
  },
  saveFines(fines: FineRecord[]): void {
    setStored(STORAGE_KEYS.FINES, fines);
  },

  getUsers(): LibraryUser[] {
    return getStored<LibraryUser[]>(STORAGE_KEYS.USERS, []);
  },
  saveUsers(users: LibraryUser[]): void {
    setStored(STORAGE_KEYS.USERS, users);
  },

  getSettings(): LibrarySettings {
    return getStored<LibrarySettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  saveSettings(settings: LibrarySettings): void {
    setStored(STORAGE_KEYS.SETTINGS, settings);
  },

  getLogs(): ActivityLog[] {
    return getStored<ActivityLog[]>(STORAGE_KEYS.LOGS, []);
  },
  saveLogs(logs: ActivityLog[]): void {
    setStored(STORAGE_KEYS.LOGS, logs);
  },

  getCurrentUserId(): string {
    return getStored<string>(STORAGE_KEYS.CURRENT_USER_ID, '');
  },
  saveCurrentUserId(id: string): void {
    setStored(STORAGE_KEYS.CURRENT_USER_ID, id);
  },

  resetAllToDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.BOOKS);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.LOANS);
    localStorage.removeItem(STORAGE_KEYS.RESERVATIONS);
    localStorage.removeItem(STORAGE_KEYS.FINES);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  },

  exportFullBackup(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      books: this.getBooks(),
      members: this.getMembers(),
      loans: this.getLoans(),
      reservations: this.getReservations(),
      fines: this.getFines(),
      users: this.getUsers(),
      settings: this.getSettings(),
      logs: this.getLogs(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackup(jsonString: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.books || !data.members || !data.settings) {
        return { success: false, error: 'Invalid backup file structure.' };
      }
      if (Array.isArray(data.books)) this.saveBooks(data.books);
      if (Array.isArray(data.members)) this.saveMembers(data.members);
      if (Array.isArray(data.loans)) this.saveLoans(data.loans);
      if (Array.isArray(data.reservations)) this.saveReservations(data.reservations);
      if (Array.isArray(data.fines)) this.saveFines(data.fines);
      if (Array.isArray(data.users)) this.saveUsers(data.users);
      if (data.settings) this.saveSettings(data.settings);
      if (Array.isArray(data.logs)) this.saveLogs(data.logs);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to parse JSON file' };
    }
  }
};
