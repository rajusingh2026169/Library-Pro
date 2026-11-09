import React, { useState } from 'react';
import {
  Building2,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Search,
  ExternalLink,
  PowerOff,
  Power,
  Edit,
  Trash2,
  Users,
  BookOpen,
  Armchair,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Database,
  Crown,
  LogOut,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useTenant, RegisterLibraryPayload } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { LibraryTenant, LibraryStatus, LibraryPlan } from '../../types';

export const SuperAdminHQView: React.FC = () => {
  const {
    libraries,
    superAdminStats,
    switchLibrary,
    registerLibrary,
    updateLibraryStatus,
    updateLibraryDetails,
    deleteLibrary,
  } = useTenant();

  const { user, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | LibraryPlan>('all');

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState<LibraryTenant | null>(null);
  const [suspendingLibrary, setSuspendingLibrary] = useState<LibraryTenant | null>(null);
  const [deletingLibrary, setDeletingLibrary] = useState<LibraryTenant | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastNotice, setToastNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Library Form State
  const [newLibForm, setNewLibForm] = useState<RegisterLibraryPayload>({
    name: '',
    code: '',
    ownerName: '',
    ownerEmail: '',
    phone: '',
    plan: 'pro',
    city: '',
    state: '',
    address: '',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastNotice({ type, message });
    setTimeout(() => setToastNotice(null), 4000);
  };

  // Filtered libraries
  const filteredLibraries = libraries.filter((lib) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      lib.name.toLowerCase().includes(q) ||
      lib.code.toLowerCase().includes(q) ||
      lib.ownerName.toLowerCase().includes(q) ||
      lib.ownerEmail.toLowerCase().includes(q) ||
      (lib.city && lib.city.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || lib.status === statusFilter;
    const matchesPlan = planFilter === 'all' || lib.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleCreateLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLibForm.name.trim() || !newLibForm.code.trim() || !newLibForm.ownerEmail.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await registerLibrary(newLibForm);
      if (res.success) {
        showToast(`Library "${newLibForm.name}" registered successfully with ID: ${res.libraryId}`);
        setIsRegisterModalOpen(false);
        setNewLibForm({
          name: '',
          code: '',
          ownerName: '',
          ownerEmail: '',
          phone: '',
          plan: 'pro',
          city: '',
          state: '',
          address: '',
        });
      } else {
        showToast(res.error || 'Failed to register library', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (lib: LibraryTenant) => {
    setActionLoading(true);
    try {
      if (lib.status === 'active') {
        setSuspendingLibrary(lib);
        setSuspendReason('Payment overdue or administrative compliance pending.');
      } else {
        await updateLibraryStatus(lib.id, 'active');
        showToast(`Library "${lib.name}" has been reactivated.`);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmSuspension = async () => {
    if (!suspendingLibrary) return;
    setActionLoading(true);
    try {
      await updateLibraryStatus(suspendingLibrary.id, 'suspended', suspendReason);
      showToast(`Library "${suspendingLibrary.name}" has been suspended.`);
      setSuspendingLibrary(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteLibrary = async () => {
    if (!deletingLibrary) return;
    setActionLoading(true);
    try {
      await deleteLibrary(deletingLibrary.id);
      showToast(`Library "${deletingLibrary.name}" has been permanently removed.`);
      setDeletingLibrary(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLibrary) return;

    setActionLoading(true);
    try {
      await updateLibraryDetails(editingLibrary.id, {
        name: editingLibrary.name,
        code: editingLibrary.code,
        ownerName: editingLibrary.ownerName,
        phone: editingLibrary.phone,
        city: editingLibrary.city,
        plan: editingLibrary.plan,
        maxSeats: editingLibrary.maxSeats,
        maxBooks: editingLibrary.maxBooks,
      });
      showToast(`Library "${editingLibrary.name}" updated successfully.`);
      setEditingLibrary(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notice */}
      {toastNotice && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastNotice.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/90 border-rose-700 text-rose-200'
          }`}
        >
          {toastNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastNotice.message}</span>
        </div>
      )}

      {/* Super Admin Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Crown className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white">LibraryPro SaaS HQ</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Super Admin Console
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Global Multi-Tenant Control • Logged in as: <span className="font-mono text-slate-300">{user?.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-md shadow-indigo-600/30 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ Register New Library</span>
          </button>

          <button
            onClick={async () => {
              try {
                await logout();
              } catch (e) {
                console.error(e);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Sign out of Super Admin"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* KPI Platform Stat Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Libraries</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">{superAdminStats.totalLibraries}</div>
            <div className="flex items-center gap-2 mt-2 text-[11px]">
              <span className="text-emerald-400 font-semibold">{superAdminStats.activeLibraries} Active</span>
              <span className="text-slate-500">•</span>
              <span className="text-rose-400 font-semibold">{superAdminStats.suspendedLibraries} Suspended</span>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Patrons & Students</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{superAdminStats.totalStudentsAcrossTenants}+</div>
            <p className="mt-2 text-[11px] text-slate-400">Across all registered reading rooms</p>
          </div>

          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Reading Room Desks</span>
              <Armchair className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">{superAdminStats.totalSeatsAcrossTenants}</div>
            <p className="mt-2 text-[11px] text-slate-400">Total provisioned study seats</p>
          </div>

          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Cloud Data Persistence</span>
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Firestore Live</span>
            </div>
            <p className="mt-2 text-[10px] text-slate-400 font-mono truncate" title="ai-studio-librarypromodern-e93e9478-0d98-434f-a6c0-b2f89347b4c4">
              DB: ai-studio-librarypromodern...
            </p>
          </div>
        </section>

        {/* Library Management Section */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Registered Libraries Directory</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {filteredLibraries.length} / {libraries.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage accounts, activate/suspend access, and open individual library dashboards.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, code, owner, city..."
                  className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition w-56 sm:w-64"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>

              {/* Plan filter */}
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="all">All Plans</option>
                <option value="starter">Starter</option>
                <option value="pro">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          {/* Libraries Table / Grid */}
          {filteredLibraries.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No registered libraries match your current filters.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 mt-2 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-3">Library / Institution</th>
                    <th className="py-3 px-3">Owner / Contact</th>
                    <th className="py-3 px-3">Plan & Capacity</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Registered On</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {filteredLibraries.map((lib) => (
                    <tr key={lib.id} className="hover:bg-slate-850/60 transition group">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {lib.code.substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white group-hover:text-indigo-300 transition truncate max-w-xs">
                              {lib.name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              Code: {lib.code} • ID: {lib.id}
                            </p>
                            {lib.city && (
                              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-600" />
                                {lib.city}{lib.state ? `, ${lib.state}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-slate-200">{lib.ownerName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{lib.ownerEmail}</p>
                        {lib.phone && <p className="text-[10px] text-slate-500">{lib.phone}</p>}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <span
                            className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              lib.plan === 'enterprise'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : lib.plan === 'pro'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {lib.plan} Plan
                          </span>
                          <p className="text-[11px] text-slate-400">
                            {lib.maxSeats || 30} Desks • {((lib.maxBooks || 15000) / 1000).toFixed(0)}k Books
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        {lib.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span
                            title={lib.suspendedReason || 'Suspended'}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold"
                          >
                            <PowerOff className="w-3 h-3 text-rose-400" />
                            Suspended
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                        {new Date(lib.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Switch & View As this Library */}
                          <button
                            onClick={() => switchLibrary(lib.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold text-[11px] transition cursor-pointer"
                            title="Open this library's dashboard"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => setEditingLibrary(lib)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Edit library details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Suspend or Reactivate */}
                          <button
                            onClick={() => handleToggleStatus(lib)}
                            className={`p-1.5 rounded-xl transition cursor-pointer ${
                              lib.status === 'active'
                                ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200'
                                : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 hover:text-emerald-200'
                            }`}
                            title={lib.status === 'active' ? 'Suspend library' : 'Reactivate library'}
                          >
                            {lib.status === 'active' ? (
                              <PowerOff className="w-3.5 h-3.5" />
                            ) : (
                              <Power className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete Library (हटाना) */}
                          <button
                            onClick={() => setDeletingLibrary(lib)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                            title="Delete / Remove Library Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Global Security & Multi-Tenant Audit Notice */}
        <section className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 leading-relaxed">
            <p className="font-bold text-white mb-0.5">Automated Tenant Isolation Active</p>
            <p>
              Each library tenant's records (Books, Students, Reading Room Desks, Attendance, Loans and Fees) are strictly partitioned by their <code className="text-indigo-300 font-mono">libraryId</code>. Library owners and librarians can never read or query records belonging to other institutions.
            </p>
          </div>
        </section>
      </main>

      {/* MODAL 1: Register New Library Tenant */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">Register New Library Tenant</h3>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateLibrary} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Library / Institute Name *
                </label>
                <input
                  type="text"
                  required
                  value={newLibForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoCode = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
                    setNewLibForm({ ...newLibForm, name, code: newLibForm.code || autoCode });
                  }}
                  placeholder="e.g. Saraswati Study Hall & Library"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Branch Code / Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLibForm.code}
                    onChange={(e) => setNewLibForm({ ...newLibForm, code: e.target.value.toUpperCase() })}
                    placeholder="SARAS-01"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    SaaS Plan
                  </label>
                  <select
                    value={newLibForm.plan}
                    onChange={(e) => setNewLibForm({ ...newLibForm, plan: e.target.value as LibraryPlan })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="starter">Starter (15 Seats, 5k Books)</option>
                    <option value="pro">Professional (30 Seats, 20k Books)</option>
                    <option value="enterprise">Enterprise (60 Seats, 50k Books)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Owner / Director Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLibForm.ownerName}
                    onChange={(e) => setNewLibForm({ ...newLibForm, ownerName: e.target.value })}
                    placeholder="e.g. Anand Verma"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Owner Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newLibForm.ownerEmail}
                    onChange={(e) => setNewLibForm({ ...newLibForm, ownerEmail: e.target.value })}
                    placeholder="owner@library.com"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={newLibForm.phone}
                    onChange={(e) => setNewLibForm({ ...newLibForm, phone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={newLibForm.city}
                    onChange={(e) => setNewLibForm({ ...newLibForm, city: e.target.value })}
                    placeholder="e.g. Pune"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
                >
                  <span>Provision Library</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Suspend Confirmation Modal */}
      {suspendingLibrary && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/60 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Suspend Library Tenant</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to suspend <strong className="text-white font-bold">{suspendingLibrary.name}</strong>?
              Users of this library will immediately be blocked from accessing their dashboard and library records until reactivated.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for Suspension
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
                placeholder="State the reason (e.g. overdue subscription or policy compliance)"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSuspendingLibrary(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSuspension}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5"
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span>Confirm Suspension</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2.5: Delete Library Confirmation Modal */}
      {deletingLibrary && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/60 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Permanently Remove Library</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white font-bold">{deletingLibrary.name}</strong> ({deletingLibrary.code})?
            </p>
            <p className="text-[11px] text-rose-300/90 mt-2 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/40">
              ⚠️ Warning: This library and its settings will be completely removed from the database.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingLibrary(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteLibrary}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Library</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Library Details Modal */}
      {editingLibrary && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-base font-black text-white">Edit Library Details</h3>
              <button
                onClick={() => setEditingLibrary(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Library Name
                </label>
                <input
                  type="text"
                  required
                  value={editingLibrary.name}
                  onChange={(e) => setEditingLibrary({ ...editingLibrary, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editingLibrary.code}
                    onChange={(e) => setEditingLibrary({ ...editingLibrary, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    SaaS Plan
                  </label>
                  <select
                    value={editingLibrary.plan}
                    onChange={(e) => setEditingLibrary({ ...editingLibrary, plan: e.target.value as LibraryPlan })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingLibrary.ownerName}
                    onChange={(e) => setEditingLibrary({ ...editingLibrary, ownerName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={editingLibrary.phone || ''}
                    onChange={(e) => setEditingLibrary({ ...editingLibrary, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Max Reading Room Desks
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    value={editingLibrary.maxSeats || 30}
                    onChange={(e) => setEditingLibrary({ ...editingLibrary, maxSeats: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Max Books Capacity
                  </label>
                  <input
                    type="number"
                    min={500}
                    max={100000}
                    value={editingLibrary.maxBooks || 15000}
                    onChange={(e) => setEditingLibrary({ ...editingLibrary, maxBooks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingLibrary(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
