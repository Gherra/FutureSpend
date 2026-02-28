import { useMemo } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
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
  compact?: boolean;
}

function getColor(pct: number): string {
  if (pct < 0.33) return '#006AC3';
  if (pct < 0.55) return '#F59E0B';
  if (pct < 0.75) return '#EA580C';
  return '#DC2626';
}

function getLabel(pct: number): string {
  if (pct < 0.33) return 'On Track';
  if (pct < 0.55) return 'Caution';
  if (pct < 0.75) return 'Elevated';
  return 'Critical';
}

function getLabelBg(pct: number): string {
  if (pct < 0.33) return '#E8F2FB';
  if (pct < 0.55) return '#FEF3C7';
  if (pct < 0.75) return '#FFEDD5';
  return '#FEE2E2';
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
        suggestion: `Remove "${short}" from your calendar — saves $${cost} this week`,
      };
    })
    .sort((a, b) => b.saving - a.saving)
    .slice(0, 3);
}

export default function HydeOMeter({
  totalSpend,
  weeklyBudget,
  events = [],
  onDeleteEvent,
  onShowToast,
  compact = false,
}: HydeOMeterProps) {
  const pct = Math.min(totalSpend / weeklyBudget, 1);
  const isCritical = pct >= 0.75;
  const color = getColor(pct);
  const label = getLabel(pct);
  const labelBg = getLabelBg(pct);

  // SVG gauge geometry
  const R = 78;
  const cx = 100;
  const cy = 102;
  const circumference = Math.PI * R;

  const offset = useMemo(() => circumference * (1 - pct), [pct, circumference]);
  const angle = -90 + pct * 180;

  const damageItems = useMemo(
    () => (isCritical ? buildDamageItems(events) : []),
    [isCritical, events]
  );

  const handleActOnThis = (item: DamageItem) => {
    onDeleteEvent?.(item.eventId);
    onShowToast?.(
      `Smart call — you saved $${item.saving} and brought your week back on track. Jekyll approves.`
    );
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
    <div
      className="nomi-card p-4"
      style={{ borderTop: `3px solid ${color}` }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold" style={{ color: '#0F1923' }}>Hyde-O-Meter</span>
        <span
          className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: labelBg, color }}>
          {label}
        </span>
      </div>
      <p className="text-xs mb-2" style={{ color: '#8FA3B8' }}>Predicted spend vs weekly budget</p>

      {/* SVG Gauge */}
      <div className="flex justify-center">
        <svg width="200" height="116" viewBox="0 0 200 116">
          <defs>
            <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#006AC3" />
              <stop offset="38%"  stopColor="#F59E0B" />
              <stop offset="68%"  stopColor="#EA580C" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
            fill="none"
            stroke="#E5EDF5"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Zone tick marks */}
          {[0, 0.33, 0.55, 0.75, 1].map((t) => {
            const a = ((-90 + t * 180) * Math.PI) / 180;
            return (
              <line key={t}
                x1={cx + (R - 8) * Math.cos(a)} y1={cy + (R - 8) * Math.sin(a)}
                x2={cx + (R + 1) * Math.cos(a)} y2={cy + (R + 1) * Math.sin(a)}
                stroke="#C8D9EA" strokeWidth="1.5"
              />
            );
          })}

          {/* Progress arc */}
          <path
            className="gauge-arc"
            d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
            fill="none"
            stroke="url(#gauge-grad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />

          {/* Needle */}
          <g
            className="gauge-needle"
            style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${cx}px ${cy}px` }}>
            <line
              x1={cx} y1={cy}
              x2={cx} y2={cy - R + 10}
              stroke={color} strokeWidth="2.5" strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r="5" fill={color} />
            <circle cx={cx} cy={cy} r="2.5" fill="white" />
          </g>

          {/* Zone labels */}
          <text x="24"  y="113" fill="#006AC3" fontSize="7.5" fontFamily="Inter,sans-serif" fontWeight="600">Safe</text>
          <text x="86"  y="28"  fill="#F59E0B" fontSize="7.5" fontFamily="Inter,sans-serif" fontWeight="600" textAnchor="middle">Warn</text>
          <text x="174" y="113" fill="#DC2626" fontSize="7.5" fontFamily="Inter,sans-serif" fontWeight="600" textAnchor="end">Crit</text>
        </svg>
      </div>

      {/* Spend readout */}
      <div className="text-center -mt-1 mb-3">
        <div className="text-3xl font-black font-mono" style={{ color }}>
          ${totalSpend}
        </div>
        <div className="text-xs mt-0.5" style={{ color: '#8FA3B8' }}>
          of ${weeklyBudget} weekly budget
          <span className="font-semibold ml-1.5" style={{ color }}>
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>

      {/* Budget progress bar */}
      <div className="h-1.5 rounded-full mb-4" style={{ background: '#E5EDF5' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(pct * 100, 100)}%`,
            background: `linear-gradient(to right, #006AC3, ${color})`,
            transition: 'width 0.8s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
        />
      </div>

      {/* Damage Control */}
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
  );
}
