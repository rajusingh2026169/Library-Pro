import React, { useState } from 'react';
import {
  Armchair,
  Users,
  Clock,
  Receipt,
  Sparkles,
  UserPlus,
  CreditCard,
  BarChart3,
  Sliders,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { SeatLayoutView } from './SeatLayoutView';
import { StudentDirectoryView } from './StudentDirectoryView';
import { AttendanceTrackerView } from './AttendanceTrackerView';
import { ReadingRoomReportsView } from './ReadingRoomReportsView';
import { AdmissionModal } from './AdmissionModal';
import { StudentIdCardModal } from './StudentIdCardModal';
import { ReceiptPrintModal } from './ReceiptPrintModal';
import { FeeCollectionModal } from './FeeCollectionModal';
import { PlanManagementModal } from './PlanManagementModal';
import { useReadingRoom } from '../../context/ReadingRoomContext';
import { useApp } from '../../context/AppContext';
import { RRStudent, RRPayment } from '../../types/readingRoom';

export type ReadingRoomTab = 'seats' | 'students' | 'attendance' | 'reports';

export const ReadingRoomMainView: React.FC = () => {
  const { metrics, students, seats } = useReadingRoom();
  const { settings, language } = useApp();
  const isHindi = language === 'hi';

  const [activeSubTab, setActiveSubTab] = useState<ReadingRoomTab>('seats');

  // Modals state
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);
  const [preselectedSeatForAdmission, setPreselectedSeatForAdmission] = useState<string | undefined>();

  const [viewingIdCardStudent, setViewingIdCardStudent] = useState<RRStudent | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<RRPayment | null>(null);
  const [feeModalStudent, setFeeModalStudent] = useState<RRStudent | null>(null);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  // Quick Action Handlers
  const handleOpenAdmission = (seatId?: string) => {
    setPreselectedSeatForAdmission(seatId);
    setIsAdmissionOpen(true);
  };

  const handleOpenFeeModal = (student?: RRStudent) => {
    setFeeModalStudent(student || null);
    setIsFeeModalOpen(true);
  };

  const handleAdmissionSuccess = (student: RRStudent, receipt?: RRPayment) => {
    if (receipt) {
      setViewingReceipt(receipt);
    } else {
      setViewingIdCardStudent(student);
    }
  };

  const handleFeeSuccess = (receipt: RRPayment) => {
    setViewingReceipt(receipt);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-2 backdrop-blur-xs border border-indigo-400/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {isHindi ? 'स्टडी रूम व रीडिंग हॉल डेस्क' : 'Study Hall & Reading Room Management'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isHindi ? 'रीडिंग रूम प्रबंधन प्रणाली' : 'Reading Room & Study Desk System'}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-2xl">
            {isHindi
              ? 'छात्र रजिस्ट्रेशन, सीट आवंटन (Available / Occupied), मासिक/दैनिक फीस रसीद, आईडी कार्ड और चेक-इन हाजिरी।'
              : 'Seat allocation, patron admissions, student ID cards, automated fee receipt generation, attendance check-in/out, and plan rates.'}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenAdmission()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-500/20 cursor-pointer active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            {isHindi ? 'नया एडमिशन (Admission)' : 'New Admission'}
          </button>
          <button
            onClick={() => handleOpenFeeModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition border border-indigo-400/30 shadow-md cursor-pointer active:scale-98"
          >
            <CreditCard className="w-4 h-4" />
            {isHindi ? 'फीस जमा करें (Fee)' : 'Collect Fee'}
          </button>
          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-xs rounded-xl transition border border-slate-700 cursor-pointer"
            title="Configure Plans"
          >
            <Sliders className="w-4 h-4" />
            {isHindi ? 'प्लान सेटिंग्स' : 'Plans'}
          </button>
        </div>

        {/* Ambient background blur */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          {
            id: 'seats' as ReadingRoomTab,
            label: isHindi ? 'सीट लेआउट व आवंटन (Seats)' : 'Seats & Floor Plan',
            icon: Armchair,
            badge: `${metrics.occupiedSeats}/${metrics.totalSeats}`,
            badgeColor: 'bg-emerald-100 text-emerald-800',
          },
          {
            id: 'students' as ReadingRoomTab,
            label: isHindi ? 'छात्र विवरण (Students)' : 'Students Directory',
            icon: Users,
            badge: metrics.activeStudents.toString(),
            badgeColor: 'bg-indigo-100 text-indigo-800',
          },
          {
            id: 'attendance' as ReadingRoomTab,
            label: isHindi ? 'हाजिरी व चेक-इन (Attendance)' : 'Attendance & Check-In',
            icon: Clock,
            badge: `${metrics.currentlyPresent} Inside`,
            badgeColor: 'bg-amber-100 text-amber-800',
          },
          {
            id: 'reports' as ReadingRoomTab,
            label: isHindi ? 'फीस व रिपोर्ट्स (Reports)' : 'Reports & Fee Logs',
            icon: BarChart3,
            badge: null,
          },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-indigo-700 text-white' : tab.badgeColor
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeSubTab === 'seats' && (
          <SeatLayoutView
            onOpenAdmissionWithSeat={(seatId) => handleOpenAdmission(seatId)}
            onOpenStudentIdCard={(student) => setViewingIdCardStudent(student)}
            onOpenCollectFee={(student) => handleOpenFeeModal(student)}
          />
        )}

        {activeSubTab === 'students' && (
          <StudentDirectoryView
            onOpenAdmission={() => handleOpenAdmission()}
            onOpenIdCard={(student) => setViewingIdCardStudent(student)}
            onOpenCollectFee={(student) => handleOpenFeeModal(student)}
          />
        )}

        {activeSubTab === 'attendance' && <AttendanceTrackerView />}

        {activeSubTab === 'reports' && (
          <ReadingRoomReportsView
            onOpenReceipt={(receipt) => setViewingReceipt(receipt)}
            onOpenCollectFee={(student) => handleOpenFeeModal(student)}
          />
        )}
      </div>

      {/* Modals */}
      <AdmissionModal
        isOpen={isAdmissionOpen}
        onClose={() => {
          setIsAdmissionOpen(false);
          setPreselectedSeatForAdmission(undefined);
        }}
        preselectedSeatId={preselectedSeatForAdmission}
        onSuccess={handleAdmissionSuccess}
      />

      <StudentIdCardModal
        isOpen={Boolean(viewingIdCardStudent)}
        onClose={() => setViewingIdCardStudent(null)}
        student={viewingIdCardStudent}
      />

      <ReceiptPrintModal
        isOpen={Boolean(viewingReceipt)}
        onClose={() => setViewingReceipt(null)}
        receipt={viewingReceipt}
      />

      <FeeCollectionModal
        isOpen={isFeeModalOpen}
        onClose={() => {
          setIsFeeModalOpen(false);
          setFeeModalStudent(null);
        }}
        preselectedStudent={feeModalStudent}
        onSuccess={handleFeeSuccess}
      />

      <PlanManagementModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
      />
    </div>
  );
};
