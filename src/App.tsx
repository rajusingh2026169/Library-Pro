import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { ReadingRoomProvider } from './context/ReadingRoomContext';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { ToastContainer } from './components/common/Toast';
import { LoginPage } from './components/auth/LoginPage';
import { TenantProvider, useTenant } from './context/TenantContext';
import { SuperAdminHQView } from './components/superAdmin/SuperAdminHQView';
import { SuspendedNotice } from './components/common/SuspendedNotice';
import { BookOpen, Loader2, Crown } from 'lucide-react';

// Module Views
import { DashboardView } from './components/dashboard/DashboardView';
import { ReadingRoomMainView } from './components/readingRoom/ReadingRoomMainView';
import { BooksList } from './components/books/BooksList';
import { BookFormModal } from './components/books/BookFormModal';
import { BookDetailsModal } from './components/books/BookDetailsModal';
import { MembersList } from './components/members/MembersList';
import { MemberFormModal } from './components/members/MemberFormModal';
import { MemberDetailsModal } from './components/members/MemberDetailsModal';
import { ActiveLoansList } from './components/circulation/ActiveLoansList';
import { IssueBookModal } from './components/circulation/IssueBookModal';
import { ReturnBookModal } from './components/circulation/ReturnBookModal';
import { ReservationsList } from './components/reservations/ReservationsList';
import { NewReservationModal } from './components/reservations/NewReservationModal';
import { FinesList } from './components/fines/FinesList';
import { CollectPaymentModal } from './components/fines/CollectPaymentModal';
import { ReceiptModal } from './components/fines/ReceiptModal';
import { ReportsView } from './components/reports/ReportsView';
import { UsersList } from './components/users/UsersList';
import { SettingsView } from './components/settings/SettingsView';
import { ActivityLogsList } from './components/activity/ActivityLogsList';

// Types
import { Book, Member, FineRecord } from './types';

function MainApp() {
  const { books, members, fines, addBook, updateBook, addMember, updateMember } = useApp();

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issuePreselectedBookId, setIssuePreselectedBookId] = useState<string | undefined>();
  const [issuePreselectedMemberId, setIssuePreselectedMemberId] = useState<string | undefined>();

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnPreselectedLoanId, setReturnPreselectedLoanId] = useState<string | undefined>();

  const [isBookFormOpen, setIsBookFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedBookDetails, setSelectedBookDetails] = useState<Book | null>(null);

  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMemberDetails, setSelectedMemberDetails] = useState<Member | null>(null);

  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [reservationPreselectedBookId, setReservationPreselectedBookId] = useState<string | undefined>();

  const [collectingFine, setCollectingFine] = useState<FineRecord | null>(null);
  const [viewingReceiptFine, setViewingReceiptFine] = useState<FineRecord | null>(null);

  // Handlers
  const handleOpenQuickIssue = (bookId?: string, memberId?: string) => {
    setIssuePreselectedBookId(bookId);
    setIssuePreselectedMemberId(memberId);
    setIsIssueModalOpen(true);
  };

  const handleOpenQuickReturn = (loanId?: string) => {
    setReturnPreselectedLoanId(loanId);
    setIsReturnModalOpen(true);
  };

  const handleOpenReservation = (bookId?: string) => {
    setReservationPreselectedBookId(bookId);
    setIsNewReservationOpen(true);
  };

  const handleSelectBookFromSearch = (bookId: string) => {
    const book = books.find((b) => b.id === bookId);
    if (book) {
      setSelectedBookDetails(book);
    }
  };

  const handleSelectMemberFromSearch = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (member) {
      setSelectedMemberDetails(member);
    }
  };

  const handleReceiptGenerated = (fine: FineRecord) => {
    setViewingReceiptFine(fine);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main content wrapper */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-68'
        }`}
      >
        {/* Topbar */}
        <Topbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenQuickIssue={() => handleOpenQuickIssue()}
          onOpenQuickReturn={() => handleOpenQuickReturn()}
          onSelectBookResult={handleSelectBookFromSearch}
          onSelectMemberResult={handleSelectMemberFromSearch}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenQuickIssue={() => handleOpenQuickIssue()}
              onOpenQuickReturn={() => handleOpenQuickReturn()}
              onOpenAddBook={() => {
                setEditingBook(null);
                setIsBookFormOpen(true);
              }}
              onOpenAddMember={() => {
                setEditingMember(null);
                setIsMemberFormOpen(true);
              }}
              onSelectLoanForReturn={(loanId) => handleOpenQuickReturn(loanId)}
            />
          )}

          {activeTab === 'reading_room' && <ReadingRoomMainView />}

          {activeTab === 'books' && (
            <BooksList
              onOpenAddBook={() => {
                setEditingBook(null);
                setIsBookFormOpen(true);
              }}
              onOpenEditBook={(book) => {
                setEditingBook(book);
                setIsBookFormOpen(true);
              }}
              onSelectBookDetails={(book) => setSelectedBookDetails(book)}
              onIssueBook={(bookId) => handleOpenQuickIssue(bookId)}
              onReserveBook={(bookId) => handleOpenReservation(bookId)}
            />
          )}

          {activeTab === 'members' && (
            <MembersList
              onOpenAddMember={() => {
                setEditingMember(null);
                setIsMemberFormOpen(true);
              }}
              onOpenEditMember={(member) => {
                setEditingMember(member);
                setIsMemberFormOpen(true);
              }}
              onSelectMemberDetails={(member) => setSelectedMemberDetails(member)}
              onIssueBookToMember={(memberId) => handleOpenQuickIssue(undefined, memberId)}
            />
          )}

          {activeTab === 'circulation' && (
            <ActiveLoansList
              onOpenIssueModal={() => handleOpenQuickIssue()}
              onOpenReturnModal={(loanId) => handleOpenQuickReturn(loanId)}
            />
          )}

          {activeTab === 'reservations' && (
            <ReservationsList
              onOpenNewReservation={() => handleOpenReservation()}
              onFulfillToIssue={(bookId, memberId) => handleOpenQuickIssue(bookId, memberId)}
            />
          )}

          {activeTab === 'fines' && (
            <FinesList
              onOpenCollectPayment={(fine) => setCollectingFine(fine)}
              onOpenReceipt={(fine) => setViewingReceiptFine(fine)}
            />
          )}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'users' && <UsersList />}

          {activeTab === 'settings' && <SettingsView />}

          {activeTab === 'activity' && <ActivityLogsList />}
        </main>
      </div>

      {/* Global Circulation Modals */}
      <IssueBookModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        preselectedBookId={issuePreselectedBookId}
        preselectedMemberId={issuePreselectedMemberId}
      />

      <ReturnBookModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        preselectedLoanId={returnPreselectedLoanId}
        onReceiptGenerated={handleReceiptGenerated}
      />

      {/* Book Modals */}
      <BookFormModal
        isOpen={isBookFormOpen}
        onClose={() => {
          setIsBookFormOpen(false);
          setEditingBook(null);
        }}
        onSubmit={(data) => {
          if (editingBook) {
            updateBook(editingBook.id, data);
          } else {
            addBook(data);
          }
        }}
        initialData={editingBook}
      />

      <BookDetailsModal
        book={selectedBookDetails}
        isOpen={Boolean(selectedBookDetails)}
        onClose={() => setSelectedBookDetails(null)}
        onIssueBook={(bookId) => handleOpenQuickIssue(bookId)}
        onReserveBook={(bookId) => handleOpenReservation(bookId)}
      />

      {/* Member Modals */}
      <MemberFormModal
        isOpen={isMemberFormOpen}
        onClose={() => {
          setIsMemberFormOpen(false);
          setEditingMember(null);
        }}
        onSubmit={(data) => {
          if (editingMember) {
            updateMember(editingMember.id, data);
          } else {
            addMember(data);
          }
        }}
        initialData={editingMember}
        existingCount={members.length}
      />

      <MemberDetailsModal
        member={selectedMemberDetails}
        isOpen={Boolean(selectedMemberDetails)}
        onClose={() => setSelectedMemberDetails(null)}
        onIssueBookToMember={(memberId) => handleOpenQuickIssue(undefined, memberId)}
        onOpenCollectFine={(fine) => setCollectingFine(fine)}
      />

      {/* Reservation Modal */}
      <NewReservationModal
        isOpen={isNewReservationOpen}
        onClose={() => setIsNewReservationOpen(false)}
        preselectedBookId={reservationPreselectedBookId}
      />

      {/* Fine Payment & Receipt Modals */}
      <CollectPaymentModal
        isOpen={Boolean(collectingFine)}
        onClose={() => setCollectingFine(null)}
        fine={collectingFine}
        onReceiptReady={(receiptNo) => {
          const paidFine = fines.find((f) => f.id === collectingFine?.id);
          if (paidFine) {
            setViewingReceiptFine({ ...paidFine, receiptNumber: receiptNo, status: 'paid' });
          }
        }}
      />

      <ReceiptModal
        isOpen={Boolean(viewingReceiptFine)}
        onClose={() => setViewingReceiptFine(null)}
        fine={viewingReceiptFine}
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

function AuthenticatedApp() {
  const { user, loading } = useAuth();
  const { isSuperAdmin, isViewingAsTenant, isSuspended, currentLibrary, returnToSuperAdminHQ } = useTenant();

  // Full-screen loading while Firebase checks whether a persistent session exists
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 animate-pulse">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-white font-bold text-lg mb-1">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          <span>LibraryPro SaaS</span>
        </div>
        <p className="text-xs text-slate-400 font-medium">
          Verifying multi-tenant session...
        </p>
      </div>
    );
  }

  // Protected Route enforcement: if no authenticated user, render LoginPage
  if (!user) {
    return <LoginPage />;
  }

  // If user is Global Super Admin and not previewing a specific library, open SuperAdminHQView!
  if (isSuperAdmin && !isViewingAsTenant) {
    return <SuperAdminHQView />;
  }

  // If library is suspended and user is not Super Admin, show Suspended Notice!
  if (isSuspended && !isSuperAdmin) {
    return <SuspendedNotice />;
  }

  // Authenticated: mount data providers and dashboard scoped to tenant
  return (
    <AppProvider>
      <ReadingRoomProvider>
        {/* Sticky Super Admin Preview Notification Bar */}
        {isSuperAdmin && isViewingAsTenant && currentLibrary && (
          <aside aria-label="Super admin inspection mode" className="bg-amber-400 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between sticky top-0 z-50 shadow-md">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-slate-950" />
              <span>
                Super Admin Inspection Mode: Viewing &ldquo;{currentLibrary.name}&rdquo; ({currentLibrary.code})
              </span>
            </div>
            <button
              onClick={returnToSuperAdminHQ}
              className="px-3 py-1 bg-slate-950 text-white rounded-lg text-xs hover:bg-slate-800 transition cursor-pointer"
            >
              ← Return to Super Admin HQ
            </button>
          </aside>
        )}
        <MainApp />
      </ReadingRoomProvider>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <AuthenticatedApp />
      </TenantProvider>
    </AuthProvider>
  );
}
