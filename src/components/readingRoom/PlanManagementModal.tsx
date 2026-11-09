import React, { useState } from 'react';
import { X, Sparkles, Check, Plus, Edit2, ShieldAlert } from 'lucide-react';
import { useReadingRoom } from '../../context/ReadingRoomContext';
import { useApp } from '../../context/AppContext';
import { RRPlan, PlanType } from '../../types/readingRoom';

interface PlanManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlanManagementModal: React.FC<PlanManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { plans, savePlan, togglePlanStatus } = useReadingRoom();
  const { settings, addToast } = useApp();

  const [editingPlan, setEditingPlan] = useState<RRPlan | null>(null);
  const [isNewPlan, setIsNewPlan] = useState(false);

  const [name, setName] = useState('');
  const [planType, setPlanType] = useState<PlanType>('monthly');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [fee, setFee] = useState<number>(900);
  const [description, setDescription] = useState('');
  const [featuresStr, setFeaturesStr] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (plan: RRPlan) => {
    setEditingPlan(plan);
    setIsNewPlan(false);
    setName(plan.name);
    setPlanType(plan.planType);
    setDurationDays(plan.durationDays);
    setFee(plan.fee);
    setDescription(plan.description);
    setFeaturesStr((plan.features || []).join(', '));
  };

  const handleStartNew = () => {
    setEditingPlan(null);
    setIsNewPlan(true);
    setName('');
    setPlanType('monthly');
    setDurationDays(30);
    setFee(900);
    setDescription('Study hall seat with standard amenities');
    setFeaturesStr('Dedicated Seat, WiFi, Locker, RO Water');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const features = featuresStr
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    const res = await savePlan({
      id: editingPlan ? editingPlan.id : undefined,
      name: name.trim(),
      planType,
      durationDays: Number(durationDays),
      fee: Number(fee),
      description: description.trim(),
      features,
      isActive: editingPlan ? editingPlan.isActive : true,
    });

    if (res.success) {
      addToast({ type: 'success', title: 'Plan Saved', message: `Plan "${name}" updated.` });
      setEditingPlan(null);
      setIsNewPlan(false);
    } else {
      addToast({ type: 'error', title: 'Error', message: res.error });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Configure Membership Plans</h3>
              <p className="text-xs text-slate-300">Daily, Monthly, Quarterly & Yearly Rates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Plan Form if editing/creating */}
          {(editingPlan || isNewPlan) && (
            <form onSubmit={handleSave} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-bold text-sm text-slate-900">
                  {isNewPlan ? 'Add New Membership Plan' : `Edit Plan: ${editingPlan?.name}`}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPlan(null);
                    setIsNewPlan(false);
                  }}
                  className="text-slate-400 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plan Type</label>
                  <select
                    value={planType}
                    onChange={(e) => setPlanType(e.target.value as PlanType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    <option value="daily">Daily Pass</option>
                    <option value="monthly">Monthly Subscription</option>
                    <option value="quarterly">Quarterly Package</option>
                    <option value="yearly">Yearly Package</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Days) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fee ({settings.currencySymbol || '₹'}) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-emerald-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Short Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Features (comma separated)</label>
                  <input
                    type="text"
                    value={featuresStr}
                    onChange={(e) => setFeaturesStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                >
                  Save Plan
                </button>
              </div>
            </form>
          )}

          {/* Plan Cards List */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Available Active Plans ({plans.length})
            </span>
            {!editingPlan && !isNewPlan && (
              <button
                onClick={handleStartNew}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Plan
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                  plan.isActive
                    ? 'bg-white border-slate-200 shadow-xs hover:border-indigo-400'
                    : 'bg-slate-100 border-slate-300 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        {plan.planType} ({plan.durationDays} Days)
                      </span>
                      <h4 className="font-extrabold text-base text-slate-900 mt-1">{plan.name}</h4>
                    </div>

                    <span className="font-mono font-black text-lg text-emerald-700">
                      {settings.currencySymbol || '₹'}{plan.fee}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2">{plan.description}</p>

                  {/* Features list */}
                  {plan.features && plan.features.length > 0 && (
                    <ul className="mt-3 space-y-1 text-[11px] text-slate-600">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Bottom actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => togglePlanStatus(plan.id)}
                    className={`text-[11px] font-bold ${
                      plan.isActive ? 'text-slate-500 hover:text-slate-700' : 'text-emerald-700'
                    } cursor-pointer`}
                  >
                    {plan.isActive ? 'Deactivate' : 'Activate Plan'}
                  </button>

                  <button
                    onClick={() => handleStartEdit(plan)}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
