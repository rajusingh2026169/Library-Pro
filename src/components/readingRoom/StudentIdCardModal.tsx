import React, { useState } from 'react';
import { X, Printer, ShieldCheck, Phone, MapPin, Calendar, Clock, Armchair, QrCode as QrCodeIcon, Barcode } from 'lucide-react';
import { RRStudent } from '../../types/readingRoom';
import { useApp } from '../../context/AppContext';
import { QRCodeView } from '../common/QRCodeView';

interface StudentIdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: RRStudent | null;
}

export const StudentIdCardModal: React.FC<StudentIdCardModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const { settings } = useApp();

  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  const shiftLabels: Record<string, string> = {
    full_day: 'Full Day (24/7 Access)',
    morning: 'Morning Shift (6 AM - 2 PM)',
    evening: 'Evening Shift (2 PM - 10 PM)',
    night: 'Night Shift (10 PM - 6 AM)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-in">
        {/* Modal Top Header (hidden in print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">Student ID Card (पास / पहचान पत्र)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print ID Card
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable ID Card Container */}
        <div className="p-6 bg-slate-100 flex flex-col items-center justify-center">
          <div
            id="printable-id-card"
            className="w-full max-w-[390px] bg-white rounded-2xl border-2 border-indigo-600 shadow-xl overflow-hidden relative text-slate-800 select-none"
          >
            {/* ID Card Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white px-5 py-4 text-center relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-[10px] tracking-widest font-extrabold uppercase text-indigo-300 block">
                  {settings.institutionName || 'CENTRAL STUDY LIBRARY'}
                </span>
                <h4 className="text-base font-black tracking-tight mt-0.5">
                  READING ROOM PATRON PASS
                </h4>
                <p className="text-[10px] text-slate-300 mt-0.5 font-medium">
                  Silent Study Hall & Digital Learning Center
                </p>
              </div>
              {/* Pattern effect */}
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-500/20 rounded-full blur-md" />
            </div>

            {/* Photo & Student Main Info */}
            <div className="p-5 flex flex-col items-center text-center">
              <div className="relative">
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-indigo-600 shadow-md bg-slate-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
                  }}
                />
                <span
                  className={`absolute bottom-0 right-0 px-2 py-0.5 text-[10px] font-extrabold rounded-full border border-white uppercase shadow-xs ${
                    student.status === 'active'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {student.status}
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 mt-2.5 tracking-tight">
                {student.name}
              </h3>
              <div className="inline-flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-mono font-bold rounded-md border border-indigo-100">
                  ID: {student.studentId}
                </span>
                {student.allottedSeatNumber && (
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-md border border-emerald-200 flex items-center gap-1">
                    <Armchair className="w-3 h-3 text-emerald-600" />
                    Seat: {student.allottedSeatNumber}
                  </span>
                )}
              </div>

              {/* Detail Grid */}
              <div className="w-full mt-4 bg-slate-50 rounded-xl p-3 border border-slate-200 text-left space-y-1.5 text-xs">
                <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Membership Plan:</span>
                  <span className="font-bold text-slate-900">{student.planName}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> Shift:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {shiftLabels[student.shift] || student.shift}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> Mobile:
                  </span>
                  <span className="font-mono font-bold text-slate-900">+91 {student.mobile}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> Valid Upto:
                  </span>
                  <span className="font-bold text-indigo-700">
                    {new Date(student.expiryDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {student.bloodGroup && (
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Blood Group:</span>
                    <span className="font-bold text-rose-600">{student.bloodGroup}</span>
                  </div>
                )}
                {student.emergencyContact && (
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500 font-medium">Emergency Ph:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {student.emergencyContact}
                    </span>
                  </div>
                )}
              </div>

              {/* Scannable QR Code & Barcode Section */}
              <div className="mt-4 w-full flex flex-col items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <QRCodeView
                    value={JSON.stringify({
                      type: 'STUDENT',
                      id: student.studentId,
                      name: student.name,
                      seat: student.allottedSeatNumber || 'Unassigned',
                      plan: student.planName,
                    })}
                    size={72}
                  />
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-700">
                      <QrCodeIcon className="w-3.5 h-3.5" />
                      <span>Gate Access QR</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                      Scan at reading room turnstile or attendance desk for instant entry/exit.
                    </p>
                    <span className="font-mono text-[11px] font-black text-slate-900 block mt-1 tracking-wider">
                      {student.studentId}
                    </span>
                  </div>
                </div>

                {/* Barcode line representation for dual 1D/2D reader support */}
                <div className="mt-2.5 w-full pt-2 border-t border-slate-200/80 flex flex-col items-center">
                  <div className="h-6 w-11/12 flex items-center justify-between gap-1 px-3 py-1 bg-white border border-slate-200 rounded">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-full bg-slate-900 ${
                          i % 3 === 0 ? 'w-1' : i % 5 === 0 ? 'w-1.5' : 'w-0.5'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Authorized Stamp line */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {settings.branchCode || 'Central Campus'}
              </span>
              <div className="text-right">
                <span className="font-serif italic font-bold text-slate-700 block text-xs">
                  Authorized Signatory
                </span>
                <span className="text-[9px] text-slate-400">LibraryPro Desk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500">
            Card is formatted for standard PVC / Card print (3.375" x 2.125").
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
