import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  UserCheck,
  UserX,
  Shield,
  Key,
  Check,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LibraryUser, Role } from '../../types';
import { Badge } from '../common/Badge';
import { UserFormModal } from './UserFormModal';

export const UsersList: React.FC = () => {
  const { users, currentUser, addUser, updateUserRole, toggleUserStatus, hasPermission } = useApp();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const permissionsMatrix = [
    { feature: 'View Dashboard & Catalog', assistant: true, librarian: true, admin: true },
    { feature: 'Issue & Return Books (Circulation)', assistant: true, librarian: true, admin: true },
    { feature: 'Search Patrons & View Holds', assistant: true, librarian: true, admin: true },
    { feature: 'Register & Edit Patrons', assistant: true, librarian: true, admin: true },
    { feature: 'Catalog New Books & Edit Records', assistant: false, librarian: true, admin: true },
    { feature: 'Manage Hold Queues & Staging', assistant: false, librarian: true, admin: true },
    { feature: 'Collect Fines & Print Receipts', assistant: true, librarian: true, admin: true },
    { feature: 'Waive Overdue Fines', assistant: false, librarian: false, admin: true },
    { feature: 'Archive & Permanently Delete Books', assistant: false, librarian: false, admin: true },
    { feature: 'Manage Staff Roles & Security Rules', assistant: false, librarian: false, admin: true },
    { feature: 'Configure Circulation Limits & Fine Rates', assistant: false, librarian: false, admin: true },
    { feature: 'System Backup Export & Data Restore', assistant: false, librarian: false, admin: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Staff & Access Role Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure library personnel accounts, role-based authorization tiers, and circulation privileges.
          </p>
        </div>

        {hasPermission('SUPER_ADMIN') && (
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            Provision Staff Account
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Registered Staff Accounts ({users.length})</h3>
          </div>
          <span className="text-xs text-slate-400">Security enforcement: Role-Based Access Control (RBAC)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role Tier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isSelf = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {u.displayName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">{u.displayName}</span>
                          {isSelf && (
                            <span className="ml-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-200">
                              Current Session
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">{u.email}</td>

                    <td className="py-3.5 px-4">
                      {hasPermission('SUPER_ADMIN') && !isSelf ? (
                        <select
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value as Role)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 focus:border-indigo-500 bg-white cursor-pointer"
                        >
                          <option value="ASSISTANT">Assistant</option>
                          <option value="LIBRARIAN">Librarian</option>
                          <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                      ) : (
                        <Badge
                          variant={
                            u.role === 'SUPER_ADMIN'
                              ? 'indigo'
                              : u.role === 'LIBRARIAN'
                              ? 'emerald'
                              : 'slate'
                          }
                        >
                          {u.role.replace('_', ' ')}
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={u.status === 'active' ? 'emerald' : 'rose'}>{u.status}</Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {hasPermission('SUPER_ADMIN') && !isSelf && (
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition border cursor-pointer ${
                            u.status === 'active'
                              ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                          }`}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Role & Permission Entitlement Matrix</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of functional capabilities enforced across the user interface and secure database rules.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">System Operation / Module</th>
                <th className="py-3 px-4 text-center">Assistant</th>
                <th className="py-3 px-4 text-center">Librarian</th>
                <th className="py-3 px-4 text-center">Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionsMatrix.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-medium text-slate-800">{p.feature}</td>
                  <td className="py-2.5 px-4 text-center">
                    {p.assistant ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {p.librarian ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {p.admin ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <UserFormModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onSubmit={(data) => addUser(data)}
      />
    </div>
  );
};
