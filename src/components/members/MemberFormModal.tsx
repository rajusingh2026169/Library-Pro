import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Member, MemberType, MemberStatus } from '../../types';
import { useApp } from '../../context/AppContext';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'libraryId' | 'currentLoansCount' | 'outstandingFines'>) => void;
  initialData?: Member | null;
  existingCount: number;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  existingCount,
}) => {
  const { language } = useApp();
  const isHindi = language === 'hi';

  const [memberCode, setMemberCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [memberType, setMemberType] = useState<MemberType>('student');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<MemberStatus>('active');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [maxLoansAllowed, setMaxLoansAllowed] = useState<number>(3);
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setMemberCode(initialData.memberCode);
      setFullName(initialData.fullName);
      setEmail(initialData.email);
      setPhone(initialData.phone || '');
      setMemberType(initialData.memberType);
      setDepartment(initialData.department || '');
      setStatus(initialData.status);
      setJoinDate(initialData.joinDate || new Date().toISOString().split('T')[0]);
      setExpiryDate(initialData.expiryDate || '');
      setMaxLoansAllowed(initialData.maxLoansAllowed || 3);
      setPhotoUrl(initialData.photoUrl || '');
      setNotes(initialData.notes || '');
    } else {
      const year = new Date().getFullYear();
      const codeSuggestion = `MEM-${year}-${String(existingCount + 101).padStart(3, '0')}`;
      setMemberCode(codeSuggestion);
      setFullName('');
      setEmail('');
      setPhone('+1 (555) ');
      setMemberType('student');
      setDepartment('Computer Science');
      setStatus('active');
      const now = new Date();
      setJoinDate(now.toISOString().split('T')[0]);

      // Default 2 years expiry for student
      const expiry = new Date(now);
      expiry.setFullYear(expiry.getFullYear() + 2);
      setExpiryDate(expiry.toISOString().split('T')[0]);

      setMaxLoansAllowed(3);
      setPhotoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80');
      setNotes('');
    }
    setErrors({});
  }, [initialData, isOpen, existingCount]);

  // Handle member type change to adjust default max loans
  const handleTypeChange = (type: MemberType) => {
    setMemberType(type);
    if (type === 'faculty') setMaxLoansAllowed(8);
    else if (type === 'student') setMaxLoansAllowed(3);
    else if (type === 'staff') setMaxLoansAllowed(5);
    else setMaxLoansAllowed(2);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!memberCode.trim()) newErrors.memberCode = 'Member code is required';
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid email is required';
    if (!expiryDate) newErrors.expiryDate = 'Expiry date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      memberCode: memberCode.trim().toUpperCase(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      memberType,
      department: department.trim(),
      status,
      joinDate,
      expiryDate,
      maxLoansAllowed: Number(maxLoansAllowed),
      photoUrl: photoUrl.trim(),
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        initialData
          ? isHindi ? 'छात्र की जानकारी बदलें (Edit Profile)' : 'Edit Patron Profile'
          : isHindi ? 'नया छात्र / सदस्य जोड़ें (Register Member)' : 'Register New Member'
      }
      subtitle={
        isHindi
          ? 'छात्र का नाम, रोल नंबर, संपर्क विवरण और किताब लेने की लिमिट तय करें।'
          : 'Configure patron credentials, department affiliation, and borrowing privileges'
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Member Code */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'छात्र कोड / रोल नंबर *' : 'Member Code *'}
            </label>
            <input
              type="text"
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value)}
              placeholder="e.g. MEM-2026-101"
              className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border font-mono ${
                errors.memberCode ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden`}
            />
            {errors.memberCode && <p className="text-[11px] text-rose-500 mt-1">{errors.memberCode}</p>}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'पूरा नाम (Full Name) *' : 'Full Name *'}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isHindi ? 'जैसे: राहुल शर्मा, प्रिया वर्मा...' : 'e.g. Alexander Wright'}
              className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border ${
                errors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden`}
            />
            {errors.fullName && <p className="text-[11px] text-rose-500 mt-1">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'ईमेल पता (Email) *' : 'Email Address *'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@school.edu"
              className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border ${
                errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden`}
            />
            {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'मोबाइल नंबर (Phone)' : 'Contact Phone'}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Member Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'सदस्य का प्रकार (Category)' : 'Membership Category'}
            </label>
            <select
              value={memberType}
              onChange={(e) => handleTypeChange(e.target.value as MemberType)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden bg-white"
            >
              <option value="student">{isHindi ? 'छात्र (Student - 3 किताबें)' : 'Student (Undergrad/Postgrad)'}</option>
              <option value="faculty">{isHindi ? 'शिक्षक (Faculty - 8 किताबें)' : 'Faculty & Researcher'}</option>
              <option value="staff">{isHindi ? 'स्टाफ (Staff - 5 किताबें)' : 'Administrative Staff'}</option>
              <option value="general">{isHindi ? 'सामान्य सदस्य (General - 2 किताबें)' : 'General / Public Patron'}</option>
            </select>
          </div>

          {/* Department / Class */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'कक्षा / विभाग (Class & Dept)' : 'Department / Class'}
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder={isHindi ? 'जैसे: 10वीं कक्षा, B.Sc Computer Science' : 'e.g. Computer Science (Year 3)'}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Max Loan Limit */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'अधिकतम किताबें लेने की छूट (Max Books)' : 'Max Active Loans Allowed'}
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={maxLoansAllowed}
              onChange={(e) => setMaxLoansAllowed(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Membership Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'कार्ड स्थिति (Card Status)' : 'Status'}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MemberStatus)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden bg-white"
            >
              <option value="active">{isHindi ? 'सक्रिय (किताब ले सकते हैं)' : 'Active (Borrowing Enabled)'}</option>
              <option value="suspended">{isHindi ? 'ब्लॉक / निलंबित (रोक लगी है)' : 'Suspended (Borrowing Blocked)'}</option>
              <option value="expired">{isHindi ? 'समय समाप्त (Expired)' : 'Expired'}</option>
            </select>
          </div>

          {/* Join Date & Expiry Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'सदस्यता शुरू तारीख (Join Date)' : 'Join Date'}
            </label>
            <input
              type="date"
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'कार्ड समाप्ति तारीख (Expiry Date) *' : 'Expiry Date *'}
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border ${
                errors.expiryDate ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden`}
            />
            {errors.expiryDate && <p className="text-[11px] text-rose-500 mt-1">{errors.expiryDate}</p>}
          </div>

          {/* Photo URL */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'फोटो का लिंक (Photo URL)' : 'Patron Photo URL'}
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isHindi ? 'लाइब्रेरियन का विशेष नोट (Staff Notes)' : 'Internal Staff Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isHindi ? 'जैसे: विशेष अनुमति, छात्रवृत्ति...' : 'Special accommodations, research grants, etc.'}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            {isHindi ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
          >
            {initialData
              ? isHindi ? 'बदलाव सहेजें' : 'Save Changes'
              : isHindi ? 'छात्र पंजीकृत करें' : 'Register Member'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
