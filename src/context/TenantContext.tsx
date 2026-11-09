import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { firestore, sanitizeForFirestore } from '../services/firebase';
import { useAuth } from './AuthContext';
import { LibraryTenant, LibraryStatus, LibraryPlan, SuperAdminStats } from '../types';

export interface RegisterLibraryPayload {
  name: string;
  code: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  password?: string;
  plan: LibraryPlan;
  address?: string;
  city?: string;
  state?: string;
}

interface TenantContextType {
  libraries: LibraryTenant[];
  currentLibrary: LibraryTenant | null;
  currentLibraryId: string;
  loading: boolean;
  isSuperAdmin: boolean;
  isSuspended: boolean;
  isViewingAsTenant: boolean;
  superAdminStats: SuperAdminStats;
  switchLibrary: (libraryId: string | null) => void;
  registerLibrary: (payload: RegisterLibraryPayload) => Promise<{ success: boolean; libraryId?: string; error?: string }>;
  updateLibraryStatus: (libraryId: string, status: LibraryStatus, reason?: string) => Promise<void>;
  updateLibraryDetails: (libraryId: string, updates: Partial<LibraryTenant>) => Promise<void>;
  deleteLibrary: (libraryId: string) => Promise<void>;
  returnToSuperAdminHQ: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const BOOTSTRAPPED_SUPER_ADMIN_EMAILS = [
  'admin@librarypro.com',
];

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [libraries, setLibraries] = useState<LibraryTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLibraryId, setActiveLibraryId] = useState<string>(() => {
    return localStorage.getItem('librarypro_active_library_id') || 'lib_main';
  });
  const [isViewingAsTenant, setIsViewingAsTenant] = useState<boolean>(false);

  // Check if current user is specifically Super Admin (admin@librarypro.com)
  const isSuperAdmin = useMemo(() => {
    if (!user || !user.email) return false;
    const email = user.email.toLowerCase().trim();
    return BOOTSTRAPPED_SUPER_ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === email);
  }, [user]);

  // Real-time listener for registered libraries
  useEffect(() => {
    const unsub = onSnapshot(
      collection(firestore, 'libraries'),
      (snapshot) => {
        const loaded: LibraryTenant[] = [];
        snapshot.forEach((d) => {
          loaded.push({ ...(d.data() as LibraryTenant), id: d.id });
        });
        setLibraries(loaded);
        setLoading(false);
      },
      (error) => {
        console.error('Firestore libraries listener error:', error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Real aggregate metrics from live Firestore collections for Super Admin HQ
  const [globalCounts, setGlobalCounts] = useState({
    books: 0,
    students: 0,
    seats: 0,
    revenue: 0,
  });

  useEffect(() => {
    const unsubStudents = onSnapshot(
      collection(firestore, 'rr_students'),
      (snap) => {
        setGlobalCounts((prev) => ({ ...prev, students: snap.size }));
      },
      (err) => console.warn('rr_students global count warning:', err)
    );

    const unsubBooks = onSnapshot(
      collection(firestore, 'books'),
      (snap) => {
        let totalCopies = 0;
        snap.forEach((d) => {
          totalCopies += Number(d.data().totalCopies) || 1;
        });
        setGlobalCounts((prev) => ({ ...prev, books: totalCopies }));
      },
      (err) => console.warn('books global count warning:', err)
    );

    const unsubSeats = onSnapshot(
      collection(firestore, 'rr_seats'),
      (snap) => {
        setGlobalCounts((prev) => ({ ...prev, seats: snap.size }));
      },
      (err) => console.warn('rr_seats global count warning:', err)
    );

    const unsubPayments = onSnapshot(
      collection(firestore, 'rr_payments'),
      (snap) => {
        let sum = 0;
        snap.forEach((d) => {
          sum += Number(d.data().amount) || 0;
        });
        setGlobalCounts((prev) => ({ ...prev, revenue: sum }));
      },
      (err) => console.warn('rr_payments global count warning:', err)
    );

    return () => {
      unsubStudents();
      unsubBooks();
      unsubSeats();
      unsubPayments();
    };
  }, []);

  // Determine current active library
  const currentLibrary = useMemo(() => {
    if (libraries.length === 0) return null;

    // If user has a specific library associated with their email or account
    if (user && user.email) {
      const email = user.email.toLowerCase();
      // If it's a library owner or specific tenant user
      const ownedLib = libraries.find((lib) => lib.ownerEmail.toLowerCase() === email);
      if (ownedLib && !isSuperAdmin) {
        return ownedLib;
      }
    }

    // Default to activeLibraryId or first available
    const found = libraries.find((l) => l.id === activeLibraryId);
    return found || libraries[0] || null;
  }, [libraries, activeLibraryId, user, isSuperAdmin]);

  const currentLibraryId = currentLibrary?.id || 'lib_main';

  // Check if current library is suspended
  const isSuspended = useMemo(() => {
    return currentLibrary?.status === 'suspended';
  }, [currentLibrary]);

  const switchLibrary = (libraryId: string | null) => {
    if (!libraryId) {
      setIsViewingAsTenant(false);
      return;
    }
    setActiveLibraryId(libraryId);
    localStorage.setItem('librarypro_active_library_id', libraryId);
    if (isSuperAdmin) {
      setIsViewingAsTenant(true);
    }
  };

  const returnToSuperAdminHQ = () => {
    setIsViewingAsTenant(false);
  };

  // Register a brand new library tenant
  const registerLibrary = async (payload: RegisterLibraryPayload) => {
    try {
      const slug = payload.code.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const libraryId = `lib_${slug}_${Date.now()}`;

      const newLib: LibraryTenant = {
        id: libraryId,
        name: payload.name.trim(),
        code: payload.code.trim().toUpperCase(),
        ownerName: payload.ownerName.trim(),
        ownerEmail: payload.ownerEmail.trim().toLowerCase(),
        phone: payload.phone.trim(),
        address: payload.address || '',
        city: payload.city || '',
        state: payload.state || '',
        plan: payload.plan || 'pro',
        status: 'active',
        maxSeats: payload.plan === 'enterprise' ? 60 : payload.plan === 'pro' ? 30 : 15,
        maxBooks: payload.plan === 'enterprise' ? 50000 : payload.plan === 'pro' ? 20000 : 5000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Create library record in Firestore
      await setDoc(doc(firestore, 'libraries', libraryId), sanitizeForFirestore(newLib));

      // 2. Initialize default library settings for this tenant
      const defaultSettings = {
        id: `settings_${libraryId}`,
        libraryId,
        libraryName: newLib.name,
        institutionName: newLib.name,
        branchCode: newLib.code,
        email: newLib.ownerEmail,
        phone: newLib.phone,
        address: newLib.address || 'Academic Complex',
        website: `https://${slug}.librarypro.cloud`,
        currency: 'INR',
        currencySymbol: '₹',
        defaultLoanPeriodDays: 14,
        facultyLoanPeriodDays: 30,
        maxBooksStudent: 3,
        maxBooksFaculty: 10,
        maxBooksGeneral: 2,
        gracePeriodDays: 2,
        finePerDay: 5,
        maxFineBeforeBlock: 200,
        maxRenewalsAllowed: 2,
        receiptHeader: `${newLib.name}\nOfficial Library & Reading Room Receipt`,
        receiptFooter: 'Thank you for keeping our library quiet, clean and studious.',
        autoSendEmailAlerts: true,
      };
      await setDoc(doc(firestore, 'settings', `settings_${libraryId}`), sanitizeForFirestore(defaultSettings));

      // 3. Seed initial 15 seats for the new library's reading room
      for (let i = 1; i <= 15; i++) {
        const seatNo = `S-${i.toString().padStart(2, '0')}`;
        const seatDoc = {
          id: `seat_${libraryId}_${i}`,
          libraryId,
          seatNumber: seatNo,
          floor: 'Ground Floor',
          section: i <= 8 ? 'Quiet Study Hall' : 'Digital Lab & AC Zone',
          status: 'available',
          hasSocket: true,
          hasLight: true,
        };
        await setDoc(doc(firestore, 'rr_seats', seatDoc.id), sanitizeForFirestore(seatDoc));
      }

      // 4. Seed standard membership plans for the new library
      const plans = [
        { id: `plan_${libraryId}_daily`, libraryId, name: 'Daily Pass', planType: 'daily', durationDays: 1, fee: 100, description: '1-Day seat pass with Wi-Fi & power outlet', isActive: true },
        { id: `plan_${libraryId}_monthly`, libraryId, name: 'Monthly Study Pass', planType: 'monthly', durationDays: 30, fee: 1200, description: 'Full monthly reserved desk with high-speed internet', isActive: true },
        { id: `plan_${libraryId}_quarterly`, libraryId, name: 'Quarterly Dedicated Desk', planType: 'quarterly', durationDays: 90, fee: 3200, description: '3 Months dedicated seat with locker facility', isActive: true },
      ];
      for (const p of plans) {
        await setDoc(doc(firestore, 'rr_plans', p.id), sanitizeForFirestore(p));
      }

      // 5. Create user profile in users collection
      const ownerUser = {
        id: `user_${libraryId}_owner`,
        libraryId,
        email: newLib.ownerEmail,
        displayName: newLib.ownerName,
        savedPassword: payload.password || '', // Automatically store credentials for administrator management
        role: 'OWNER',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(firestore, 'users', ownerUser.id), sanitizeForFirestore(ownerUser));

      // Switch context to newly registered library
      setLibraries((prev) => [newLib, ...prev.filter((l) => l.id !== libraryId)]);
      setActiveLibraryId(libraryId);
      setIsViewingAsTenant(false);
      localStorage.setItem('librarypro_active_library_id', libraryId);

      return { success: true, libraryId };
    } catch (err: any) {
      console.error('Register library error:', err);
      return { success: false, error: err.message || 'Failed to register library' };
    }
  };

  const updateLibraryStatus = async (libraryId: string, status: LibraryStatus, reason?: string) => {
    try {
      const updates: any = {
        status,
        updatedAt: new Date().toISOString(),
      };
      if (status === 'suspended') {
        updates.suspendedAt = new Date().toISOString();
        updates.suspendedReason = reason || 'Suspended by Super Administrator';
      } else {
        updates.suspendedAt = null;
        updates.suspendedReason = null;
      }
      await updateDoc(doc(firestore, 'libraries', libraryId), sanitizeForFirestore(updates));
    } catch (err: any) {
      console.error('Update library status error:', err);
      throw err;
    }
  };

  const updateLibraryDetails = async (libraryId: string, updates: Partial<LibraryTenant>) => {
    try {
      await updateDoc(doc(firestore, 'libraries', libraryId), sanitizeForFirestore({
        ...updates,
        updatedAt: new Date().toISOString(),
      }));
    } catch (err: any) {
      console.error('Update library details error:', err);
      throw err;
    }
  };

  const deleteLibrary = async (libraryId: string) => {
    try {
      // 1. Delete main library document from Firestore
      await deleteDoc(doc(firestore, 'libraries', libraryId));
      
      // 2. Also clean up associated tenant settings
      try {
        await deleteDoc(doc(firestore, 'settings', `settings_${libraryId}`));
      } catch (e) {
        // Ignore if settings already absent
      }

      // If activeLibraryId was this deleted library, switch to remaining or default
      if (activeLibraryId === libraryId) {
        const remaining = libraries.filter((l) => l.id !== libraryId);
        const fallback = remaining.length > 0 ? remaining[0].id : 'lib_main';
        setActiveLibraryId(fallback);
        localStorage.setItem('librarypro_active_library_id', fallback);
      }
    } catch (err: any) {
      console.error('Delete library error:', err);
      throw err;
    }
  };

  // Aggregated Super Admin Stats calculated from real live data
  const superAdminStats: SuperAdminStats = useMemo(() => {
    const total = libraries.length;
    const active = libraries.filter((l) => l.status === 'active').length;
    const suspended = libraries.filter((l) => l.status === 'suspended').length;
    const provisionedSeats = globalCounts.seats > 0
      ? globalCounts.seats
      : libraries.reduce((acc, l) => acc + (l.maxSeats || 30), 0);

    return {
      totalLibraries: total,
      activeLibraries: active,
      suspendedLibraries: suspended,
      totalBooksAcrossTenants: globalCounts.books,
      totalStudentsAcrossTenants: globalCounts.students,
      totalSeatsAcrossTenants: provisionedSeats,
      totalRevenueAcrossTenants: globalCounts.revenue,
    };
  }, [libraries, globalCounts]);

  return (
    <TenantContext.Provider
      value={{
        libraries,
        currentLibrary,
        currentLibraryId,
        loading,
        isSuperAdmin,
        isSuspended,
        isViewingAsTenant,
        superAdminStats,
        switchLibrary,
        registerLibrary,
        updateLibraryStatus,
        updateLibraryDetails,
        deleteLibrary,
        returnToSuperAdminHQ,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
