import { Pencil, Trash2, DollarSign } from 'lucide-react';
import type { CalendarEvent, CostBreakdown } from '../types';

interface Props {
  event: CalendarEvent;
  breakdown: CostBreakdown;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff <= 6) return `In ${diff} days`;
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function riskColor(total: number) {
  if (total < 25)  return '#059669';
  if (total < 60)  return '#D97706';
  if (total < 100) return '#EA580C';
  return '#DC2626';
}

export default function EventCard({ event, breakdown, onEdit, onDelete }: Props) {
  const dateLabel = formatDate(event.date);
  const isToday = dateLabel === 'Today';
  const rc = riskColor(breakdown.total);

  const pressureColor = event.socialPressure > 70
    ? '#DC2626' : event.socialPressure > 40
    ? '#D97706' : '#059669';

  return (
    <div
      className="rounded-xl p-3.5 group relative transition-all hover:shadow-md"
      style={{
        background: isToday ? '#FAFCFF' : '#FFFFFF',
        border: `1px solid ${isToday ? '#006AC330' : '#DDE5EE'}`,
        boxShadow: isToday ? '0 0 0 2px #006AC312' : 'none',
      }}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight truncate" style={{ color: '#0F1923' }}>
            {event.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-block text-xs px-2 py-0.5 rounded-md border cat-${event.category}`}>
              {event.category}
            </span>
            <span className="text-xs" style={{ color: '#8FA3B8' }}>{dateLabel}</span>
          </div>
        </div>

        {/* Cost badge */}
        <div
          className="flex-shrink-0 flex items-center gap-0.5 px-2.5 py-1 rounded-lg font-mono font-bold text-sm"
          style={{ background: `${rc}10`, color: rc, border: `1px solid ${rc}25` }}>
          <DollarSign size={11} />
          {breakdown.total}
        </div>
      </div>

      {/* Social pressure bar */}
      <div className="mt-2.5">
        <div className="flex justify-between text-xs mb-1" style={{ color: '#8FA3B8' }}>
          <span>Social pressure</span>
          <span className="font-mono font-medium" style={{ color: pressureColor }}>
            {event.socialPressure}%
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: '#EEF3F8' }}>
          <div
            className="h-full rounded-full pressure-fill"
            style={{ width: `${event.socialPressure}%`, background: pressureColor }}
          />
        </div>
      </div>

      {/* Cost breakdown chips — no emoji */}
      {breakdown.total > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 text-xs">
          {breakdown.food > 0 && (
            <span className="px-1.5 py-0.5 rounded-md" style={{ background: '#FFF8E6', color: '#D97706' }}>
              Food ${breakdown.food}
            </span>
          )}
          {breakdown.transport > 0 && (
            <span className="px-1.5 py-0.5 rounded-md" style={{ background: '#E8F2FB', color: '#006AC3' }}>
              Transport ${breakdown.transport}
            </span>
          )}
          {breakdown.activities > 0 && (
            <span className="px-1.5 py-0.5 rounded-md" style={{ background: '#F0EAFF', color: '#7C3AED' }}>
              Activities ${breakdown.activities}
            </span>
          )}
        </div>
      )}

      {/* Hover actions */}
      <div className="absolute top-2.5 right-2.5 hidden group-hover:flex gap-1">
        <button
          onClick={() => onEdit(event)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: '#8FA3B8' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#006AC3'; e.currentTarget.style.background = '#E8F2FB'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#8FA3B8'; e.currentTarget.style.background = 'transparent'; }}>
          <Pencil size={12} />
        </button>
        <button
          onClick={() => onDelete(event.id)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: '#8FA3B8' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = '#FEE2E2'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#8FA3B8'; e.currentTarget.style.background = 'transparent'; }}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
