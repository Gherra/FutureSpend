import { useState, useEffect } from 'react';
import { Plus, CalendarDays, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { CalendarEvent, Category } from '../types';
import { predictCost } from '../utils/predictions';
import EventCard from './EventCard';
import AddEventModal from './AddEventModal';

const CATEGORIES: Category[] = ['Work', 'Personal', 'Family', 'Social', 'Health'];

const SYNC_SOURCES = [
  { name: 'Google Calendar', color: '#EA4335' },
  { name: 'Outlook',         color: '#0078D4' },
  { name: 'iCal',            color: '#888888' },
];

interface Props {
  events: CalendarEvent[];
  onAdd: (event: CalendarEvent) => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  resetKey: number;
}

interface ConflictState {
  newEvent: CalendarEvent;
  existingEvent: CalendarEvent;
}

function EventConflictCard({ event, label, highlighted }: { event: CalendarEvent; label: string; highlighted?: boolean }) {
  const bd = predictCost(event.title, event.category, event.socialPressure);
  const dateStr = new Date(event.date + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-1.5"
      style={{
        background: highlighted ? '#EFF6FF' : '#F8FAFC',
        border: `1.5px solid ${highlighted ? '#006AC3' : '#E5EDF5'}`,
      }}>
      <div className="text-xs font-bold" style={{ color: highlighted ? '#006AC3' : '#8FA3B8' }}>{label}</div>
      <span className={`text-xs px-1.5 py-0.5 rounded-md border cat-${event.category} self-start`}>
        {event.category}
      </span>
      <p className="text-xs font-semibold leading-snug" style={{ color: '#0F1923' }}>{event.title}</p>
      <div className="text-xs" style={{ color: '#8FA3B8' }}>
        {dateStr}{event.time ? ` · ${event.time}` : ''}
      </div>
      <div className="text-lg font-black font-mono mt-1" style={{ color: highlighted ? '#006AC3' : '#5A6880' }}>
        ${bd.total}
        <span className="text-xs font-normal ml-1" style={{ color: '#8FA3B8' }}>predicted</span>
      </div>
    </div>
  );
}

export default function EventBoard({ events, onAdd, onEdit, onDelete, resetKey }: Props) {
  const [activeTab, setActiveTab] = useState<Category | 'All'>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncStep, setSyncStep] = useState(0);
  const [conflictState, setConflictState] = useState<ConflictState | null>(null);

  useEffect(() => {
    setActiveTab('All');
    setShowModal(false);
    setEditingEvent(null);
    setShowSyncModal(false);
    setConflictState(null);
  }, [resetKey]);

  // Advance sync steps: 0=idle → 1 → 2 → 3 → 4=done → auto-close
  useEffect(() => {
    if (!showSyncModal) return;
    setSyncStep(0);
    const timers = [
      setTimeout(() => setSyncStep(1), 600),
      setTimeout(() => setSyncStep(2), 1200),
      setTimeout(() => setSyncStep(3), 1800),
      setTimeout(() => setSyncStep(4), 2400),
      setTimeout(() => { setShowSyncModal(false); setSyncStep(0); }, 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [showSyncModal]);

  const syncProgress = syncStep === 0 ? 2 : syncStep === 1 ? 33 : syncStep === 2 ? 66 : 100;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + 14);

  const upcoming = events
    .filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      return d >= now && d <= cutoff;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const filtered = activeTab === 'All' ? upcoming : upcoming.filter((e) => e.category === activeTab);

  const handleEdit = (event: CalendarEvent) => { setEditingEvent(event); setShowModal(true); };
  const handleModalClose = () => { setShowModal(false); setEditingEvent(null); };

  const handleAdd = (event: CalendarEvent) => {
    if (editingEvent) { onEdit(event); return; }
    // Conflict detection: same date + same time (only if time is specified)
    if (event.time) {
      const conflict = events.find(
        (e) => e.date === event.date && e.time === event.time
      );
      if (conflict) {
        setConflictState({ newEvent: event, existingEvent: conflict });
        return; // don't close modal yet — conflict modal takes over
      }
    }
    onAdd(event);
  };

  const handleConflictSwitch = () => {
    if (!conflictState) return;
    onDelete(conflictState.existingEvent.id);
    onAdd(conflictState.newEvent);
    setConflictState(null);
  };

  const counts = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = upcoming.filter((e) => e.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="nomi-card p-4 flex flex-col" style={{ minHeight: '480px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} style={{ color: '#006AC3' }} />
          <h2 className="text-sm font-bold" style={{ color: '#0F1923' }}>Event Board</h2>
          <span className="text-xs" style={{ color: '#8FA3B8' }}>next 14 days</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSyncModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: '#F0F4F8', border: '1px solid #DDE5EE', color: '#5A6880' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#E5EDF5'; e.currentTarget.style.color = '#006AC3'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F0F4F8'; e.currentTarget.style.color = '#5A6880'; }}>
            <RefreshCw size={11} />
            Sync Calendars
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: '#E8F2FB', border: '1px solid #B8D8F4', color: '#006AC3' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#D0E8F8')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#E8F2FB')}>
            <Plus size={13} />
            Add Event
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('All')}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={activeTab === 'All'
            ? { background: '#006AC3', color: 'white' }
            : { background: '#F0F4F8', color: '#5A6880', border: '1px solid #DDE5EE' }}>
          All ({upcoming.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cat-${cat}`}
            style={{ opacity: activeTab === cat ? 1 : 0.5 }}>
            {cat}{counts[cat] > 0 && ` (${counts[cat]})`}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-2xl mb-3 font-light" style={{ color: '#B8CCE0' }}>—</div>
            <p className="text-sm" style={{ color: '#8FA3B8' }}>No upcoming events in this category</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-xs font-medium transition-colors"
              style={{ color: '#006AC3' }}>
              + Add one
            </button>
          </div>
        ) : (
          filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              breakdown={predictCost(event.title, event.category, event.socialPressure)}
              onEdit={handleEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {showModal && (
        <AddEventModal
          onAdd={handleAdd}
          onClose={handleModalClose}
          editEvent={editingEvent}
          existingEvents={events}
        />
      )}

      {/* ── Time Conflict Modal ── */}
      {conflictState && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,25,35,0.6)', backdropFilter: 'blur(8px)' }}>
          <div
            className="w-full max-w-lg rounded-2xl p-6 slide-up"
            style={{
              background: '#FFFFFF',
              border: '1px solid #DDE5EE',
              boxShadow: '0 24px 60px rgba(0,40,80,0.18)',
            }}>
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: '#FEE2E2' }}>
                  ⚠️
                </div>
                <h2 className="text-base font-bold" style={{ color: '#0F1923' }}>Time Conflict</h2>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#5A6880' }}>
                You already have{' '}
                <span className="font-semibold" style={{ color: '#0F1923' }}>
                  {conflictState.existingEvent.title}
                </span>{' '}
                at this time. You can only attend one — which do you prefer?
              </p>
            </div>

            {/* Two event cards */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <EventConflictCard event={conflictState.existingEvent} label="Current Plan" />
              <EventConflictCard event={conflictState.newEvent} label="New Event" highlighted />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConflictState(null)}
                className="py-2.5 px-3 rounded-xl font-semibold text-xs transition-all"
                style={{ background: '#F0F4F8', color: '#5A6880', border: '1px solid #DDE5EE' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#E5EDF5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#F0F4F8')}>
                Keep Current Event
              </button>
              <button
                onClick={handleConflictSwitch}
                className="py-2.5 px-3 rounded-xl font-semibold text-xs text-white transition-all"
                style={{ background: '#006AC3' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#004A8B')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#006AC3')}>
                Switch to New Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Calendar Sync Modal ── */}
      {showSyncModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowSyncModal(false)}>
          <div
            className="bg-white rounded-2xl p-5 shadow-xl w-full mx-4 slide-up"
            style={{ maxWidth: '300px' }}
            onClick={(e) => e.stopPropagation()}>

            {syncStep < 4 ? (
              <>
                <p className="font-bold text-sm mb-4" style={{ color: '#0F1923' }}>
                  Syncing Calendars
                </p>

                {/* Source rows */}
                <div className="space-y-3 mb-5">
                  {SYNC_SOURCES.map((src, i) => (
                    <div key={src.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: src.color }} />
                        <span className="text-xs font-medium" style={{ color: '#0F1923' }}>{src.name}</span>
                      </div>
                      <div className="flex-shrink-0">
                        {syncStep > i ? (
                          <CheckCircle2 size={15} style={{ color: '#059669' }} />
                        ) : syncStep === i ? (
                          <div
                            className="w-3.5 h-3.5 rounded-full border-2 animate-spin"
                            style={{ borderColor: '#006AC3', borderTopColor: 'transparent' }}
                          />
                        ) : (
                          <div className="w-3 h-3 rounded-full" style={{ background: '#EEF3F8' }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: '#EEF3F8' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${syncProgress}%`,
                      background: '#006AC3',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <p className="text-xs text-center" style={{ color: '#8FA3B8' }}>
                  {syncStep === 0 ? 'Connecting to calendars…' : `Importing from ${SYNC_SOURCES[syncStep - 1]?.name}…`}
                </p>
              </>
            ) : (
              /* Success state */
              <div className="text-center py-3 slide-up">
                <CheckCircle2 size={30} className="mx-auto mb-3" style={{ color: '#059669' }} />
                <p className="font-bold text-sm mb-1" style={{ color: '#0F1923' }}>Calendars Synced</p>
                <p className="text-xs" style={{ color: '#5A6880' }}>
                  Imported 7 events from 3 calendars
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
