import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Shield,
  Clock,
  User,
  BookOpen,
  Repeat,
  Receipt,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActivityLog } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

export const ActivityLogsList: React.FC = () => {
  const { logs } = useApp();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        l.description.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q);

      const matchEntity = entityFilter === 'all' || l.entityType === entityFilter;
      return matchSearch && matchEntity;
    });
  }, [logs, search, entityFilter]);

  const getEntityIcon = (type: ActivityLog['entityType']) => {
    switch (type) {
      case 'BOOK':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'LOAN':
        return <Repeat className="w-4 h-4 text-indigo-500" />;
      case 'MEMBER':
        return <User className="w-4 h-4 text-violet-500" />;
      case 'FINE':
        return <Receipt className="w-4 h-4 text-rose-500" />;
      case 'SETTINGS':
        return <SettingsIcon className="w-4 h-4 text-amber-500" />;
      default:
        return <Shield className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            System Activity Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable log of cataloging, circulation checkouts, returns, patron status changes, and fine receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          <Clock className="w-4 h-4 text-emerald-500" />
          <span>Real-time Audit Ledger Active</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by description, action, or staff name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 text-xs sm:text-sm rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-400 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 text-xs text-slate-700 rounded-xl border border-slate-200 focus:bg-white font-medium cursor-pointer"
          >
            <option value="all">All Entity Domains</option>
            <option value="BOOK">Book Catalog</option>
            <option value="LOAN">Circulation Loans</option>
            <option value="MEMBER">Patrons / Members</option>
            <option value="RESERVATION">Hold Queue</option>
            <option value="FINE">Fines & Receipts</option>
            <option value="USER">Staff Accounts</option>
            <option value="SETTINGS">Settings & System</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity events recorded"
          description="No system operations match the active search filter criteria."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Event Description</th>
                  <th className="py-3 px-4">Action Code</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                          {getEntityIcon(log.entityType)}
                        </div>
                        <span className="font-semibold text-slate-900 max-w-md">{log.description}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-700">
                      {log.action}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="slate">{log.entityType}</Badge>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800">{log.userName}</span>
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        {log.userRole.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
