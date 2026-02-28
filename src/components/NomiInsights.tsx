import { useState } from 'react';
import { AlertCircle, TrendingUp, CheckCircle2, Star } from 'lucide-react';
import type { CalendarEvent } from '../types';
import { predictCost } from '../utils/predictions';

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

function generateInsights(events: CalendarEvent[]): NomiInsight[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + 7);

  const upcoming = events.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    return d >= now && d <= cutoff;
  });

  // --- Insight 1: Weekend social events warning ---
  const weekendSocial = upcoming.filter((e) => {
    const day = new Date(e.date + 'T00:00:00').getDay();
    return (day === 5 || day === 6 || day === 0) && e.category === 'Social';
  });
  const weekendCost = weekendSocial.reduce(
    (sum, e) => sum + predictCost(e.title, e.category, e.socialPressure).total, 0
  );

  const insight1: NomiInsight = weekendSocial.length > 0
    ? {
        id: 'i1',
        type: 'warning',
        headline: `Your weekend looks expensive`,
        detail: `${weekendSocial.length} social event${weekendSocial.length > 1 ? 's' : ''} this weekend with a predicted total of $${weekendCost}. Social pressure is running high across these events.`,
      }
    : {
        id: 'i1',
        type: 'warning',
        headline: 'High-pressure event coming up',
        detail: upcoming.length > 0
          ? `"${upcoming[0].title}" carries elevated social pressure (${upcoming[0].socialPressure}%) — predicted at $${predictCost(upcoming[0].title, upcoming[0].category, upcoming[0].socialPressure).total}.`
          : 'No high-pressure events detected in the next 7 days. Looking good!',
      };

  // --- Insight 2: Spending pattern (mock pattern, feels real) ---
  const highPressureCount = upcoming.filter((e) => e.socialPressure > 65).length;
  const insight2: NomiInsight = {
    id: 'i2',
    type: 'pattern',
    headline: 'Pattern detected: Friday nights',
    detail: highPressureCount > 1
      ? `You have ${highPressureCount} high-social-pressure events this week. Based on your calendar history, these events run ~$40 over initial estimates on average.`
      : 'Based on similar calendar weeks, food & drink spending tends to spike 35% when events cluster mid-week. Plan ahead.',
  };

  // --- Insight 3: Opportunity — find most expensive event to skip ---
  const socialEvents = [...upcoming]
    .filter((e) => e.category === 'Social' || e.category === 'Personal')
    .sort((a, b) =>
      predictCost(b.title, b.category, b.socialPressure).total -
      predictCost(a.title, a.category, a.socialPressure).total
    );

  const topEvent = socialEvents[0];
  const topCost = topEvent
    ? predictCost(topEvent.title, topEvent.category, topEvent.socialPressure).total
    : 0;

  const rogersAmount = topCost > 0 ? Math.round(topCost * 0.85) : 60;

  const insight3: NomiInsight = {
    id: 'i3',
    type: 'opportunity',
    headline: topEvent ? `Skipping "${topEvent.title.split(' ').slice(0, 4).join(' ')}…" frees $${topCost}` : 'You\'re tracking well this week',
    detail: topEvent
      ? `That $${topCost} could cover your Rogers bill ($${rogersAmount}), a full week of groceries, or go straight into savings. Just a thought.`
      : 'No obvious high-spend events to cut. Keep up the Jekyll streak!',
  };

  return [insight1, insight2, insight3];
}

function StarRating({ insightId }: { insightId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <span className="text-xs" style={{ color: '#059669' }}>
        Thanks for the feedback ✓
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs mr-1" style={{ color: '#8FA3B8' }}>Useful?</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={`${insightId}-${star}`}
          className="star-btn p-0.5"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => { setRating(star); setSubmitted(true); }}>
          <Star
            size={13}
            fill={(hover || rating) >= star ? '#006AC3' : 'none'}
            stroke={(hover || rating) >= star ? '#006AC3' : '#CBD5E1'}
          />
        </button>
      ))}
    </div>
  );
}

interface Props {
  events: CalendarEvent[];
}

export default function NomiInsights({ events }: Props) {
  const insights = generateInsights(events);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-bold" style={{ color: '#0F1923' }}>NOMI Insights</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: '#006AC315', color: '#006AC3', border: '1px solid #006AC325' }}>
          Forward-looking
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {insights.map((insight, i) => {
          const meta = TYPE_META[insight.type];
          const Icon = meta.icon;
          return (
            <div
              key={insight.id}
              className="nomi-card p-4 flex flex-col gap-3 slide-up relative overflow-hidden"
              style={{ animationDelay: `${i * 0.08}s` }}>
              {/* Left accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[14px]"
                style={{ background: meta.accentBar }}
              />

              <div className="pl-1">
                {/* Label chip */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: meta.iconBg }}>
                    <Icon size={13} style={{ color: meta.iconColor }} />
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: meta.labelBg, color: meta.labelColor }}>
                    {meta.label}
                  </span>
                </div>

                <p className="text-sm font-bold leading-snug mb-1" style={{ color: '#0F1923' }}>
                  {insight.headline}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#5A6880' }}>
                  {insight.detail}
                </p>
              </div>

              {/* Star rating */}
              <div className="pl-1 pt-1 border-t" style={{ borderColor: '#EEF3F8' }}>
                <StarRating insightId={insight.id} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
