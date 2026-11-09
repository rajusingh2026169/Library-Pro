import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  PlusCircle,
  CornerDownLeft,
  Bell,
  Database,
  User,
  Shield,
  ChevronDown,
  Book,
  Users as UsersIcon,
  Check,
  AlertTriangle,
  LogIn,
  LogOut,
  Flame,
  Building2,
  Crown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { Role } from '../../types';
import { firebaseConfig } from '../../services/firebase';

interface TopbarProps {
  onOpenMobileSidebar: () => void;
  onOpenQuickIssue: () => void;
  onOpenQuickReturn: () => void;
  onSelectBookResult?: (bookId: string) => void;
  onSelectMemberResult?: (memberId: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileSidebar,
  onOpenQuickIssue,
  onOpenQuickReturn,
  onSelectBookResult,
  onSelectMemberResult,
}) => {
  const {
    currentUser,
    setCurrentUserRole,
    users,
    books,
    members,
    loans,
    settings,
    addToast,
    language,
    setLanguage,
  } = useApp();
  const { user: authUser, signInWithGoogle, logout: authLogout } = useAuth();
  const { currentLibrary, isSuperAdmin, returnToSuperAdminHQ } = useTenant();
  const isHindi = language === 'hi';

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter books & members for search dropdown
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return { books: [], members: [] };
    const q = searchQuery.toLowerCase();
    const matchedBooks = books
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.isbn.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const matchedMembers = members
      .filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.memberCode.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
      )
      .slice(0, 4);

    return { books: matchedBooks, members: matchedMembers };
  }, [searchQuery, books, members]);

  // Overdue loans list for notifications
  const overdueLoans = loans.filter((l) => l.status === 'overdue');

  const roleLabels: Record<Role, string> = {
    SUPER_ADMIN: 'Super Admin',
    OWNER: 'Library Owner',
    LIBRARIAN: 'Librarian',
    ASSISTANT: 'Assistant',
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search with instant autocomplete */}
        <div ref={searchRef} className="relative flex-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder={isHindi ? "किताब का नाम, ISBN नंबर या छात्र का नाम / कोड खोजें..." : "Search books by title, ISBN, author or members by code..."}
              className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl border border-transparent focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-hidden"
            />
          </div>

          {/* Autocomplete dropdown */}
          {isSearchFocused && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150">
              {searchResults.books.length === 0 && searchResults.members.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No matching books or members found for "{searchQuery}"
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.books.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Book className="w-3 h-3" /> Books ({searchResults.books.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.books.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => {
                              onSelectBookResult?.(b.id);
                              setIsSearchFocused(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-800 truncate">{b.title}</p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {b.author} • ISBN: {b.isbn}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                b.availableCopies > 0
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {b.availableCopies} avail
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.members.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <UsersIcon className="w-3 h-3" /> Members ({searchResults.members.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.members.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              onSelectMemberResult?.(m.id);
                              setIsSearchFocused(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-800 truncate">{m.fullName}</p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {m.memberCode} • {m.department}
                              </p>
                            </div>
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {m.memberType}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Library Tenant Info Pill */}
        {currentLibrary && (
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 text-xs">
            <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <div className="text-left leading-tight">
              <span className="font-bold text-slate-800 truncate block max-w-[130px]">{currentLibrary.name}</span>
              <span className="text-[10px] text-slate-500 font-mono">{currentLibrary.code}</span>
            </div>
          </div>
        )}

        {/* Super Admin Switch back to HQ Button */}
        {isSuperAdmin && (
          <button
            onClick={returnToSuperAdminHQ}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs active:scale-98"
            title="Return to Super Admin HQ Console"
          >
            <Crown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SaaS HQ</span>
          </button>
        )}

        {/* Firestore Live Indicator Pill */}
        <div 
          title={`Firestore Connected: ${firebaseConfig.firestoreDatabaseId}`}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-medium text-[11px]">Firestore: Live</span>
        </div>

        {/* Language Switcher */}
        <button
          onClick={() => {
            const next = language === 'hi' ? 'en' : 'hi';
            setLanguage(next);
            addToast({
              type: 'info',
              title: next === 'hi' ? 'भाषा: आसान हिंदी' : 'Language: English',
              message: next === 'hi' ? 'सभी विकल्प अब आसान हिंदी भाषा में उपलब्ध हैं।' : 'Switched to English interface.',
            });
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
          title="Change language / भाषा बदलें"
        >
          <span>🌐</span>
          <span className="font-semibold">{isHindi ? 'आसान हिंदी' : 'English'}</span>
        </button>

        {/* Quick Issue & Return Buttons */}
        <button
          onClick={onOpenQuickIssue}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer active:scale-98"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isHindi ? 'किताब दें (Issue)' : 'Issue Book'}</span>
        </button>

        <button
          onClick={onOpenQuickReturn}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer active:scale-98"
        >
          <CornerDownLeft className="w-4 h-4 text-slate-500" />
          <span>{isHindi ? 'किताब लें (Return)' : 'Return Book'}</span>
        </button>

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {overdueLoans.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Alerts & Overdue</span>
                <span className="text-[11px] font-semibold text-rose-600">
                  {overdueLoans.length} Overdue
                </span>
              </div>

              {overdueLoans.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No overdue items right now. All circulation loans in good standing!
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {overdueLoans.map((loan) => (
                    <div key={loan.id} className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 text-xs">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 truncate">{loan.bookTitle}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            Patron: {loan.memberName} ({loan.memberCode})
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] font-semibold text-rose-700">
                            <span>Due: {new Date(loan.dueDate).toLocaleDateString()}</span>
                            <span>Fine: {settings.currencySymbol}{loan.fineAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile & Role Switcher */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-200 shrink-0">
              {currentUser.displayName.charAt(0)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                {currentUser.displayName}
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                {roleLabels[currentUser.role]}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50">
              <div className="pb-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser.displayName}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                    <Shield className="w-3 h-3" />
                    {roleLabels[currentUser.role]}
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    <Database className="w-3 h-3" />
                    Firestore Active
                  </div>
                </div>
                <div className="mt-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-[10px] text-slate-600 space-y-0.5">
                  <p className="font-semibold text-slate-700">Project: <span className="font-mono text-slate-600">{firebaseConfig.projectId}</span></p>
                  <p className="truncate font-semibold text-slate-700" title={firebaseConfig.firestoreDatabaseId}>
                    DB: <span className="font-mono text-slate-500">{firebaseConfig.firestoreDatabaseId}</span>
                  </p>
                </div>
              </div>

              {/* Firebase Authentication Status */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-500" /> Firebase Auth
                  </span>
                  {authUser ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Connected
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Offline</span>
                  )}
                </div>

                {authUser ? (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 mb-2 text-xs">
                    <p className="font-bold text-slate-800 truncate">{authUser.displayName || 'Firebase User'}</p>
                    <p className="text-[10px] text-slate-500 truncate font-mono">{authUser.email}</p>
                    <button
                      onClick={async () => {
                        try {
                          await authLogout();
                          addToast({ type: 'info', title: 'Signed out of Firebase' });
                        } catch (err: any) {
                          addToast({ type: 'error', title: 'Sign out failed', message: err.message });
                        }
                      }}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        const res = await signInWithGoogle();
                        if (res) {
                          addToast({
                            type: 'success',
                            title: 'Signed in with Firebase',
                            message: `Welcome ${res.user.displayName || res.user.email}!`,
                          });
                        }
                      } catch (err: any) {
                        addToast({ type: 'error', title: 'Sign-in failed', message: err.message });
                      }
                    }}
                    className="w-full mb-2 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-indigo-600" />
                    Sign In with Google
                  </button>
                )}
              </div>

              {/* Active Verified Role */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Verified Role & Access
                </p>
                <div className="px-2.5 py-2 rounded-lg bg-indigo-50/80 border border-indigo-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900">{roleLabels[currentUser.role] || currentUser.role}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-indigo-600 text-white">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Direct Sign Out Button */}
        <button
          onClick={async () => {
            try {
              await authLogout();
              addToast({
                type: 'info',
                title: isHindi ? 'लॉगआउट' : 'Signed Out',
                message: isHindi ? 'सत्र समाप्त हो गया।' : 'You have been signed out.',
              });
            } catch (err: any) {
              addToast({ type: 'error', title: 'Sign out failed', message: err.message });
            }
          }}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          title={isHindi ? 'लॉगआउट करें (Sign Out)' : 'Sign Out'}
          aria-label="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
