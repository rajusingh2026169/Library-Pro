import React from 'react';
import { PowerOff, AlertTriangle, LogOut, Phone, Mail, Building2 } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';

export const SuspendedNotice: React.FC = () => {
  const { currentLibrary } = useTenant();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-center font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-rose-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in-50 duration-200">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto shadow-xl shadow-rose-950/40">
          <PowerOff className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Account Inactive / Suspended
          </span>
          <h2 className="text-xl font-extrabold text-white mt-2">
            Library Access Suspended
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            पुस्तकालय खाता निलंबित कर दिया गया है
          </p>
        </div>

        {currentLibrary && (
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-left text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>{currentLibrary.name}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Library Code: {currentLibrary.code}
            </p>
            {currentLibrary.suspendedReason && (
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-rose-300 bg-rose-950/30 p-2 rounded-xl">
                <p className="font-semibold text-rose-400">Suspension Notice:</p>
                <p>{currentLibrary.suspendedReason}</p>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-slate-400 leading-relaxed">
          This library tenant has been suspended by the platform administrator. Access to books, students, reading room seats, attendance, and fee collection is paused.
        </p>

        <div className="pt-2 border-t border-slate-800 flex flex-col gap-2.5">
          <a
            href="mailto:admin@librarypro.com?subject=LibraryPro%20Account%20Reactivation"
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Platform Administrator (admin@librarypro.com)</span>
          </a>

          <button
            onClick={async () => {
              try {
                await logout();
              } catch (e) {
                console.error(e);
              }
            }}
            className="w-full py-2 px-4 rounded-xl font-semibold text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
