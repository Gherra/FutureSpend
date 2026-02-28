import HydeOMeter from './HydeOMeter';
import JekyllStreak from './JekyllStreak';

interface Props {
  page: 'dashboard' | 'scanner';
  onNavigate: (page: 'dashboard' | 'scanner') => void;
  totalSpend: number;
  weeklyBudget: number;
  streak: number;
  onResetDemo: () => void;
}

export default function Header({ page, onNavigate, totalSpend, weeklyBudget, streak, onResetDemo }: Props) {
  const isCritical = totalSpend / weeklyBudget >= 0.75;

  return (
    <header
      className="sticky top-0 z-40 px-5 py-0 flex items-stretch"
      style={{
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(20px)',
        borderBottom: `2px solid ${isCritical ? '#DC262630' : '#006AC320'}`,
        boxShadow: '0 1px 12px rgba(0,40,80,0.08)',
      }}>
      {/* RBC red left bar accent */}
      <div className="w-1 flex-shrink-0 mr-4" style={{ background: '#CC0000' }} />

      {/* Logo block */}
      <div className="flex items-center gap-3 py-3 mr-6">
        {/* RBC-style shield mark */}
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 font-black text-white text-sm"
          style={{ background: '#006AC3', letterSpacing: '-1px' }}>
          RBC
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-black leading-tight" style={{ color: '#0F1923' }}>
            Future<span style={{ color: '#006AC3' }}>Spend</span>
          </div>
          <div className="text-xs font-semibold tracking-wider" style={{ color: '#8FA3B8', fontSize: '9px' }}>
            NOMI INSIGHTS · HYDE MODE
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex items-center gap-1 py-3">
        {(['dashboard', 'scanner'] as const).map((p) => (
          <button
            key={p}
            onClick={() => onNavigate(p)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={page === p ? {
              background: '#006AC315',
              color: '#006AC3',
              border: '1px solid #006AC330',
            } : {
              color: '#8FA3B8',
              border: '1px solid transparent',
            }}>
            {p === 'scanner' ? 'Event Scanner' : 'Dashboard'}
          </button>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Demo reset */}
      <div className="flex items-center py-3 mr-3">
        <button
          onClick={onResetDemo}
          className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
          style={{ color: '#8FA3B8', border: '1px solid #DDE5EE', background: 'transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#F0F4F8'; e.currentTarget.style.color = '#5A6880'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8FA3B8'; }}
          title="Restore all 10 demo events">
          Reset demo
        </button>
      </div>

      {/* Compact indicators */}
      <div className="flex items-center gap-5 py-3 pr-2">
        <div className="hidden sm:flex flex-col items-end gap-0.5">
          <span className="text-xs font-medium" style={{ color: '#8FA3B8', fontSize: '10px' }}>7-day forecast</span>
          <HydeOMeter totalSpend={totalSpend} weeklyBudget={weeklyBudget} compact />
        </div>
        <div className="h-7 w-px" style={{ background: '#DDE5EE' }} />
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs font-medium" style={{ color: '#8FA3B8', fontSize: '10px' }}>Streak</span>
          <JekyllStreak streak={streak} compact />
        </div>
      </div>
    </header>
  );
}
