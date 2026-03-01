import { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, CheckCircle2, Star } from 'lucide-react';
import type { CalendarEvent } from '../types';
import { predictCost } from '../utils/predictions';
import AddEventModal from './AddEventModal';

interface NomiInsight {
  id: string;
  type: 'warning' | 'pattern' | 'opportunity';
  headline: string;
  detail: string;
}

const TYPE_META = {
  warning: {
    icon: AlertCircle,
    iconColor: '#D97706',
    iconBg: '#FFF8E6',
    accentBar: '#D97706',
    label: 'Heads up',
    labelBg: '#FFF3CD',
    labelColor: '#92400E',
  },
  pattern: {
    icon: TrendingUp,
    iconColor: '#006AC3',
    iconBg: '#E8F2FB',
    accentBar: '#006AC3',
    label: 'Pattern',
    labelBg: '#DBEAFE',
    labelColor: '#1E40AF',
  },
  opportunity: {
    icon: CheckCircle2,
    iconColor: '#059669',
    iconBg: '#E6F9F0',
    accentBar: '#059669',
    label: 'Good news',
    labelBg: '#D1FAE5',
    labelColor: '#065F46',
  },
};

function t2m(t: string): number { const [h, m] = t.split(':').map(Number); return h * 60 + m; }

interface StackedPair { ev1: CalendarEvent; ev2: CalendarEvent; gapMins: number | null; }

function detectStackedEvents(events: CalendarEvent[]): StackedPair | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + 7);

  const upcoming = events.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    return d >= now && d <= cutoff;
  });

  const byDate: Record<string, CalendarEvent[]> = {};
  for (const ev of upcoming) {
    if (!byDate[ev.date]) byDate[ev.date] = [];
    byDate[ev.date].push(ev);
  }

  for (const date of Object.keys(byDate).sort()) {
    const evs = byDate[date];
    if (evs.length >= 2) {
      const [ev1, ev2] = evs;
      const gapMins = (ev1.time && ev2.time) ? Math.abs(t2m(ev2.time) - t2m(ev1.time)) : null;
      // Skip if events are more than 6 hours apart — not a real stacking risk
      if (gapMins !== null && gapMins >= 360) continue;
      return { ev1, ev2, gapMins };
    }
  }
  return null;
}

function generateInsights(events: CalendarEvent[]): NomiInsight[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + 7);

  const upcoming = events.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    return d >= now && d <= cutoff;
  });

  const weekendSocial = upcoming.filter((e) => {
    const day = new Date(e.date + 'T00:00:00').getDay();
    return (day === 5 || day === 6 || day === 0) && e.category === 'Social';
  });
  const weekendCost = weekendSocial.reduce(
    (sum, e) => sum + predictCost(e.title, e.category, e.socialPressure).total, 0
  );

  const insight1: NomiInsight = weekendSocial.length > 0
    ? { id: 'i1', type: 'warning', headline: 'Your weekend looks expensive', detail: `${weekendSocial.length} social event${weekendSocial.length > 1 ? 's' : ''} this weekend with a predicted total of $${weekendCost}. Social pressure is running high across these events.` }
    : { id: 'i1', type: 'warning', headline: 'High-pressure event coming up', detail: upcoming.length > 0 ? `"${upcoming[0].title}" carries elevated social pressure (${upcoming[0].socialPressure}%) — predicted at $${predictCost(upcoming[0].title, upcoming[0].category, upcoming[0].socialPressure).total}.` : 'No high-pressure events detected in the next 7 days. Looking good!' };

  const highPressureCount = upcoming.filter((e) => e.socialPressure > 65).length;
  const insight2: NomiInsight = {
    id: 'i2', type: 'pattern', headline: 'Pattern detected: Friday nights',
    detail: highPressureCount > 1 ? `You have ${highPressureCount} high-social-pressure events this week. Based on your calendar history, these events run ~$40 over initial estimates on average.` : 'Based on similar calendar weeks, food & drink spending tends to spike 35% when events cluster mid-week. Plan ahead.',
  };

  const socialEvents = [...upcoming]
    .filter((e) => e.category === 'Social' || e.category === 'Personal')
    .sort((a, b) => predictCost(b.title, b.category, b.socialPressure).total - predictCost(a.title, a.category, a.socialPressure).total);
  const topEvent = socialEvents[0];
  const topCost = topEvent ? predictCost(topEvent.title, topEvent.category, topEvent.socialPressure).total : 0;
  const rogersAmount = topCost > 0 ? Math.round(topCost * 0.85) : 60;
  const insight3: NomiInsight = {
    id: 'i3', type: 'opportunity',
    headline: topEvent ? `Skipping "${topEvent.title.split(' ').slice(0, 4).join(' ')}…" frees $${topCost}` : "You're tracking well this week",
    detail: topEvent ? `That $${topCost} could cover your Rogers bill ($${rogersAmount}), a full week of groceries, or go straight into savings. Just a thought.` : 'No obvious high-spend events to cut. Keep up the Jekyll streak!',
  };

  return [insight1, insight2, insight3];
}

function StarRating({ insightId, resetKey }: { insightId: string; resetKey: number }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { setRating(0); setHover(0); setSubmitted(false); }, [resetKey]);

  if (submitted) return <span className="text-xs" style={{ color: '#059669' }}>Thanks for the feedback ✓</span>;

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs mr-1" style={{ color: '#8FA3B8' }}>Useful?</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={`${insightId}-${star}`} className="star-btn p-0.5"
          onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
          onClick={() => { setRating(star); setSubmitted(true); }}>
          <Star size={13} fill={(hover || rating) >= star ? '#006AC3' : 'none'} stroke={(hover || rating) >= star ? '#006AC3' : '#CBD5E1'} />
        </button>
      ))}
    </div>
  );
}

interface Props {
  events: CalendarEvent[];
  resetKey: number;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onShowToast: (msg: string) => void;
}

export default function NomiInsights({ events, resetKey, onEditEvent, onDeleteEvent, onShowToast }: Props) {
  const [rescheduleEvent, setRescheduleEvent] = useState<CalendarEvent | null>(null);

  const insights = generateInsights(events);
  const stacked = detectStackedEvents(events);
  const convenienceSpend = stacked
    ? Math.round(15 + ((stacked.ev1.socialPressure + stacked.ev2.socialPressure) / 200) * 10)
    : 0;

  function fmtTime(t: string) {
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }

  const stackedDateLabel = stacked
    ? new Date(stacked.ev1.date + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
    : '';

  const gapLabel = (() => {
    if (!stacked) return '';
    if (!stacked.ev1.time || !stacked.ev2.time) {
      return 'Time not set — add times for more accurate conflict detection';
    }
    const gMins = stacked.gapMins!;
    const gapStr = gMins < 60
      ? `${gMins}min gap`
      : `${+(gMins / 60).toFixed(1)}h gap`;
    // order times chronologically
    const t1 = t2m(stacked.ev1.time) <= t2m(stacked.ev2.time) ? stacked.ev1.time : stacked.ev2.time;
    const t2 = t1 === stacked.ev1.time ? stacked.ev2.time : stacked.ev1.time;
    return `${fmtTime(t1)} → ${fmtTime(t2)} · ${stackedDateLabel} · ${gapStr}`;
  })();

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-bold" style={{ color: '#0F1923' }}>NOMI Insights</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#006AC315', color: '#006AC3', border: '1px solid #006AC325' }}>
          Forward-looking
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* ── Stacking Risk card ── */}
        {stacked && (
          <div className="md:col-span-3 nomi-card p-4 relative overflow-hidden slide-up" style={{ borderLeft: '4px solid #D97706' }}>
            <div className="pl-2">

              {/* Header */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  {/* Outlined triangle warning icon */}
                  <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 1.5L0.5 12.5h13L7 1.5z" />
                    <line x1="7" y1="5.5" x2="7" y2="8.5" />
                    <circle cx="7" cy="10.5" r="0.6" fill="#D97706" stroke="none" />
                  </svg>
                  {/* Badge — left border style, no pill background */}
                  <span className="text-xs font-semibold pl-2" style={{ color: '#92400E', borderLeft: '2px solid #D97706' }}>
                    Stacking Risk
                  </span>
                </div>
                {/* Cost badge — matches event card cost badges */}
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg flex-shrink-0"
                  style={{ background: '#D9770612', color: '#D97706', border: '1px solid #D9770630' }}>
                  +${convenienceSpend}
                </span>
              </div>

              {/* Headline + gap info */}
              <p className="text-sm font-bold leading-snug mb-0.5" style={{ color: '#0F1923' }}>
                High-Risk Transition detected
              </p>
              <p className="text-xs mb-2" style={{ color: '#8FA3B8' }}>
                {gapLabel}
              </p>

              {/* Event names + action buttons */}
              <div className="mb-2.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#D97706' }} />
                  <span className="text-xs font-semibold flex-1 truncate" style={{ color: '#0F1923' }}>{stacked.ev1.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#D97706', opacity: 0.45 }} />
                  <span className="text-xs font-semibold flex-1 truncate" style={{ color: '#0F1923' }}>{stacked.ev2.title}</span>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => setRescheduleEvent(stacked.ev2)}
                      className="text-xs px-2 py-0.5 rounded-md font-semibold transition-colors"
                      style={{ color: '#006AC3', border: '1px solid #006AC340', background: '#006AC308' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#006AC318')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#006AC308')}>
                      Reschedule
                    </button>
                    <button
                      onClick={() => { onDeleteEvent(stacked.ev2.id); onShowToast('Event removed — Hyde-O-Meter updated.'); }}
                      className="text-xs px-2 py-0.5 rounded-md font-semibold transition-colors"
                      style={{ color: '#8FA3B8', border: '1px solid #DDE5EE', background: 'transparent' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#DC262640'; e.currentTarget.style.background = '#DC262608'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#8FA3B8'; e.currentTarget.style.borderColor = '#DDE5EE'; e.currentTarget.style.background = 'transparent'; }}>
                      Cancel Event
                    </button>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <p className="text-xs leading-relaxed" style={{ color: '#5A6880' }}>
                Back-to-back events leave little recovery time — convenience spending on transit, snacks, and impulse purchases typically adds $15–25 to your day.
              </p>

            </div>
          </div>
        )}

        {/* ── Standard insight cards ── */}
        {insights.map((insight, i) => {
          const meta = TYPE_META[insight.type];
          const Icon = meta.icon;
          return (
            <div key={insight.id} className="nomi-card p-4 flex flex-col gap-3 slide-up relative overflow-hidden" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[14px]" style={{ background: meta.accentBar }} />
              <div className="pl-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: meta.iconBg }}>
                    <Icon size={13} style={{ color: meta.iconColor }} />
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: meta.labelBg, color: meta.labelColor }}>
                    {meta.label}
                  </span>
                </div>
                <p className="text-sm font-bold leading-snug mb-1" style={{ color: '#0F1923' }}>{insight.headline}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#5A6880' }}>{insight.detail}</p>
              </div>
              <div className="pl-1 pt-1 border-t" style={{ borderColor: '#EEF3F8' }}>
                <StarRating insightId={insight.id} resetKey={resetKey} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Reschedule modal */}
      {rescheduleEvent && (
        <AddEventModal
          editEvent={rescheduleEvent}
          onAdd={(updated) => { onEditEvent(updated); setRescheduleEvent(null); }}
          onClose={() => setRescheduleEvent(null)}
          existingEvents={events}
        />
      )}
    </div>
  );
}
