import { useState, useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Header from './components/Header';
import HydeOMeter from './components/HydeOMeter';
import JekyllStreak from './components/JekyllStreak';
import EventBoard from './components/EventBoard';
import NomiInsights from './components/NomiInsights';
import CashFlowForecast from './components/CashFlowForecast';
import SavingsStrategies from './components/SavingsStrategies';
import Leaderboard from './components/Leaderboard';
import Achievements from './components/Achievements';
import Scanner from './components/Scanner';
import { useLocalStorage } from './hooks/useLocalStorage';
import { SEED_EVENTS, MOCK_FRIENDS, WEEKLY_BUDGET_DEFAULT } from './data/mockData';
import { predictCost } from './utils/predictions';
import type { CalendarEvent } from './types';

function initEvents(): CalendarEvent[] {
  try {
    const stored = localStorage.getItem('futurespend-events');
    if (stored) {
      const parsed = JSON.parse(stored) as CalendarEvent[];
      if (parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return SEED_EVENTS;
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  // Auto-dismiss after 4 s
  useState(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t); });

  return (
    <div
      className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl px-4 py-3.5 flex items-start gap-3 slide-up"
      style={{
        background: 'white',
        border: '1px solid #DDE5EE',
        boxShadow: '0 8px 30px rgba(0,40,80,0.14)',
        borderLeft: '4px solid #059669',
      }}>
      <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0, marginTop: 1 }} />
      <p className="text-sm leading-snug" style={{ color: '#0F1923' }}>{message}</p>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<'dashboard' | 'scanner'>('dashboard');
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>('futurespend-events', initEvents());
  const [streak, setStreak] = useLocalStorage<number>('futurespend-streak', 4);
  const [weeklyBudget, setWeeklyBudget] = useLocalStorage<number>('futurespend-budget', WEEKLY_BUDGET_DEFAULT);
  const [damageControlActed, setDamageControlActed] = useLocalStorage<number>('futurespend-damage-acted', 0);
  const [nomiActioned, setNomiActioned] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  // resetKey forces NomiInsights / SavingsStrategies / Leaderboard / EventBoard to remount on full reset
  const [resetKey, setResetKey] = useState(0);

  const totalSpend = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + 7);
    return events
      .filter((e) => {
        const d = new Date(e.date + 'T00:00:00');
        return d >= now && d <= cutoff;
      })
      .reduce((sum, e) => sum + predictCost(e.title, e.category, e.socialPressure).total, 0);
  }, [events]);

  const isCritical = totalSpend / weeklyBudget >= 0.75;

  const handleAddEvent    = (e: CalendarEvent) => setEvents((prev) => [...prev, e]);
  const handleEditEvent   = (u: CalendarEvent) => setEvents((prev) => prev.map((e) => (e.id === u.id ? u : e)));
  const handleDeleteEvent = (id: string)       => setEvents((prev) => prev.filter((e) => e.id !== id));

  const handleResetDemo = () => {
    setEvents(SEED_EVENTS);
    setWeeklyBudget(WEEKLY_BUDGET_DEFAULT);
    setStreak(4);
    setDamageControlActed(0);
    setNomiActioned(new Set());
    setResetKey((k) => k + 1);
    showToast('Demo events restored — ready to present!');
  };

  const handleDamageControlAct = () => setDamageControlActed((prev) => prev + 1);

  const showToast = (msg: string) => setToast(msg);

  // Shared HydeOMeter panel used in both layouts
  const hydeOMeter = (
    <HydeOMeter
      totalSpend={totalSpend}
      weeklyBudget={weeklyBudget}
      events={events}
      onDeleteEvent={handleDeleteEvent}
      onShowToast={showToast}
      onUpdateBudget={setWeeklyBudget}
      onDamageControlAct={handleDamageControlAct}
    />
  );

  return (
    <div
      className={`min-h-screen flex flex-col ${isCritical ? 'critical-mode' : ''}`}
      style={{ background: 'var(--bg-page)' }}>
      <Header
        page={page}
        onNavigate={setPage}
        totalSpend={totalSpend}
        weeklyBudget={weeklyBudget}
        streak={streak}
        onResetDemo={handleResetDemo}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
        {page === 'dashboard' ? (
          <>
            {/* Row 1: NOMI Insights */}
            <NomiInsights
              resetKey={resetKey}
              events={events}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              onShowToast={showToast}
            />

            {/* Row 2: Event Board | Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              <div className="lg:col-span-2 space-y-5">
                <div className="lg:hidden">{hydeOMeter}</div>
                <EventBoard
                  resetKey={resetKey}
                  events={events}
                  onAdd={handleAddEvent}
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                />
              </div>

              <div className="space-y-4">
                <div className="hidden lg:block">{hydeOMeter}</div>
                <JekyllStreak streak={streak} />
                <Achievements
                  streak={streak}
                  damageControlActed={damageControlActed}
                  totalSpend={totalSpend}
                  weeklyBudget={weeklyBudget}
                />
                <CashFlowForecast resetKey={resetKey} events={events} />
                <SavingsStrategies
                  resetKey={resetKey}
                  events={events}
                  actioned={nomiActioned}
                  onNomiAction={(id) => setNomiActioned((prev) => new Set([...prev, id]))}
                />
                <Leaderboard resetKey={resetKey} friends={MOCK_FRIENDS} totalSpend={totalSpend} />
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            <div className="lg:col-span-2">
              <Scanner onAddEvent={handleAddEvent} existingEvents={events} />
            </div>
            <div className="space-y-4">
              {hydeOMeter}
              <JekyllStreak streak={streak} />
              <div
                className="nomi-card px-4 py-3 flex items-center justify-between">
                <span className="text-xs" style={{ color: '#8FA3B8' }}>Demo: adjust streak</span>
                <div className="flex gap-1">
                  {['-', '+'].map((op) => (
                    <button
                      key={op}
                      onClick={() => setStreak((s) => op === '+' ? Math.min(7, s + 1) : Math.max(0, s - 1))}
                      className="w-8 h-8 rounded-lg text-base font-bold transition-colors"
                      style={{ color: '#5A6880', background: '#F0F4F8' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#E5EDF5')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#F0F4F8')}>
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Critical vignette */}
      {isCritical && (
        <div
          className="fixed inset-0 pointer-events-none z-30"
          style={{ boxShadow: 'inset 0 0 100px #DC262610' }}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <footer
        className="text-center py-4 text-xs"
        style={{ borderTop: '1px solid #DDE5EE', color: '#B8CCE0' }}>
        FutureSpend · NOMI Insights · RBC SFU Mountain Madness 2026 &nbsp;·&nbsp;
        <span style={{ color: '#D0E8F8' }}>Predictions are forward-looking estimates, not financial advice.</span>
      </footer>
    </div>
  );
}
