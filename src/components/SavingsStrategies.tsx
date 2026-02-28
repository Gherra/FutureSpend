import { Lightbulb, ArrowUpDown, Shield, Package, Clock, CheckCircle, X } from 'lucide-react';
import { useState } from 'react';
import type { CalendarEvent, SavingsAction } from '../types';
import { predictCost } from '../utils/predictions';

const TYPE_ICONS = {
  swap:   ArrowUpDown,
  cap:    Shield,
  bundle: Package,
  pledge: CheckCircle,
  timing: Clock,
};

const TYPE_LABELS = {
  swap:   'Swap Venue',
  cap:    'Cap Spend',
  bundle: 'Bundle',
  pledge: 'Pre-Commit',
  timing: 'Time Shift',
};

const TYPE_COLOR = {
  swap:   '#006AC3',
  cap:    '#DC2626',
  bundle: '#7C3AED',
  pledge: '#059669',
  timing: '#D97706',
};

function generateActions(events: CalendarEvent[]): SavingsAction[] {
  const actions: SavingsAction[] = [];

  for (const ev of events) {
    const bd = predictCost(ev.title, ev.category, ev.socialPressure);
    const t = ev.title.toLowerCase();

    if (/bar|club|drinks|nightclub|cocktails/.test(t) && bd.food > 30)
      actions.push({ id: `sav-${ev.id}-1`, eventTitle: ev.title, suggestion: `Pre-game at home before heading out — cuts bar spend by ~40%`, potentialSaving: Math.round(bd.food * 0.4), type: 'swap' });

    if (/restaurant|dinner|brunch|sushi|steak/.test(t) && bd.food > 35)
      actions.push({ id: `sav-${ev.id}-2`, eventTitle: ev.title, suggestion: `Lunch service instead of dinner — same venue, 30% cheaper`, potentialSaving: Math.round(bd.food * 0.3), type: 'timing' });

    if (/coffee|cafe|boba|latte/.test(t))
      actions.push({ id: `sav-${ev.id}-3`, eventTitle: ev.title, suggestion: `Bring your own drink — suggest a free common area instead`, potentialSaving: Math.round(bd.food * 0.75), type: 'swap' });

    if (/shopping|mall|outlet/.test(t) && bd.activities > 50)
      actions.push({ id: `sav-${ev.id}-4`, eventTitle: ev.title, suggestion: `Set a firm $${Math.round(bd.activities * 0.5)} cash-only limit before entering`, potentialSaving: Math.round(bd.activities * 0.5), type: 'cap' });

    if (bd.transport > 20)
      actions.push({ id: `sav-${ev.id}-5`, eventTitle: ev.title, suggestion: `Carpool or transit — saves up to $${bd.transport - 8} on transport`, potentialSaving: bd.transport - 8, type: 'bundle' });

    if (ev.socialPressure > 70)
      actions.push({ id: `sav-${ev.id}-6`, eventTitle: ev.title, suggestion: `Share your $${Math.round(bd.total * 0.65)} cap with a friend before the event`, potentialSaving: Math.round(bd.total * 0.35), type: 'pledge' });
  }

  const seen = new Set<string>();
  return actions
    .filter((a) => { const k = `${a.eventTitle}-${a.type}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => b.potentialSaving - a.potentialSaving)
    .slice(0, 5);
}

interface Props { events: CalendarEvent[]; }

export default function SavingsStrategies({ events }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + 7);

  const upcoming = events.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    return d >= now && d <= cutoff;
  });

  const actions = generateActions(upcoming).filter((a) => !dismissed.has(a.id));
  const totalSavings = actions.reduce((sum, a) => sum + a.potentialSaving, 0);

  return (
    <div className="nomi-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb size={14} style={{ color: '#006AC3' }} />
          <span className="text-sm font-bold" style={{ color: '#0F1923' }}>Savings Strategies</span>
        </div>
        {totalSavings > 0 && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: '#E6F9F0', color: '#059669', border: '1px solid #A7E8CB' }}>
            Save up to ${totalSavings}
          </span>
        )}
      </div>

      {actions.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-xs" style={{ color: '#8FA3B8' }}>
            {events.length === 0
              ? 'Add events above to get personalized savings strategies.'
              : 'No high-spend events in the next 7 days to strategize around.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((action, i) => {
            const Icon = TYPE_ICONS[action.type];
            const color = TYPE_COLOR[action.type];
            return (
              <div
                key={action.id}
                className="rounded-xl p-3 group relative slide-up flex items-start gap-2.5"
                style={{ animationDelay: `${i * 0.05}s`, background: '#F8FAFC', border: '1px solid #E5EDF5' }}>
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${color}15` }}>
                  <Icon size={12} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate mb-0.5" style={{ color: '#8FA3B8' }}>{action.eventTitle}</div>
                  <p className="text-xs leading-relaxed" style={{ color: '#0F1923' }}>{action.suggestion}</p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <span className="text-xs font-bold font-mono" style={{ color: '#059669' }}>
                    −${action.potentialSaving}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: `${color}12`, color, fontSize: '10px' }}>
                    {TYPE_LABELS[action.type]}
                  </span>
                </div>
                <button
                  onClick={() => setDismissed(new Set([...dismissed, action.id]))}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100">
                  <X size={11} style={{ color: '#8FA3B8' }} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
