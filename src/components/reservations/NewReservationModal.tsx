import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBookId?: string;
}

export const NewReservationModal: React.FC<NewReservationModalProps> = ({
  isOpen,
  onClose,
  preselectedBookId,
}) => {
  const { books, members, createReservation } = useApp();

  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedBookId(preselectedBookId || '');
      setSelectedMemberId('');
      setNotes('');
    }
  }, [isOpen, preselectedBookId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !selectedMemberId) return;

    const res = createReservation(selectedBookId, selectedMemberId, notes.trim());
    if (res.success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Place Hold / Book Reservation"
      subtitle="Queue patron hold request for titles currently in circulation or on reserve"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Book Title *
          </label>
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 bg-white"
          >
            <option value="">-- Choose book to reserve --</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} (ISBN: {b.isbn}) [{b.availableCopies} avail / {b.totalCopies} total]
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Requesting Patron *
          </label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 bg-white"
          >
            <option value="">-- Choose patron --</option>
            {members
              .filter((m) => m.status === 'active')
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.memberCode})
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Reservation Note (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Thesis reference; notify via SMS"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500"
          />
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
            disabled={!selectedBookId || !selectedMemberId}
            className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition shadow-xs cursor-pointer ${
              selectedBookId && selectedMemberId
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Place Hold
          </button>
        </div>
      </form>
    </Modal>
  );
};
