import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Repeat,
  BookmarkCheck,
  Receipt,
  BarChart3,
  ShieldCheck,
  Settings,
  History,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Sparkles,
  Armchair,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export type NavigationTab =
  | 'dashboard'
  | 'reading_room'
  | 'books'
  | 'members'
  | 'circulation'
  | 'reservations'
  | 'fines'
  | 'reports'
  | 'users'
  | 'settings'
  | 'activity';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { metrics, hasPermission, settings, language } = useApp();
  const { logout } = useAuth();

  const isHindi = language === 'hi';

  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: isHindi ? 'डैशबोर्ड (होम)' : 'Dashboard',
      subtitle: isHindi ? 'कुल रिपोर्ट व स्टेटस' : 'System Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'reading_room' as NavigationTab,
      label: isHindi ? 'रीडिंग रूम (Study Hall)' : 'Reading Room',
      subtitle: isHindi ? 'सीट, फीस व हाजिरी' : 'Seat Allocation & Desk',
      icon: Armchair,
      badge: 'Live',
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'books' as NavigationTab,
      label: isHindi ? 'किताबें (Books)' : 'Book Management',
      subtitle: isHindi ? 'नई किताब जोड़ें / देखें' : 'Book Catalog & Stock',
      icon: BookOpen,
      badge: metrics.totalBooks.toString(),
    },
    {
      id: 'members' as NavigationTab,
      label: isHindi ? 'छात्र व सदस्य (Members)' : 'Student / Member Management',
      subtitle: isHindi ? 'छात्र प्रोफाइल व कार्ड' : 'Patron Directory',
      icon: Users,
      badge: metrics.activeMembers.toString(),
    },
    {
      id: 'circulation' as NavigationTab,
      label: isHindi ? 'किताब देना / लेना (Issue & Return)' : 'Issue & Return System',
      subtitle: isHindi ? 'किताब जारी या जमा करें' : 'Circulation Desk',
      icon: Repeat,
      badge: metrics.overdueLoans > 0 ? (isHindi ? `${metrics.overdueLoans} लेट` : `${metrics.overdueLoans} overdue`) : `${metrics.issuedBooks}`,
      badgeColor: metrics.overdueLoans > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600',
    },
    {
      id: 'reservations' as NavigationTab,
      label: isHindi ? 'किताब बुकिंग (Book Holds)' : 'Book Reservations',
      subtitle: isHindi ? 'वेटिंग लिस्ट व रिज़र्वेशन' : 'Waitlist Queue',
      icon: BookmarkCheck,
      badge: metrics.activeReservations > 0 ? metrics.activeReservations.toString() : null,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'fines' as NavigationTab,
      label: isHindi ? 'जुर्माना व रसीद (Fees)' : 'Fines & Receipts',
      subtitle: isHindi ? 'लेट फीस जमा करें व रसीद' : 'Fee Collection',
      icon: Receipt,
      badge: metrics.pendingFines > 0 ? `${settings.currencySymbol}${metrics.pendingFines.toFixed(0)}` : null,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      id: 'reports' as NavigationTab,
      label: isHindi ? 'रिपोर्ट्स (Reports)' : 'Reports & Export',
      subtitle: isHindi ? 'डाउनलोड व प्रिंट' : 'Analytics & CSV',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'users' as NavigationTab,
      label: isHindi ? 'लाइब्रेरियन व स्टाफ (Staff)' : 'Staff & Roles',
      subtitle: isHindi ? 'स्टाफ अकाउंट व रोल्स' : 'Admin & Librarians',
      icon: ShieldCheck,
      badge: null,
      requiresPermission: 'SUPER_ADMIN' as const,
    },
    {
      id: 'activity' as NavigationTab,
      label: isHindi ? 'गतिविधि रिकॉर्ड (History)' : 'Activity History',
      subtitle: isHindi ? 'किसने क्या काम किया' : 'Audit Logs',
      icon: History,
      badge: null,
    },
    {
      id: 'settings' as NavigationTab,
      label: isHindi ? 'लाइब्रेरी सेटिंग्स (Settings)' : 'Library Settings',
      subtitle: isHindi ? 'नियम, फीस व बैकअप' : 'Policies & Backup',
      icon: Settings,
      badge: null,
      requiresPermission: 'LIBRARIAN' as const,
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out border-r border-slate-800 ${
          isCollapsed ? 'w-20' : 'w-68'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <BookMarked className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  LibraryPro
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Pro
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 truncate max-w-[140px] font-medium">
                  {settings.branchCode || 'Main Campus'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className={`px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${isCollapsed ? 'text-center' : ''}`}>
            {isCollapsed ? '—' : 'Main Menu'}
          </div>

          {navItems.map((item) => {
            if (item.requiresPermission && !hasPermission(item.requiresPermission)) {
              return null;
            }

            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer group relative ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <span className="block text-xs font-bold truncate leading-tight">{item.label}</span>
                    {item.subtitle && (
                      <span className="block text-[10px] opacity-70 truncate leading-tight mt-0.5">{item.subtitle}</span>
                    )}
                  </div>
                )}

                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      item.badgeColor || (isActive ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-300')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tooltip on collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-950 text-white text-xs font-semibold rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-800">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 pt-1 border-t border-slate-800/80">
          <button
            onClick={async () => {
              try {
                await logout();
              } catch (err) {
                console.error('Logout error:', err);
              }
            }}
            title={isCollapsed ? (isHindi ? 'लॉगआउट (Sign Out)' : 'Sign Out') : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition cursor-pointer ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
            {!isCollapsed && <span>{isHindi ? 'लॉगआउट (Sign Out)' : 'Sign Out'}</span>}
          </button>
        </div>

        {/* Footer info card */}
        {!isCollapsed ? (
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-300 font-medium">System Online</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">v2.4 LTS</span>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-slate-800/80 flex justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" title="System Online" />
          </div>
        )}
      </aside>
    </>
  );
};
