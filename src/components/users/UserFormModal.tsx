import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { LibraryUser, Role } from '../../types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<LibraryUser, 'id' | 'createdAt' | 'libraryId'>) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('LIBRARIAN');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!displayName.trim()) newErrors.displayName = 'Name is required';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid email is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      displayName: displayName.trim(),
      email: email.trim().toLowerCase(),
      role,
      status,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Staff Account"
      subtitle="Provision access for library circulation and administration staff"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Staff Full Name *
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Elena Rostova"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500"
          />
          {errors.displayName && <p className="text-[11px] text-rose-500 mt-1">{errors.displayName}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Email Address *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="elena@library.edu"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500"
          />
          {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Access Role Tier
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 bg-white"
          >
            <option value="ASSISTANT">Assistant (Circulation Desk & Patron Search)</option>
            <option value="LIBRARIAN">Librarian (Cataloging, Holds, Patron Management)</option>
            <option value="SUPER_ADMIN">Super Admin (System Settings, Staff Roles, Full Control)</option>
          </select>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
          >
            Provision Account
          </button>
        </div>
      </form>
    </Modal>
  );
};
