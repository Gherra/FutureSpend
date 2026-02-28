import type { CalendarEvent } from '../types';
import { predictCost } from '../utils/predictions';

interface DaySpend {
  label: string;
  sublabel: string;
  amount: number;
  isToday: boolean;
  events: string[];
}

function buildDays(events: CalendarEvent[]): DaySpend[] {
  const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const dayEvents = events.filter((e) => e.date === dateStr);
    const amount = dayEvents.reduce(
      (sum, e) => sum + predictCost(e.title, e.category, e.socialPressure).total, 0
    );

    return {
      label: i === 0 ? 'Today' : DAY_ABBR[d.getDay()],
      sublabel: d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
      amount,
      isToday: i === 0,
      events: dayEvents.map((e) => e.title),
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
  const days = buildDays(events);
  const maxAmount = Math.max(...days.map((d) => d.amount), 40);
  const totalWeek = days.reduce((s, d) => s + d.amount, 0);

  const CHART_H = 90; // px height of bar area
  const BAR_W = 28;   // px bar width
  const GAP = 10;     // px gap between bars
  const SVG_W = days.length * (BAR_W + GAP) - GAP;

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

          {days.map((day, i) => {
            const x = i * (BAR_W + GAP);
            const barH = day.amount > 0
              ? Math.max(Math.round((day.amount / maxAmount) * CHART_H), 4)
              : 0;
            const barY = CHART_H - barH;
            const color = barColor(day.amount, maxAmount);
            const cx = x + BAR_W / 2;

            return (
              <g key={i}>
                {/* Bar background track */}
                <rect
                  x={x} y={0} width={BAR_W} height={CHART_H}
                  rx={6} fill="#F5F7FA"
                />

                {/* Today highlight */}
                {day.isToday && (
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
                    style={{ opacity: day.isToday ? 1 : 0.75 }}
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
                    fill={color}>
                    ${day.amount}
                  </text>
                )}

                {/* Day label */}
                <text
                  x={cx} y={CHART_H + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="'Inter', sans-serif"
                  fontWeight={day.isToday ? '700' : '500'}
                  fill={day.isToday ? '#006AC3' : '#5A6880'}>
                  {day.label}
                </text>

                {/* Date sublabel */}
                <text
                  x={cx} y={CHART_H + 26}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontFamily="'Inter', sans-serif"
                  fill="#8FA3B8">
                  {day.sublabel}
                </text>

                {/* Event dot indicator */}
                {day.events.length > 0 && (
                  <circle cx={cx} cy={CHART_H + 37} r="2.5" fill={color} opacity="0.7" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid #EEF3F8' }}>
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
    </div>
  );
}
