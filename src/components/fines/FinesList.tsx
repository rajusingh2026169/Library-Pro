import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  DollarSign,
  Printer,
  CheckCircle,
  AlertTriangle,
  MinusCircle,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FineRecord } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface FinesListProps {
  onOpenCollectPayment: (fine: FineRecord) => void;
  onOpenReceipt: (fine: FineRecord) => void;
}

export const FinesList: React.FC<FinesListProps> = ({
  onOpenCollectPayment,
  onOpenReceipt,
}) => {
  const { fines, settings, waiveFine, hasPermission } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'paid' | 'waived' | 'all'>('all');
  const [fineToWaive, setFineToWaive] = useState<FineRecord | null>(null);
  const [waiveReason, setWaiveReason] = useState('Medical leave verified by academic dean');

  const filteredFines = useMemo(() => {
    return fines.filter((f) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        f.memberName.toLowerCase().includes(q) ||
        f.memberCode.toLowerCase().includes(q) ||
        f.bookTitle.toLowerCase().includes(q) ||
        (f.receiptNumber && f.receiptNumber.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'all' || f.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [fines, search, statusFilter]);

  const summary = useMemo(() => {
    let totalPending = 0;
    let totalPaid = 0;
    let totalWaived = 0;

    fines.forEach((f) => {
      if (f.status === 'pending') totalPending += f.amount;
      else if (f.status === 'paid') totalPaid += f.amount;
      else if (f.status === 'waived') totalWaived += f.amount;
    });

    return { totalPending, totalPaid, totalWaived, count: fines.length };
  }, [fines]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Fines & Financial Settlement
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track overdue penalty assessments, collect payments, generate official receipts, and audit fee waivers.
          </p>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Pending Dues</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-rose-600 mt-2 font-mono">
            {settings.currencySymbol}{summary.totalPending.toFixed(2)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting patron settlement</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Collected</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-2 font-mono">
            {settings.currencySymbol}{summary.totalPaid.toFixed(2)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Deposited to library account</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Waived</span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <MinusCircle className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-700 mt-2 font-mono">
            {settings.currencySymbol}{summary.totalWaived.toFixed(2)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Authorised by administration</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fines by patron, book title, or receipt number..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 text-xs sm:text-sm rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-400 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          {(['all', 'pending', 'paid', 'waived'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Fines Table */}
      {filteredFines.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No fine records match criteria"
          description="Try modifying search keywords or status filter options."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Patron</th>
                  <th className="py-3 px-4">Book Title & Overdue</th>
                  <th className="py-3 px-4">Amount Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Receipt / Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFines.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{f.memberName}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{f.memberCode}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{f.bookTitle}</span>
                      <span className="block text-[10px] text-slate-500">
                        {f.overdueDays} days overdue • {f.reason}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-sm font-black text-slate-900">
                        {settings.currencySymbol}{f.amount.toFixed(2)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          f.status === 'paid'
                            ? 'emerald'
                            : f.status === 'pending'
                            ? 'rose'
                            : 'slate'
                        }
                      >
                        {f.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {f.receiptNumber ? (
                        <div>
                          <span className="font-bold text-indigo-700">{f.receiptNumber}</span>
                          <span className="block text-[10px] text-slate-400">
                            {f.paidAt ? new Date(f.paidAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Assessed: {new Date(f.createdAt).toLocaleDateString()}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {f.status === 'pending' && (
                          <>
                            <button
                              onClick={() => onOpenCollectPayment(f)}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs cursor-pointer"
                            >
                              Collect Fee
                            </button>

                            {hasPermission('SUPER_ADMIN') && (
                              <button
                                onClick={() => setFineToWaive(f)}
                                className="px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              >
                                Waive
                              </button>
                            )}
                          </>
                        )}

                        {f.status === 'paid' && (
                          <button
                            onClick={() => onOpenReceipt(f)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition border border-indigo-200 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                        )}

                        {f.status === 'waived' && (
                          <span className="text-[11px] text-slate-400 italic">Waived by Admin</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Waive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(fineToWaive)}
        onClose={() => setFineToWaive(null)}
        onConfirm={() => {
          if (fineToWaive) waiveFine(fineToWaive.id, waiveReason);
        }}
        title="Waive Outstanding Fine"
        message={`Are you sure you want to waive the ${settings.currencySymbol}${fineToWaive?.amount.toFixed(2)} fine assessed to ${fineToWaive?.memberName}? This action is permanently recorded in the audit log.`}
        confirmLabel="Waive Fine"
        variant="warning"
      />
    </div>
  );
};
