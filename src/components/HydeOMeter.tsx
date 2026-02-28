import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Pencil } from 'lucide-react';
import type { CalendarEvent } from '../types';
import { predictCost } from '../utils/predictions';

interface DamageItem {
  eventId: string;
  title: string;
  saving: number;
  suggestion: string;
}

interface HydeOMeterProps {
  totalSpend: number;
  weeklyBudget: number;
  events?: CalendarEvent[];
  onDeleteEvent?: (id: string) => void;
  onShowToast?: (msg: string) => void;
  onUpdateBudget?: (budget: number) => void;
  onDamageControlAct?: () => void;
  compact?: boolean;
}

// RBC blue → amber → muted red
function getColor(pct: number): string {
  if (pct < 0.5)  return '#006AC3'; // RBC blue — on track
  if (pct < 0.75) return '#F59E0B'; // amber — approaching
  return '#DC2626';                  // muted red — high risk
}

function getBadge(pct: number): { label: string; color: string; bg: string } {
  if (pct < 0.5)  return { label: 'On Track',          color: '#1E40AF', bg: '#EFF6FF' };
  if (pct < 0.75) return { label: 'Approaching Limit', color: '#92400E', bg: '#FEF3C7' };
  return              { label: 'High Risk Week',      color: '#991B1B', bg: '#FEE2E2' };
}

function buildDamageItems(events: CalendarEvent[]): DamageItem[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + 7);

  return events
    .filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      return d >= now && d <= cutoff;
    })
    .map((e) => {
      const cost = predictCost(e.title, e.category, e.socialPressure).total;
      const short = e.title.length > 32 ? e.title.slice(0, 32) + '…' : e.title;
      return {
        eventId: e.id,
        title: e.title,
        saving: cost,
        suggestion: `Remove "${short}" — saves $${cost} this week`,
      };
    })
    .sort((a, b) => b.saving - a.saving)
    .slice(0, 3);
}

// Build 7-day spend breakdown starting today
function buildDailyBars(events: CalendarEvent[]): { label: string; amount: number; isToday: boolean }[] {
  const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const amount = events
      .filter((e) => e.date === dateStr)
      .reduce((sum, e) => sum + predictCost(e.title, e.category, e.socialPressure).total, 0);
    return { label: DAY_ABBR[d.getDay()], amount, isToday: i === 0 };
  });
}

const roundTo5 = (n: number) => Math.max(20, Math.round(n / 5) * 5);

// Ring geometry
const RING_R    = 68;
const RING_CX   = 95;
const RING_CY   = 95;
const RING_STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

// Bar chart geometry
const BAR_W   = 20;
const BAR_GAP = 5;
const MAX_BAR_H = 30;
const CHART_W = 7 * BAR_W + 6 * BAR_GAP; // 170
const CHART_H = MAX_BAR_H + 17;            // 47

export default function HydeOMeter({
  totalSpend,
  weeklyBudget,
  events = [],
  onDeleteEvent,
  onShowToast,
  onUpdateBudget,
  onDamageControlAct,
  compact = false,
}: HydeOMeterProps) {
  const pct        = Math.min(totalSpend / weeklyBudget, 1);
  const color      = getColor(pct);
  const badge      = getBadge(pct);
  const isCritical = pct >= 0.75;
  const isHydeMoment = pct > 0.9;
  const remaining  = Math.max(0, weeklyBudget - totalSpend);
  const dashOffset = CIRCUMFERENCE * (1 - pct);

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput]         = useState(String(weeklyBudget));

  const dailyBars = useMemo(() => buildDailyBars(events), [events]);
  const maxBarAmt = Math.max(...dailyBars.map((b) => b.amount), 10);

  const damageItems = useMemo(
    () => (isCritical ? buildDamageItems(events) : []),
    [isCritical, events]
  );

  const handleActOnThis = (item: DamageItem) => {
    onDeleteEvent?.(item.eventId);
    onDamageControlAct?.();
    onShowToast?.(
      `Smart call — you saved $${item.saving} and brought your week back on track. Jekyll approves.`
    );
  };

  const conservativeAmt = roundTo5(totalSpend * 0.7);
  const balancedAmt     = roundTo5(totalSpend);
  const flexibleAmt     = roundTo5(totalSpend * 1.3);

  const handleSaveBudget = () => {
    const val = parseInt(budgetInput, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateBudget?.(val);
      setShowBudgetModal(false);
    }
  };

  // ── Compact mode (header strip) ──
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-xs font-bold font-mono" style={{ color }}>
          ${totalSpend}
        </span>
        <span className="text-xs" style={{ color: '#8FA3B8' }}>/ ${weeklyBudget}</span>
      </div>
    );
  }

  return (
    <>
      <div
        className="nomi-card p-4"
        style={{
          borderTop: `3px solid ${color}`,
          background: isHydeMoment ? 'rgba(220,38,38,0.025)' : 'white',
          transition: 'background 0.7s ease',
        }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold" style={{ color: '#0F1923' }}>Hyde-O-Meter</span>
          <span
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: badge.bg, color: badge.color }}>
            {badge.label}
          </span>
        </div>
        <p className="text-xs mb-3" style={{ color: '#8FA3B8' }}>Predicted spend vs weekly target</p>

        {/* ── Circular ring with text overlay ── */}
        <div className="relative flex justify-center mb-1">
          <svg
            width="190" height="190"
            viewBox="0 0 190 190"
            aria-label={`${Math.round(pct * 100)}% of weekly budget`}>
            {/* Base track */}
            <circle
              cx={RING_CX} cy={RING_CY} r={RING_R}
              fill="none"
              stroke="#EEF3F8"
              strokeWidth={RING_STROKE}
            />
            {/* Animated fill ring */}
            <circle
              cx={RING_CX} cy={RING_CY} r={RING_R}
              fill="none"
              stroke={color}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${RING_CX} ${RING_CY})`}
              style={{
                transition: 'stroke-dashoffset 0.85s cubic-bezier(0.25,0.46,0.45,0.94), stroke 0.5s ease',
              }}
            />
          </svg>

          {/* Center text: dollar, target line, remaining */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className="text-[28px] font-black font-mono leading-none"
              style={{ color, transition: 'color 0.5s ease' }}>
              ${totalSpend}
            </div>

            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[11px]" style={{ color: '#8FA3B8' }}>
                of ${weeklyBudget} target
              </span>
              {onUpdateBudget && (
                <button
                  onClick={() => { setBudgetInput(String(weeklyBudget)); setShowBudgetModal(true); }}
                  className="inline-flex items-center p-0.5 rounded transition-all"
                  style={{ color: '#C8D8E8', border: '1px solid #DDE5EE' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#006AC3'; e.currentTarget.style.borderColor = '#006AC3'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#C8D8E8'; e.currentTarget.style.borderColor = '#DDE5EE'; }}
                  title="Edit weekly target">
                  <Pencil size={8} />
                </button>
              )}
            </div>

            <div
              className="text-[11px] font-semibold mt-0.5"
              style={{ color, transition: 'color 0.5s ease' }}>
              Remaining: ${remaining}
            </div>
          </div>
        </div>

        {/* ── Hyde moment ── */}
        {isHydeMoment && (
          <p
            className="text-center text-[11px] italic mb-2 slide-up"
            style={{ color: 'rgba(220,38,38,0.6)', letterSpacing: '0.01em' }}>
            Hyde is taking over your week.
          </p>
        )}

        {/* ── Micro daily bar chart (Mon–Sun) ── */}
        <div className="flex justify-center mb-4">
          <svg
            width={CHART_W} height={CHART_H}
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
            {dailyBars.map((bar, i) => {
              const x    = i * (BAR_W + BAR_GAP);
              const barH = bar.amount > 0
                ? Math.max(Math.round((bar.amount / maxBarAmt) * MAX_BAR_H), 3)
                : 2;
              const barY  = MAX_BAR_H - barH;
              const barCX = x + BAR_W / 2;

              return (
                <g key={i}>
                  {/* Track */}
                  <rect
                    x={x} y={0} width={BAR_W} height={MAX_BAR_H}
                    rx={4} fill="#F0F4F8"
                  />
                  {/* Fill */}
                  <rect
                    x={x} y={barY} width={BAR_W} height={barH}
                    rx={4}
                    fill={color}
                    style={{
                      opacity: bar.isToday ? 1 : 0.55,
                      transition: 'fill 0.5s ease',
                    }}
                  />
                  {/* Day label */}
                  <text
                    x={barCX} y={MAX_BAR_H + 13}
                    textAnchor="middle"
                    fontSize="8"
                    fontFamily="Inter, sans-serif"
                    fontWeight={bar.isToday ? '700' : '400'}
                    fill={bar.isToday ? color : '#8FA3B8'}>
                    {bar.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* ── Gradient fill progress bar ── */}
        <div
          className="relative h-2 rounded-full mb-4 overflow-hidden"
          style={{ background: '#EEF3F8' }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${Math.min(pct * 100, 100)}%`,
              background: `linear-gradient(to right, #006AC3 0%, #F59E0B 50%, #DC2626 100%)`,
              backgroundSize: pct > 0 ? `${(1 / pct) * 100}% 100%` : '100% 100%',
              transition: 'width 0.8s cubic-bezier(0.25,0.46,0.45,0.94)',
            }}
          />
        </div>

        {/* ── Damage Control (triggered at ≥75%) ── */}
        {isCritical && damageItems.length > 0 && (
          <div
            className="rounded-xl p-3 slide-up"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <div className="flex items-center gap-2 mb-2.5">
              <AlertTriangle size={13} style={{ color: '#DC2626' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#DC2626' }}>
                Damage Control
              </span>
            </div>
            <div className="space-y-2">
              {damageItems.map((item) => (
                <div
                  key={item.eventId}
                  className="rounded-lg p-2.5"
                  style={{ background: 'white', border: '1px solid #FEE2E2' }}>
                  <p className="text-xs leading-snug mb-2" style={{ color: '#374151' }}>
                    {item.suggestion}
                  </p>
                  <button
                    onClick={() => handleActOnThis(item)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                    style={{ background: '#006AC3', color: 'white' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#004A8B')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#006AC3')}>
                    <CheckCircle size={11} />
                    Act on this
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Budget Edit Modal ── */}
      {showBudgetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowBudgetModal(false)}>
          <div
            className="bg-white rounded-2xl p-5 shadow-xl w-full mx-4 slide-up"
            style={{ maxWidth: '320px' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-sm mb-4" style={{ color: '#0F1923' }}>
              Set Weekly Budget
            </h3>

            {/* Manual input */}
            <div className="mb-4">
              <label className="text-xs mb-1.5 block font-medium" style={{ color: '#5A6880' }}>
                Custom amount (CAD)
              </label>
              <div
                className="flex items-center rounded-xl overflow-hidden"
                style={{ border: '1px solid #DDE5EE' }}>
                <span
                  className="px-3 py-2 text-sm font-bold"
                  style={{ color: '#8FA3B8', background: '#F8FAFC', borderRight: '1px solid #DDE5EE' }}>
                  $
                </span>
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()}
                  className="flex-1 px-3 py-2 text-sm font-mono outline-none"
                  style={{ color: '#0F1923' }}
                  min="1"
                  autoFocus
                />
              </div>
            </div>

            {/* Smart presets */}
            <div className="space-y-1.5 mb-4">
              {[
                { label: 'Conservative — Save More', value: conservativeAmt, sub: 'Cut your planned spend by ~30%' },
                { label: 'Balanced',                 value: balancedAmt,     sub: 'Match your current calendar spend' },
                { label: 'Flexible — Enjoy Life',    value: flexibleAmt,     sub: 'Give yourself a comfortable cushion' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setBudgetInput(String(preset.value))}
                  className="w-full text-left px-3 py-2 rounded-xl border text-xs transition-all"
                  style={{
                    borderColor: budgetInput === String(preset.value) ? '#006AC3' : '#DDE5EE',
                    background:  budgetInput === String(preset.value) ? '#E8F2FB' : '#F8FAFC',
                  }}>
                  <div className="font-semibold" style={{ color: '#0F1923' }}>
                    {preset.label}
                    <span className="font-bold font-mono ml-1.5" style={{ color: '#006AC3' }}>
                      ${preset.value}
                    </span>
                  </div>
                  <div className="mt-0.5" style={{ color: '#8FA3B8' }}>{preset.sub}</div>
                </button>
              ))}
            </div>

            {/* Suggestion line */}
            <p className="text-xs mb-4 px-0.5" style={{ color: '#5A6880' }}>
              Based on your calendar patterns, we suggest{' '}
              <span className="font-bold" style={{ color: '#006AC3' }}>${balancedAmt}/week</span>
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowBudgetModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                style={{ border: '1px solid #DDE5EE', color: '#8FA3B8' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                Cancel
              </button>
              <button
                onClick={handleSaveBudget}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: '#006AC3', color: 'white' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#004A8B')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#006AC3')}>
                Save Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
