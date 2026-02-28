import { useState } from 'react';
import { Plus, CalendarDays } from 'lucide-react';
import type { CalendarEvent, Category } from '../types';
import { predictCost } from '../utils/predictions';
import EventCard from './EventCard';
import AddEventModal from './AddEventModal';

const CATEGORIES: Category[] = ['Work', 'Personal', 'Family', 'Social', 'Health'];


interface Props {
  events: CalendarEvent[];
  onAdd: (event: CalendarEvent) => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}

export default function EventBoard({ events, onAdd, onEdit, onDelete }: Props) {
  const [activeTab, setActiveTab] = useState<Category | 'All'>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

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
  const handleAdd = (event: CalendarEvent) => { editingEvent ? onEdit(event) : onAdd(event); };

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
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: '#E8F2FB',
            border: '1px solid #B8D8F4',
            color: '#006AC3',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#D0E8F8')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#E8F2FB')}>
          <Plus size={13} />
          Add Event
        </button>
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
        <AddEventModal onAdd={handleAdd} onClose={handleModalClose} editEvent={editingEvent} />
      )}
    </div>
  );
}
