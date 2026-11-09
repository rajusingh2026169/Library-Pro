import React, { useState } from 'react';
import {
  BookOpen,
  Lock,
  Mail,
  Eye,
  EyeOff,
  User as UserIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
  ArrowRight,
  Database,
  KeyRound,
  Building2,
  Phone,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { firebaseConfig } from '../../services/firebase';
import { LibraryPlan } from '../../types';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordReset,
    getFormattedErrorMessage,
  } = useAuth();

  const { registerLibrary } = useTenant();

  const [mode, setMode] = useState<'signin' | 'register_library' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [language, setLanguage] = useState<'hi' | 'en'>('en');

  // Multi-Tenant Library Registration fields
  const [libName, setLibName] = useState('');
  const [libCode, setLibCode] = useState('');
  const [libOwnerName, setLibOwnerName] = useState('');
  const [libEmail, setLibEmail] = useState('');
  const [libPhone, setLibPhone] = useState('');
  const [libCity, setLibCity] = useState('');
  const [libPlan, setLibPlan] = useState<LibraryPlan>('pro');

  const isHindi = language === 'hi';

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !password) {
      setErrorMessage(
        isHindi
          ? 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें।'
          : 'Please enter both your email and password.'
      );
      return;
    }

    setIsLoading(true);
    try {
      try {
        await signInWithEmail(email, password);
      } catch (signInErr: any) {
        // If the user doesn't exist yet (e.g. initial super admin first-time sign-in), auto-create in Firebase Auth
        if (
          signInErr?.code === 'auth/user-not-found' ||
          signInErr?.code === 'auth/invalid-credential' && email.trim().toLowerCase() === 'admin@librarypro.com'
        ) {
          try {
            await signUpWithEmail(email.trim(), password, 'Super Administrator');
          } catch (signUpErr) {
            // If sign up fails because user actually exists, rethrow original sign-in error
            throw signInErr;
          }
        } else {
          throw signInErr;
        }
      }
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(getFormattedErrorMessage(err, isHindi));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!libName.trim() || !libCode.trim() || !libOwnerName.trim() || !libEmail.trim() || !password) {
      setErrorMessage(
        isHindi
          ? 'कृपया सभी आवश्यक फ़ील्ड (पुस्तकालय नाम, कोड, संचालक नाम, ईमेल, पासवर्ड) भरें।'
          : 'Please fill in all required library registration fields.'
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        isHindi
          ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
          : 'Password must be at least 6 characters long.'
      );
      return;
    }

    setIsLoading(true);
    try {
      // 1. Provision new library tenant in Firestore
      const regRes = await registerLibrary({
        name: libName.trim(),
        code: libCode.trim().toUpperCase(),
        ownerName: libOwnerName.trim(),
        ownerEmail: libEmail.trim().toLowerCase(),
        phone: libPhone.trim(),
        plan: libPlan,
        city: libCity.trim(),
        password: password,
      });

      if (!regRes.success) {
        throw new Error(regRes.error || 'Failed to provision library record');
      }

      // 2. Create user in Firebase Auth
      await signUpWithEmail(libEmail.trim(), password, libOwnerName.trim());

      setSuccessMessage(
        isHindi
          ? `पुस्तकालय "${libName}" सफलतापूर्वक पंजीकृत हो गया! डैशबोर्ड लोड हो रहा है...`
          : `Library "${libName}" registered successfully! Redirecting to dashboard...`
      );
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(getFormattedErrorMessage(err, isHindi));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim()) {
      setErrorMessage(
        isHindi
          ? 'कृपया पासवर्ड रीसेट के लिए अपना ईमेल दर्ज करें।'
          : 'Please enter your email to receive a password reset link.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setSuccessMessage(
        isHindi
          ? `पासवर्ड रीसेट लिंक ${email} पर भेज दिया गया है। अपना इनबॉक्स चेक करें।`
          : `Password reset email sent to ${email}. Check your inbox.`
      );
    } catch (err: any) {
      setErrorMessage(getFormattedErrorMessage(err, isHindi));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearMessages();
    setIsLoading(true);
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(getFormattedErrorMessage(err, isHindi));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/40">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-white font-black text-lg tracking-tight">LibraryPro SaaS</span>
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Production Cloud
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <span>🌐</span>
            <span>{isHindi ? 'English' : 'आसान हिंदी'}</span>
          </button>
        </div>
      </div>

      {/* Main card grid */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left column: SaaS Information */}
        <div className="lg:col-span-5 space-y-6 text-left hidden lg:block">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-Tenant Architecture Live</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              {isHindi ? (
                <>आधुनिक लाइब्रेरी और <br /><span className="text-indigo-400">रीडिंग रूम प्रबंधन SaaS</span></>
              ) : (
                <>Modern Library & <br /><span className="text-indigo-400">Reading Room SaaS</span></>
              )}
            </h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              {isHindi
                ? 'प्रत्येक लाइब्रेरी संस्थान का डेटा (किताबें, छात्र, सीटें, हाजिरी और फीस) पूरी तरह अलग और सुरक्षित रहता है। केवल वास्तविक डेटा क्लाउड डेटाबेस में संग्रहित होता है।'
                : 'Each library institution operates with complete data isolation. Real-time persistent Cloud Firestore storage and role-based permissions.'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {isHindi ? 'स्वतंत्र लाइब्रेरी पंजीकरण' : 'Self-Serve Library Registration'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isHindi
                    ? 'संस्थान अपना खाता बनाकर अपने डेस्क, फीस व कैटलॉग का स्वयं प्रबंधन कर सकते हैं।'
                    : 'Institutions register their own branch with auto-provisioned seats and policies.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {isHindi ? 'सख्त डेटा सुरक्षा व पृथक्करण' : 'Tenant Data Isolation'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isHindi
                    ? 'एक लाइब्रेरी का डेटा दूसरी लाइब्रेरी के उपयोगकर्ताओं के लिए पूरी तरह अदृश्य और सुरक्षित है।'
                    : 'Server-side libraryId partitioning prevents any cross-tenant data access.'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-mono">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              {firebaseConfig.projectId}
            </span>
            <span>•</span>
            <span>Firestore Live</span>
          </div>
        </div>

        {/* Right column: Form Box */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 relative">
            {/* Header Tabs */}
            <div className="flex items-center p-1 bg-slate-950 rounded-2xl mb-6 border border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  clearMessages();
                }}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isHindi ? 'लॉगिन (Sign In)' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register_library');
                  clearMessages();
                }}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'register_library'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-indigo-400 hover:text-indigo-300'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{isHindi ? '+ पुस्तकालय जोड़ें' : '+ Register Library'}</span>
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in-50 duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <p className="font-semibold text-rose-300">
                    {isHindi ? 'प्रमाणीकरण त्रुटि / सूचना' : 'Authentication Notice'}
                  </p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-200 text-sm font-bold cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in-50 duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <p className="font-semibold text-emerald-300">
                    {isHindi ? 'सफल' : 'Success'}
                  </p>
                  <p>{successMessage}</p>
                </div>
              </div>
            )}

            {/* TAB 1: Real Sign In */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {isHindi ? 'ईमेल पता' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@library.com or your-email@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      {isHindi ? 'पासवर्ड' : 'Password'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        clearMessages();
                      }}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                    >
                      {isHindi ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isHindi ? 'प्रमाणीकरण हो रहा है...' : 'Authenticating...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isHindi ? 'डैशबोर्ड में प्रवेश करें' : 'Sign In to Dashboard'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: Real Multi-Tenant Library Registration */}
            {mode === 'register_library' && (
              <form onSubmit={handleRegisterLibrary} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isHindi ? 'पुस्तकालय / संस्थान का नाम *' : 'Library / Institution Name *'}
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={libName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLibName(val);
                        if (!libCode) {
                          setLibCode(val.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase());
                        }
                      }}
                      placeholder="e.g. Saraswati Reading Room & Library"
                      className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isHindi ? 'ब्रांच कोड (Code) *' : 'Branch Code *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={libCode}
                      onChange={(e) => setLibCode(e.target.value.toUpperCase())}
                      placeholder="SARAS-01"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isHindi ? 'SaaS प्लान' : 'Membership Plan'}
                    </label>
                    <select
                      value={libPlan}
                      onChange={(e) => setLibPlan(e.target.value as LibraryPlan)}
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="starter">Starter (15 Seats)</option>
                      <option value="pro">Pro (30 Seats)</option>
                      <option value="enterprise">Enterprise (60 Seats)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isHindi ? 'संचालक / ओनर का नाम *' : 'Owner / Director Name *'}
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={libOwnerName}
                        onChange={(e) => setLibOwnerName(e.target.value)}
                        placeholder="e.g. Ramesh Chandra"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isHindi ? 'ईमेल पता *' : 'Owner Email *'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={libEmail}
                        onChange={(e) => setLibEmail(e.target.value)}
                        placeholder="owner@library.com"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isHindi ? 'मोबाइल नंबर' : 'Phone Number'}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        value={libPhone}
                        onChange={(e) => setLibPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isHindi ? 'शहर (City)' : 'City'}
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={libCity}
                        onChange={(e) => setLibCity(e.target.value)}
                        placeholder="e.g. Lucknow"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isHindi ? 'पासवर्ड बनाएं *' : 'Create Account Password *'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isHindi ? 'पुस्तकालय पंजीकृत हो रहा है...' : 'Provisioning Library Tenant...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isHindi ? 'नया पुस्तकालय रजिस्टर करें व शुरू करें' : 'Register Library & Launch Dashboard'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: Forgot Password Form */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2.5 mb-2">
                  <KeyRound className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {isHindi
                      ? 'अपना पंजीकृत ईमेल पता दर्ज करें। हम आपको सुरक्षित पासवर्ड रीसेट लिंक भेजेंगे।'
                      : 'Enter your registered email address and we will send you a password reset link.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {isHindi ? 'ईमेल पता' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your-email@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>{isHindi ? 'रीसेट लिंक भेजें' : 'Send Reset Link'}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      clearMessages();
                    }}
                    className="py-3 px-4 rounded-xl font-semibold text-xs text-slate-400 hover:text-white bg-slate-950 border border-slate-800 transition cursor-pointer"
                  >
                    {isHindi ? 'वापस' : 'Back to Login'}
                  </button>
                </div>
              </form>
            )}

            {/* Social Google Sign In Divider */}
            {mode !== 'forgot' && (
              <>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-slate-900 px-3 text-slate-500 font-semibold">
                      {isHindi ? 'या इसके माध्यम से जारी रखें' : 'Or continue with'}
                    </span>
                  </div>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-200 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isHindi ? 'Google से सुरक्षित लॉगिन करें' : 'Sign in with Google'}</span>
                </button>
              </>
            )}

            {/* Footer Multi-Tenant info */}
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                {isHindi ? 'सख्त डेटा पृथक्करण (Multi-Tenant RBAC)' : 'Multi-Tenant RBAC'}
              </span>
              <span>Production Suite</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
