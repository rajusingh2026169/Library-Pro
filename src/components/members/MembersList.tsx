import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit2,
  PlusCircle,
  AlertTriangle,
  Mail,
  Shield,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Member, MemberType, MemberStatus } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

interface MembersListProps {
  onOpenAddMember: () => void;
  onOpenEditMember: (member: Member) => void;
  onSelectMemberDetails: (member: Member) => void;
  onIssueBookToMember: (memberId: string) => void;
}

export const MembersList: React.FC<MembersListProps> = ({
  onOpenAddMember,
  onOpenEditMember,
  onSelectMemberDetails,
  onIssueBookToMember,
}) => {
  const { members, settings, hasPermission, language } = useApp();
  const isHindi = language === 'hi';

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        m.fullName.toLowerCase().includes(q) ||
        m.memberCode.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q);

      const matchType = selectedType === 'all' || m.memberType === selectedType;
      const matchStatus = selectedStatus === 'all' || m.status === selectedStatus;

      return matchSearch && matchType && matchStatus;
    });
  }, [members, search, selectedType, selectedStatus]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isHindi ? 'छात्र व सदस्य प्रबंधन (Member Management)' : 'Patron & Member Directory'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isHindi
              ? 'लाइब्रेरी के सभी छात्रों, शिक्षकों और सदस्यों की सूची, जारी किताबें और जुर्माना।'
              : 'Manage student, faculty, and research patron registrations, loan quotas, and account standings.'}
          </p>
        </div>

        {hasPermission('ASSISTANT') && (
          <button
            onClick={onOpenAddMember}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            {isHindi ? 'नया छात्र / सदस्य जोड़ें (Add Member)' : 'Register Patron'}
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isHindi
                ? 'छात्र का नाम, रोल नंबर/कोड (MEM-...), ईमेल या क्लास से खोजें...'
                : 'Search patron by name, member code (MEM-...), email, or department...'
            }
            className="w-full pl-10 pr-4 py-2 bg-slate-50 text-xs sm:text-sm rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Member type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-50 text-xs text-slate-700 rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-400 outline-hidden font-medium cursor-pointer"
          >
            <option value="all">{isHindi ? 'सभी सदस्य (All)' : 'All Patron Categories'}</option>
            <option value="student">{isHindi ? 'छात्र (Students)' : 'Students'}</option>
            <option value="faculty">{isHindi ? 'शिक्षक / प्रोफ़ेसर (Faculty)' : 'Faculty & Researchers'}</option>
            <option value="staff">{isHindi ? 'लाइब्रेरी स्टाफ (Staff)' : 'Staff'}</option>
            <option value="general">{isHindi ? 'अन्य सदस्य (General)' : 'General / Public'}</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 text-xs text-slate-700 rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-400 outline-hidden font-medium cursor-pointer"
          >
            <option value="all">{isHindi ? 'सभी स्थितियां (All Status)' : 'All Statuses'}</option>
            <option value="active">{isHindi ? 'सक्रिय कार्ड (Active)' : 'Active Standing'}</option>
            <option value="suspended">{isHindi ? 'निलंबित / ब्लॉक (Suspended)' : 'Suspended Accounts'}</option>
            <option value="expired">{isHindi ? 'समय समाप्त (Expired)' : 'Expired Memberships'}</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={isHindi ? 'कोई सदस्य नहीं मिला' : 'No patrons found'}
          description={
            isHindi
              ? 'कृपया दूसरा नाम या कोड डालकर खोजें।'
              : 'No member records match the specified search or filter conditions.'
          }
          actionLabel={isHindi ? 'नया छात्र जोड़ें' : 'Register New Patron'}
          onAction={onOpenAddMember}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">{isHindi ? 'छात्र / सदस्य का नाम व कोड' : 'Patron Details'}</th>
                  <th className="py-3 px-4">{isHindi ? 'श्रेणी व विभाग / कक्षा' : 'Category & Department'}</th>
                  <th className="py-3 px-4">{isHindi ? 'ली गई किताबें / लिमिट' : 'Active Loans / Limit'}</th>
                  <th className="py-3 px-4">{isHindi ? 'बाकी जुर्माना (Fine)' : 'Outstanding Fines'}</th>
                  <th className="py-3 px-4">{isHindi ? 'कार्ड स्थिति व वैधता' : 'Status & Validity'}</th>
                  <th className="py-3 px-4 text-right">{isHindi ? 'कार्य (Actions)' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((m) => {
                  const isExpired = new Date(m.expiryDate) < new Date();
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-indigo-700 text-xs">
                            {m.photoUrl ? (
                              <img src={m.photoUrl} alt={m.fullName} className="w-full h-full object-cover" />
                            ) : (
                              m.fullName.charAt(0)
                            )}
                          </div>
                          <div>
                            <p
                              onClick={() => onSelectMemberDetails(m)}
                              className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer"
                            >
                              {m.fullName}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400 font-semibold">{m.memberCode}</p>
                            <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 uppercase text-[11px] tracking-wide">
                          {isHindi
                            ? m.memberType === 'student'
                              ? 'छात्र'
                              : m.memberType === 'faculty'
                              ? 'शिक्षक'
                              : m.memberType === 'staff'
                              ? 'स्टाफ'
                              : 'अन्य'
                            : m.memberType}
                        </span>
                        <span className="block text-[11px] text-slate-500 truncate max-w-xs">{m.department}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span
                            className={`font-bold text-sm ${
                              m.currentLoansCount >= m.maxLoansAllowed ? 'text-amber-600' : 'text-slate-800'
                            }`}
                          >
                            {m.currentLoansCount}
                          </span>
                          <span className="text-slate-400">/</span>
                          <span className="text-xs text-slate-500">{m.maxLoansAllowed}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {isHindi ? 'किताबें जारी' : 'books out'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {m.outstandingFines > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600 font-mono text-xs bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            {settings.currencySymbol}
                            {m.outstandingFines.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">
                            {isHindi ? 'कोई जुर्माना नहीं (₹0)' : 'None ($0.00)'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            m.status === 'active'
                              ? 'emerald'
                              : m.status === 'suspended'
                              ? 'rose'
                              : 'amber'
                          }
                        >
                          {m.status === 'active'
                            ? isHindi ? 'चालू (Active)' : 'active'
                            : m.status === 'suspended'
                            ? isHindi ? 'निलंबित (Suspended)' : 'suspended'
                            : isHindi ? 'समाप्त (Expired)' : 'expired'}
                        </Badge>
                        <span className={`block text-[10px] mt-0.5 ${isExpired ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                          {isHindi ? 'वैधता:' : 'Exp:'} {m.expiryDate}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectMemberDetails(m)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            title={isHindi ? 'छात्र की पूरी प्रोफाइल देखें' : 'Inspect Profile & Loans'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {m.status === 'active' && !isExpired && (
                            <button
                              onClick={() => onIssueBookToMember(m.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition border border-indigo-200 cursor-pointer"
                              title={isHindi ? 'इस छात्र को किताब दें' : 'Issue book to this patron'}
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              {isHindi ? 'किताब दें' : 'Issue'}
                            </button>
                          )}

                          {hasPermission('LIBRARIAN') && (
                            <button
                              onClick={() => onOpenEditMember(m)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                              title={isHindi ? 'जानकारी बदलें' : 'Edit Patron Profile'}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
