import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { CalendarEvent, Category } from '../types';

const CATEGORIES: Category[] = ['Work', 'Personal', 'Family', 'Social', 'Health'];

interface Props {
  onAdd: (event: CalendarEvent) => void;
  onClose: () => void;
  editEvent?: CalendarEvent | null;
}

export default function AddEventModal({ onAdd, onClose, editEvent }: Props) {
  const [title, setTitle] = useState(editEvent?.title ?? '');
  const [date, setDate] = useState(editEvent?.date ?? new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Category>(editEvent?.category ?? 'Personal');
  const [pressure, setPressure] = useState(editEvent?.socialPressure ?? 40);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ id: editEvent?.id ?? `ev-${Date.now()}`, title: title.trim(), date, category, socialPressure: pressure });
    onClose();
  };

  const pressureLabel = pressure < 30 ? 'Low' : pressure < 60 ? 'Moderate' : pressure < 80 ? 'High' : 'Extreme';
  const pressureColor = pressure < 30 ? '#059669' : pressure < 60 ? '#D97706' : pressure < 80 ? '#EA580C' : '#DC2626';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,25,35,0.6)', backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-6 relative slide-up"
        style={{
          background: '#FFFFFF',
          border: '1px solid #DDE5EE',
          boxShadow: '0 24px 60px rgba(0,40,80,0.18)',
        }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold" style={{ color: '#0F1923' }}>
              {editEvent ? 'Edit Event' : 'Add Event'}
            </h2>
            <p className="text-xs" style={{ color: '#8FA3B8' }}>Predict your spending before it happens</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#8FA3B8' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#0F1923'; e.currentTarget.style.background = '#F0F4F8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#8FA3B8'; e.currentTarget.style.background = 'transparent'; }}>
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5A6880' }}>
              Event Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Study group at coffee shop"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: '#F8FAFC',
                border: '1.5px solid #DDE5EE',
                color: '#0F1923',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#006AC3')}
              onBlur={(e) => (e.target.style.borderColor = '#DDE5EE')}
              required autoFocus
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5A6880' }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: '#F8FAFC',
                border: '1.5px solid #DDE5EE',
                color: '#0F1923',
                colorScheme: 'light',
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#5A6880' }}>Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cat-${cat}`}
                  style={{ opacity: category === cat ? 1 : 0.45, transform: category === cat ? 'scale(1.04)' : 'scale(1)' }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Social Pressure */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold" style={{ color: '#5A6880' }}>Social Pressure</label>
              <span className="text-xs font-bold" style={{ color: pressureColor }}>
                {pressureLabel} ({pressure}%)
              </span>
            </div>
            <input
              type="range" min="0" max="100" value={pressure}
              onChange={(e) => setPressure(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${pressureColor} 0%, ${pressureColor} ${pressure}%, #E5EDF5 ${pressure}%, #E5EDF5 100%)`,
              }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: '#B8CCE0' }}>
              <span>Low</span><span>Moderate</span><span>Extreme</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all"
            style={{ background: '#006AC3' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#004A8B')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#006AC3')}>
            <Plus size={15} />
            {editEvent ? 'Update Event' : 'Add to Calendar'}
          </button>
        </form>
      </div>
    </div>
  );
}
