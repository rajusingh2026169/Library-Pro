import React, { useState, useRef } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  Building,
  Clock,
  Receipt,
  Database,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LibrarySettings } from '../../types';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, exportBackupData, importBackupData, hasPermission } = useApp();

  const [form, setForm] = useState<LibrarySettings>({ ...settings });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof LibrarySettings, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportBackupData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `librarypro_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importBackupData(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Library Configuration & Parameters
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure institutional profile, loan quotas, grace periods, overdue fee schedules, and disaster recovery.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Institution & Branch Identity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Institution & Branch Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Institution Name
              </label>
              <input
                type="text"
                value={form.institutionName}
                onChange={(e) => handleChange('institutionName', e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Library Name
              </label>
              <input
                type="text"
                value={form.libraryName}
                onChange={(e) => handleChange('libraryName', e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Branch Identifier Code
              </label>
              <input
                type="text"
                value={form.branchCode}
                onChange={(e) => handleChange('branchCode', e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Contact Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Circulation Desk Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Campus Physical Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Circulation Policies & Fine Rules */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Circulation & Overdue Policies</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Student Loan Period (Days)
              </label>
              <input
                type="number"
                min={1}
                value={form.defaultLoanPeriodDays}
                onChange={(e) => handleChange('defaultLoanPeriodDays', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Faculty Loan Period (Days)
              </label>
              <input
                type="number"
                min={1}
                value={form.facultyLoanPeriodDays}
                onChange={(e) => handleChange('facultyLoanPeriodDays', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Grace Period (Days)
              </label>
              <input
                type="number"
                min={0}
                value={form.gracePeriodDays}
                onChange={(e) => handleChange('gracePeriodDays', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Daily Fine Rate ({form.currencySymbol})
              </label>
              <input
                type="number"
                step="0.25"
                min={0}
                value={form.finePerDay}
                onChange={(e) => handleChange('finePerDay', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Max Unpaid Fine Before Block ({form.currencySymbol})
              </label>
              <input
                type="number"
                min={1}
                value={form.maxFineBeforeBlock}
                onChange={(e) => handleChange('maxFineBeforeBlock', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Max Renewals Permitted
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={form.maxRenewalsAllowed}
                onChange={(e) => handleChange('maxRenewalsAllowed', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Billing & Receipt Customization */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Billing & Receipt Customization</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={form.currencySymbol}
                onChange={(e) => handleChange('currencySymbol', e.target.value)}
                placeholder="$"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Currency Code
              </label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                placeholder="USD"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 uppercase font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Receipt Footer Notice
              </label>
              <input
                type="text"
                value={form.receiptFooter}
                onChange={(e) => handleChange('receiptFooter', e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        {hasPermission('SUPER_ADMIN') && (
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          </div>
        )}
      </form>


      {/* Section 5: Data Backup, Import & Disaster Recovery */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Database Backup, Export & Recovery</h3>
        </div>

        <p className="text-xs text-slate-600">
          Export a complete, self-contained JSON snapshot of all library collections (catalog, members, active & returned loans, hold reservations, fine ledgers, and audit logs).
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Full JSON Backup
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Restore from JSON File
          </button>
        </div>
      </div>
    </div>
  );
};
