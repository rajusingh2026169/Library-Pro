import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Armchair,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Camera,
  Check,
} from 'lucide-react';
import { useReadingRoom } from '../../context/ReadingRoomContext';
import { useApp } from '../../context/AppContext';
import { ShiftType } from '../../types/readingRoom';

interface AdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSeatId?: string;
  onSuccess: (student: any, receipt?: any) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
];

export const AdmissionModal: React.FC<AdmissionModalProps> = ({
  isOpen,
  onClose,
  preselectedSeatId,
  onSuccess,
}) => {
  const { plans, seats, registerStudent } = useReadingRoom();
  const { settings, addToast } = useApp();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [fatherOrGuardianName, setFatherOrGuardianName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [shift, setShift] = useState<ShiftType>('full_day');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [planId, setPlanId] = useState(() => (plans.length > 0 ? plans[0].id : ''));
  const [allottedSeatId, setAllottedSeatId] = useState(preselectedSeatId || '');
  const [photoUrl, setPhotoUrl] = useState(PRESET_AVATARS[0]);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');

  // Initial payment
  const [collectPaymentNow, setCollectPaymentNow] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'ONLINE' | 'CARD'>('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available seats filter
  const availableSeats = seats.filter((s) => s.status === 'available' || s.id === preselectedSeatId);
  const selectedPlan = plans.find((p) => p.id === planId) || plans[0];

  // Sync initial payment when plan changes
  React.useEffect(() => {
    if (selectedPlan && collectPaymentNow) {
      setPaymentAmount(Math.max(0, selectedPlan.fee - discount));
    }
  }, [planId, discount, collectPaymentNow]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      addToast({ type: 'error', title: 'Name Required', message: 'Please enter student full name.' });
      return;
    }
    if (!mobile.trim() || mobile.trim().length < 10) {
      addToast({ type: 'error', title: 'Invalid Mobile', message: 'Please enter a valid 10-digit mobile number.' });
      return;
    }
    if (!address.trim()) {
      addToast({ type: 'error', title: 'Address Required', message: 'Please enter residential address.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerStudent({
        name,
        mobile,
        email,
        address,
        fatherOrGuardianName,
        bloodGroup,
        shift,
        joiningDate,
        planId: selectedPlan?.id || plans[0].id,
        allottedSeatId: allottedSeatId || undefined,
        photoUrl,
        emergencyContact,
        notes,
        initialPayment:
          collectPaymentNow && paymentAmount > 0
            ? {
                amount: paymentAmount,
                paymentMethod,
                discount,
              }
            : undefined,
      });

      if (!res.success) {
        addToast({ type: 'error', title: 'Admission Failed', message: res.error });
      } else {
        addToast({
          type: 'success',
          title: 'Student Admitted',
          message: `${res.student?.name} registered with ID ${res.student?.studentId}.`,
        });
        onSuccess(res.student, res.receipt);
        onClose();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err?.message || 'Failed to submit admission.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">New Student Admission</h3>
              <p className="text-xs text-indigo-200">Reading Room / Study Hall Registration Form</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Avatar / Photo Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Student Photo (छात्र फोटो)
            </label>
            <div className="flex items-center gap-4">
              <img
                src={photoUrl}
                alt="Selected"
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-600 shadow-md bg-slate-100 shrink-0"
              />
              <div className="flex-1">
                <span className="text-xs text-slate-500 block mb-1.5 font-medium">
                  Select a preset profile or enter custom image URL:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPhotoUrl(url)}
                      className={`relative w-8 h-8 rounded-full overflow-hidden border-2 cursor-pointer transition ${
                        photoUrl === url ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-slate-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="preset" className="w-full h-full object-cover" />
                      {photoUrl === url && (
                        <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center text-white">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Or paste external photo URL..."
                  value={photoUrl.startsWith('http') && !PRESET_AVATARS.includes(photoUrl) ? photoUrl : ''}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="mt-2 w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 1: Personal Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-indigo-100 pb-1 flex items-center gap-1.5">
              <span>1. Student Profile (छात्र विवरण)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (पूरा नाम) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (मोबाइल नं.) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-11 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (ईमेल)
                </label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Father / Guardian Name (अभिभावक का नाम)
                </label>
                <input
                  type="text"
                  placeholder="Guardian's Name"
                  value={fatherOrGuardianName}
                  onChange={(e) => setFatherOrGuardianName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Residential Address (स्थाई पता) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="House/Room No, Street, Colony, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Group (रक्त समूह)
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Phone (आपातकालीन नंबर)
                </label>
                <input
                  type="tel"
                  placeholder="Guardian contact number"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Membership & Seat Allocation */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-indigo-100 pb-1">
              2. Membership Plan & Seat Allocation (प्लान व सीट आवंटन)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Membership Plan (प्लान चुनें) *
                </label>
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {settings.currencySymbol || '₹'}
                      {p.fee} ({p.durationDays} Days)
                    </option>
                  ))}
                </select>
                {selectedPlan && (
                  <p className="text-[11px] text-slate-500 mt-1 italic">{selectedPlan.description}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shift Timing (समय स्लॉट) *
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value as ShiftType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="full_day">Full Day (24/7 Unlimited)</option>
                  <option value="morning">Morning Shift (6:00 AM - 2:00 PM)</option>
                  <option value="evening">Evening Shift (2:00 PM - 10:00 PM)</option>
                  <option value="night">Night Shift (10:00 PM - 6:00 AM)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Joining Date (शुरुआत तारीख) *
                </label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Allot Study Seat (सीट संख्या)
                </label>
                <select
                  value={allottedSeatId}
                  onChange={(e) => setAllottedSeatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">-- No Seat Now (Allot Later) --</option>
                  {availableSeats.map((s) => (
                    <option key={s.id} value={s.id}>
                      Seat {s.seatNumber} ({s.floor} - {s.section})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-emerald-600 block mt-1 font-semibold">
                  {availableSeats.length} seats currently available for booking
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Fee Payment & Receipt */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>3. Fee Collection (फीस जमा)</span>
              </h4>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={collectPaymentNow}
                  onChange={(e) => setCollectPaymentNow(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                Collect Fee Now (रसीद बनाएं)
              </label>
            </div>

            {collectPaymentNow && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Paying Amount ({settings.currencySymbol || '₹'})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {selectedPlan && (
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Total Plan Fee: {settings.currencySymbol || '₹'}
                      {selectedPlan.fee}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discount / Concession ({settings.currencySymbol || '₹'})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Mode (माध्यम)
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="CASH">Cash Payment (नकद)</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="ONLINE">Bank Transfer / Net Banking</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks / Notes (टिप्पणी)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. UPSC preparation student, requested window corner seat..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-md shadow-indigo-600/20 active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Registering...' : 'Complete Admission & Generate ID'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
