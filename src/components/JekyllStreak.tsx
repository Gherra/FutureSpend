import { Flame, TrendingDown } from 'lucide-react';

interface JekyllStreakProps {
  streak: number;
  compact?: boolean;
}

export default function JekyllStreak({ streak, compact = false }: JekyllStreakProps) {
  const isActive = streak > 0;
  const isHot = streak >= 5;

  const activeColor = isHot ? '#EA580C' : '#006AC3';
  const activeBg   = isHot ? '#FFF4ED' : '#E8F2FB';

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Flame
          size={13}
          style={{ color: isActive ? activeColor : '#CBD5E1' }}
        />
        <span className="text-xs font-bold" style={{ color: isActive ? activeColor : '#8FA3B8' }}>
          {streak}d
        </span>
      </div>
    );
  }

  return (
    <div className="nomi-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingDown size={14} style={{ color: '#006AC3' }} />
          <span className="text-sm font-bold" style={{ color: '#0F1923' }}>
            Budget Streak
          </span>
        </div>
        {isActive && (
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: activeBg, color: activeColor }}>
            <Flame size={11} />
            On track
          </div>
        )}
      </div>

      {/* Big number */}
      <div className="flex items-end gap-2.5 mb-3">
        <div className="text-5xl font-black leading-none" style={{ color: isActive ? activeColor : '#CBD5E1' }}>
          {streak}
        </div>
        <div className="mb-1">
          <div className="text-sm font-bold" style={{ color: isActive ? '#0F1923' : '#CBD5E1' }}>
            {streak === 1 ? 'day' : 'days'}
          </div>
          <div className="text-xs" style={{ color: '#8FA3B8' }}>under weekly budget</div>
        </div>
      </div>

      {/* 7-day progress bar */}
      <div className="flex gap-1 mb-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full"
            style={{
              background: i < streak ? activeColor : '#E5EDF5',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>
      <div className="text-xs" style={{ color: '#8FA3B8' }}>{streak}/7 days this week</div>

      {streak === 0 && (
        <p className="text-xs mt-2" style={{ color: '#8FA3B8' }}>
          Stay under budget today to start your streak.
        </p>
      )}
      {streak >= 3 && (
        <div
          className="mt-2.5 text-xs rounded-lg px-3 py-2 font-medium"
          style={{ background: activeBg, color: activeColor }}>
          {streak >= 7
            ? '🏆 Perfect week — you\'re a Jekyll!'
            : streak >= 5
            ? '🔥 2 more days for a perfect week!'
            : '✨ Great start — keep the momentum!'}
        </div>
      )}
    </div>
  );
}
