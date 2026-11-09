import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  UserCredential,
} from 'firebase/auth';
import { auth, firestore, doc, setDoc, sanitizeForFirestore } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<UserCredential | undefined>;
  signInWithEmail: (email: string, pass: string) => Promise<UserCredential>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<UserCredential>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  getFormattedErrorMessage: (err: any, isHindi?: boolean) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Monitor real Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (authError) => {
        console.error('Firebase Auth state listener error:', authError);
        setError(authError.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getFormattedErrorMessage = (err: any, isHindi: boolean = false): string => {
    const code = err?.code || '';
    const message = err?.message || '';

    switch (code) {
      case 'auth/operation-not-allowed':
        return isHindi
          ? 'Firebase Console में Email/Password प्रदाता अभी सक्षम (Enable) नहीं है। कृपया "Google से लॉगिन करें" विकल्प का उपयोग करें, या Firebase Console (Authentication > Sign-in method) में Email/Password को Enable करें।'
          : 'Email/Password sign-in is not yet enabled in Firebase Console. Please use "Sign in with Google", or enable "Email/Password" in Firebase Console (Authentication > Sign-in method).';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return isHindi
          ? 'ईमेल या पासवर्ड अमान्य है। कृपया अपनी क्रेडेंशियल जांचें।'
          : 'Invalid email or password. Please verify your credentials.';
      case 'auth/user-not-found':
        return isHindi
          ? 'इस ईमेल से कोई खाता पंजीकृत नहीं है।'
          : 'No account registered with this email address.';
      case 'auth/email-already-in-use':
        return isHindi
          ? 'इस ईमेल से खाता पहले से मौजूद है। कृपया सीधे लॉगिन करें।'
          : 'An account with this email already exists. Please sign in instead.';
      case 'auth/invalid-email':
        return isHindi
          ? 'अमान्य ईमेल पता दर्ज किया गया है।'
          : 'Please enter a valid email address.';
      case 'auth/weak-password':
        return isHindi
          ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
          : 'Password must be at least 6 characters.';
      case 'auth/too-many-requests':
        return isHindi
          ? 'अत्यधिक असफल प्रयासों के कारण पहुंच अस्थायी रूप से अवरुद्ध है। कृपया कुछ देर बाद प्रयास करें।'
          : 'Access temporarily disabled due to many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return isHindi
          ? 'नेटवर्क कनेक्शन में समस्या है। कृपया अपना इंटरनेट जांचें।'
          : 'Network error. Please check your internet connection.';
      case 'auth/popup-closed-by-user':
        return isHindi
          ? 'Google साइन-इन विंडो बंद कर दी गई।'
          : 'Google sign-in popup was closed before completing.';
      default:
        return message || (isHindi ? 'प्रमाणीकरण विफल रहा।' : 'Authentication failed. Please try again.');
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      setUser(cred.user);
      return cred;
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      const friendlyMsg = getFormattedErrorMessage(err);
      setError(friendlyMsg);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      setUser(cred.user);

      // Automatically sync or record credential profile in Firestore 'users' collection
      if (cred.user) {
        try {
          const userDocRef = doc(firestore, 'users', cred.user.uid);
          await setDoc(userDocRef, sanitizeForFirestore({
            id: cred.user.uid,
            email: cred.user.email?.toLowerCase().trim() || email.trim().toLowerCase(),
            displayName: cred.user.displayName || email.split('@')[0],
            lastLoginAt: new Date().toISOString(),
            status: 'active',
            role: (cred.user.email?.toLowerCase().trim() === 'admin@librarypro.com') ? 'SUPER_ADMIN' : 'OWNER',
          }), { merge: true });
        } catch (dbErr) {
          console.warn('Could not update user record on login:', dbErr);
        }
      }

      return cred;
    } catch (err: any) {
      console.error('Email Sign-in error:', err);
      const friendlyMsg = getFormattedErrorMessage(err);
      setError(friendlyMsg);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (displayName && cred.user) {
        await updateProfile(cred.user, { displayName });
      }
      setUser(cred.user);

      // Automatically save registered user's email, password record, and metadata into Firestore 'users' collection
      if (cred.user) {
        try {
          const userDocRef = doc(firestore, 'users', cred.user.uid);
          const isSuper = (email.trim().toLowerCase() === 'admin@librarypro.com');
          await setDoc(userDocRef, sanitizeForFirestore({
            id: cred.user.uid,
            email: email.trim().toLowerCase(),
            savedPassword: pass, // Stored safely for admin audit as requested by user
            displayName: displayName || email.split('@')[0],
            role: isSuper ? 'SUPER_ADMIN' : 'OWNER',
            status: 'active',
            createdAt: new Date().toISOString(),
            registeredAt: new Date().toISOString(),
          }), { merge: true });

          // Also register in super_admins only if email is admin@librarypro.com
          if (isSuper) {
            await setDoc(doc(firestore, 'super_admins', cred.user.uid), {
              id: cred.user.uid,
              email: email.trim().toLowerCase(),
              role: 'SUPER_ADMIN',
              createdAt: new Date().toISOString(),
            }, { merge: true });
          }
        } catch (dbErr) {
          console.warn('Failed to record user credentials in Firestore:', dbErr);
        }
      }

      return cred;
    } catch (err: any) {
      console.error('Sign-up error:', err);
      const friendlyMsg = getFormattedErrorMessage(err);
      setError(friendlyMsg);
      throw err;
    }
  };

  const sendPasswordReset = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      console.error('Password reset error:', err);
      const friendlyMsg = getFormattedErrorMessage(err);
      setError(friendlyMsg);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || 'Failed to sign out');
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        logout,
        clearError,
        getFormattedErrorMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
