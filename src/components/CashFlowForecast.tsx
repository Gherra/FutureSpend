import { useState } from 'react';
import type { CalendarEvent } from '../types';
import { predictCost } from '../utils/predictions';

interface DaySpend {
  label: string;
  sublabel: string;
  amount: number;
  isToday: boolean;
  calEvents: CalendarEvent[];
}

function buildDays(events: CalendarEvent[]): DaySpend[] {
  const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const calEvents = events.filter((e) => e.date === dateStr);
    const amount = calEvents.reduce(
      (sum, e) => sum + predictCost(e.title, e.category, e.socialPressure).total, 0
    );

    return {
      label: i === 0 ? 'Today' : DAY_ABBR[d.getDay()],
      sublabel: d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
      amount,
      isToday: i === 0,
      calEvents,
    };
  });
}

function barColor(amount: number, max: number) {
  const pct = amount / Math.max(max, 1);
  if (pct < 0.35) return '#006AC3';
  if (pct < 0.65) return '#F59E0B';
  if (pct < 0.85) return '#EA580C';
  return '#DC2626';
}

interface Props {
  events: CalendarEvent[];
}

export default function CashFlowForecast({ events }: Props) {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);

  const days      = buildDays(events);
  const maxAmount = Math.max(...days.map((d) => d.amount), 40);
  const totalWeek = days.reduce((s, d) => s + d.amount, 0);

  const CHART_H = 90;
  const BAR_W   = 28;
  const GAP     = 10;
  const SVG_W   = days.length * (BAR_W + GAP) - GAP;

  // Jekyll Path: 60% of each bar (40% reduction)
  const jekyllPathPts = days
    .map((day, i) => {
      if (day.amount === 0) return null;
      const x = i * (BAR_W + GAP) + BAR_W / 2;
      const jekyllH = Math.max(Math.round((day.amount * 0.6 / maxAmount) * CHART_H), 2);
      return `${x},${CHART_H - jekyllH}`;
    })
    .filter(Boolean) as string[];

  const handleBarClick = (i: number) =>
    setSelectedDayIdx(selectedDayIdx === i ? null : i);

  return (
    <div className="nomi-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-bold" style={{ color: '#0F1923' }}>Cash Flow Forecast</div>
          <div className="text-xs" style={{ color: '#8FA3B8' }}>Predicted spending — next 7 days</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black" style={{ color: '#0F1923' }}>${totalWeek}</div>
          <div className="text-xs" style={{ color: '#8FA3B8' }}>total projected</div>
        </div>
      </div>

      {/* SVG bar chart */}
      <div className="overflow-x-auto">
        <svg
          width={SVG_W}
          height={CHART_H + 46}
          viewBox={`0 0 ${SVG_W} ${CHART_H + 46}`}
          style={{ display: 'block', minWidth: '100%' }}>

          {/* Gridlines */}
          {[0.25, 0.5, 0.75, 1].map((t) => {
            const y = CHART_H - Math.round(t * CHART_H);
            return (
              <line
                key={t}
                x1={0} y1={y} x2={SVG_W} y2={y}
                stroke="#EEF3F8" strokeWidth="1"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Bars */}
          {days.map((day, i) => {
            const x      = i * (BAR_W + GAP);
            const barH   = day.amount > 0
              ? Math.max(Math.round((day.amount / maxAmount) * CHART_H), 4)
              : 0;
            const barY   = CHART_H - barH;
            const color  = barColor(day.amount, maxAmount);
            const cx     = x + BAR_W / 2;
            const isActive = selectedDayIdx === i;

            return (
              <g
                key={i}
                onClick={() => handleBarClick(i)}
                style={{ cursor: 'pointer' }}>

                {/* Active ring */}
                {isActive && (
                  <rect
                    x={x - 3} y={-3} width={BAR_W + 6} height={CHART_H + 6}
                    rx={9} fill="none"
                    stroke={color} strokeWidth="2" opacity="0.45"
                  />
                )}

                {/* Bar background track */}
                <rect
                  x={x} y={0} width={BAR_W} height={CHART_H}
                  rx={6} fill={isActive ? `${color}14` : '#F5F7FA'}
                />

                {/* Today highlight */}
                {day.isToday && !isActive && (
                  <rect
                    x={x - 3} y={0} width={BAR_W + 6} height={CHART_H}
                    rx={8} fill={`${color}10`}
                    stroke={`${color}30`} strokeWidth="1"
                  />
                )}

                {/* Filled bar */}
                {day.amount > 0 && (
                  <rect
                    x={x} y={barY} width={BAR_W} height={barH}
                    rx={6} fill={color}
                    style={{ opacity: isActive ? 1 : day.isToday ? 0.9 : 0.72 }}
                  />
                )}

                {/* Amount label above bar */}
                {day.amount > 0 && (
                  <text
                    x={cx} y={barY - 4}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="'Inter', monospace"
                    fontWeight="700"
                    fill={isActive ? color : `${color}CC`}>
                    ${day.amount}
                  </text>
                )}

                {/* Day label */}
                <text
                  x={cx} y={CHART_H + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="'Inter', sans-serif"
                  fontWeight={day.isToday || isActive ? '700' : '500'}
                  fill={isActive ? color : day.isToday ? '#006AC3' : '#5A6880'}>
                  {day.label}
                </text>

                {/* Date sublabel */}
                <text
                  x={cx} y={CHART_H + 26}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontFamily="'Inter', sans-serif"
                  fill={isActive ? color : '#8FA3B8'}>
                  {day.sublabel}
                </text>

                {/* Event dot indicator */}
                {day.calEvents.length > 0 && (
                  <circle cx={cx} cy={CHART_H + 37} r="2.5" fill={color} opacity={isActive ? 1 : 0.7} />
                )}
              </g>
            );
          })}

          {/* ── Jekyll Path dotted line ── */}
          {jekyllPathPts.length >= 2 && (
            <>
              <polyline
                points={jekyllPathPts.join(' ')}
                fill="none"
                stroke="#059669"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.75"
              />
              {/* Dots at each Jekyll Path point */}
              {jekyllPathPts.map((pt, i) => {
                const [px, py] = pt.split(',').map(Number);
                return (
                  <circle
                    key={i}
                    cx={px} cy={py} r="2.5"
                    fill="white"
                    stroke="#059669"
                    strokeWidth="1.5"
                    opacity="0.85"
                  />
                );
              })}
            </>
          )}
        </svg>
      </div>

      {/* ── Drill-down panel ── */}
      {selectedDayIdx !== null && (() => {
        const day = days[selectedDayIdx];
        return (
          <div
            className="mt-3 pt-3 slide-up"
            style={{ borderTop: '1px solid #EEF3F8' }}>
            {/* Panel header */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-1 h-4 rounded-full"
                  style={{ background: barColor(day.amount, maxAmount) }}
                />
                <span className="text-xs font-bold" style={{ color: '#0F1923' }}>
                  {day.label}
                  <span className="font-normal ml-1" style={{ color: '#8FA3B8' }}>· {day.sublabel}</span>
                </span>
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: barColor(day.amount, maxAmount) }}>
                ${day.amount}
              </span>
            </div>

            {day.calEvents.length === 0 ? (
              <p className="text-xs py-2 text-center" style={{ color: '#8FA3B8' }}>
                No events scheduled — free day on the Jekyll Path.
              </p>
            ) : (
              <div className="space-y-1.5">
                {day.calEvents.map((ev) => {
                  const bd    = predictCost(ev.title, ev.category, ev.socialPressure);
                  const color = barColor(bd.total, maxAmount);
                  return (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between px-3 py-2 rounded-xl"
                      style={{ background: '#F8FAFC', border: '1px solid #E5EDF5' }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs px-1.5 py-0.5 rounded-md border cat-${ev.category} flex-shrink-0`}>
                          {ev.category}
                        </span>
                        <span className="text-xs truncate" style={{ color: '#0F1923' }}>
                          {ev.title}
                        </span>
                      </div>
                      <span
                        className="text-xs font-mono font-bold flex-shrink-0 ml-2"
                        style={{ color }}>
                        ${bd.total}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Legend */}
      <div
        className="flex items-center justify-between mt-3 pt-3"
        style={{ borderTop: '1px solid #EEF3F8' }}>
        <div className="flex items-center gap-3">
          {[
            { color: '#006AC3', label: 'Low' },
            { color: '#F59E0B', label: 'Moderate' },
            { color: '#EA580C', label: 'High' },
            { color: '#DC2626', label: 'Critical' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
              <span className="text-xs" style={{ color: '#8FA3B8' }}>{label}</span>
            </div>
          ))}
        </div>
        {/* Jekyll Path legend */}
        <div className="flex items-center gap-1.5">
          <svg width="18" height="10" viewBox="0 0 18 10">
            <line
              x1="0" y1="5" x2="18" y2="5"
              stroke="#059669" strokeWidth="1.5"
              strokeDasharray="4 3" strokeLinecap="round"
            />
          </svg>
          <span className="text-xs font-medium" style={{ color: '#059669' }}>Jekyll Path</span>
        </div>
      </div>
    </div>
  );
}
