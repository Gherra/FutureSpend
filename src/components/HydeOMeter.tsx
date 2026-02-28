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

// Three clean zones: safe / heads-up / critical
function getColor(pct: number): string {
  if (pct < 0.33) return '#22C55E'; // green — safe
  if (pct < 0.75) return '#F59E0B'; // amber — heads up
  return '#DC2626';                  // red   — critical
}

function getBadge(pct: number): { label: string; color: string; bg: string } {
  if (pct < 0.33) return { label: 'On Track', color: '#15803D', bg: '#DCFCE7' };
  if (pct < 0.75) return { label: 'Heads Up',  color: '#92400E', bg: '#FEF3C7' };
  return              { label: 'Critical',   color: '#991B1B', bg: '#FEE2E2' };
}

function getStatusBg(pct: number): string {
  if (pct < 0.33) return 'rgba(34,197,94,0.04)';
  if (pct < 0.75) return 'rgba(245,158,11,0.04)';
  return 'rgba(220,38,38,0.05)';
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

// Polar → SVG cartesian for the gauge arc
function arcPoint(cx: number, cy: number, R: number, t: number) {
  const a = Math.PI * t;
  return {
    x: cx - R * Math.cos(a),
    y: cy - R * Math.sin(a),
  };
}

const roundTo5 = (n: number) => Math.max(20, Math.round(n / 5) * 5);

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
  const pct      = Math.min(totalSpend / weeklyBudget, 1);
  const color    = getColor(pct);
  const badge    = getBadge(pct);
  const statusBg = getStatusBg(pct);
  const isCritical = pct >= 0.75;

  // Budget edit modal state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(weeklyBudget));

  // SVG geometry
  const R  = 78;
  const cx = 100;
  const cy = 104;

  // Needle rotation: -90° at left (pct=0) → +90° at right (pct=1)
  const needleAngle = -90 + pct * 180;

  // "Budget" label position — outside arc at t=0.33
  const budgetLabelPt = arcPoint(cx, cy, R + 18, 0.33);

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

  // Budget modal preset amounts (based on current predicted spend)
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
          background: statusBg,
          transition: 'background 0.6s ease',
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
        <p className="text-xs mb-1" style={{ color: '#8FA3B8' }}>Predicted spend vs weekly budget</p>

        {/* ── SVG Gauge ── */}
        <div className="flex justify-center">
          <svg width="200" height="120" viewBox="0 0 200 120">
            <defs>
              {/* Full spectrum gradient: always green → amber → red */}
              <linearGradient id="arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#22C55E" />
                <stop offset="36%"  stopColor="#F59E0B" />
                <stop offset="70%"  stopColor="#EA580C" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
            </defs>

            {/* ── Full gradient arc track — always fully visible ── */}
            <path
              d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
              fill="none"
              stroke="url(#arc-grad)"
              strokeWidth="13"
              strokeLinecap="round"
            />

            {/* ── Tick at budget threshold (t=0.33) ── */}
            {(() => {
              const inner = arcPoint(cx, cy, R - 7, 0.33);
              const outer = arcPoint(cx, cy, R + 7, 0.33);
              return (
                <line
                  x1={inner.x} y1={inner.y}
                  x2={outer.x} y2={outer.y}
                  stroke="white" strokeWidth="2.5" strokeLinecap="round"
                />
              );
            })()}

            {/* ── "Budget" label at threshold ── */}
            <text
              x={budgetLabelPt.x}
              y={budgetLabelPt.y + 4}
              textAnchor="middle"
              fontSize="7.5"
              fontFamily="Inter, sans-serif"
              fontWeight="700"
              fill="#F59E0B">
              Budget
            </text>

            {/* ── Tick marks at safe and critical ends ── */}
            {[0, 1].map((t) => {
              const inner = arcPoint(cx, cy, R - 7, t);
              const outer = arcPoint(cx, cy, R + 7, t);
              return (
                <line key={t}
                  x1={inner.x} y1={inner.y}
                  x2={outer.x} y2={outer.y}
                  stroke="white" strokeWidth="2" strokeLinecap="round"
                />
              );
            })}

            {/* ── Zone labels: "Safe" left, "Critical" right ── */}
            <text x={cx - R + 2} y="116"
              fill="#22C55E" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="700">
              Safe
            </text>
            <text x={cx + R - 2} y="116"
              fill="#DC2626" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="700"
              textAnchor="end">
              Critical
            </text>

            {/* ── Needle ── */}
            <g
              className="gauge-needle"
              style={{ transform: `rotate(${needleAngle}deg)`, transformOrigin: `${cx}px ${cy}px` }}>
              <line
                x1={cx} y1={cy}
                x2={cx} y2={cy - R + 12}
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx={cx} cy={cy} r="5.5" fill={color} />
              <circle cx={cx} cy={cy} r="2.5"  fill="white" />
            </g>
          </svg>
        </div>

        {/* ── Dollar readout ── */}
        <div className="text-center -mt-2 mb-3">
          <div
            className="text-3xl font-black font-mono"
            style={{ color, transition: 'color 0.5s ease' }}>
            ${totalSpend}
          </div>
          <div className="text-xs mt-0.5 flex items-center justify-center gap-1.5 flex-wrap" style={{ color: '#8FA3B8' }}>
            <span>of ${weeklyBudget} weekly budget</span>
            <span className="font-semibold" style={{ color }}>
              {Math.round(pct * 100)}%
            </span>
            {onUpdateBudget && (
              <button
                onClick={() => { setBudgetInput(String(weeklyBudget)); setShowBudgetModal(true); }}
                className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-md transition-all"
                style={{ color: '#8FA3B8', border: '1px solid #DDE5EE' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#006AC3'; e.currentTarget.style.borderColor = '#006AC3'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#8FA3B8'; e.currentTarget.style.borderColor = '#DDE5EE'; }}>
                <Pencil size={9} />
                Edit
              </button>
            )}
          </div>
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

        {/* ── Damage Control (critical only) ── */}
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
