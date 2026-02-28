import { useState } from 'react';
import { Trophy, Swords, Users } from 'lucide-react';
import type { Friend, Challenge } from '../types';
import { MOCK_CHALLENGES } from '../data/mockData';

interface Props {
  friends: Friend[];
  totalSpend: number;
}

export default function Leaderboard({ friends, totalSpend }: Props) {
  const [joinedChallenges, setJoinedChallenges] = useState<Set<string>>(new Set());

  const sorted = friends
    .map((f) => (f.name === 'You' ? { ...f, weeklySpend: totalSpend } : f))
    .sort((a, b) => a.weeklySpend - b.weeklySpend);

  const userRank = sorted.findIndex((f) => f.name === 'You') + 1;

  const handleJoin = (ch: Challenge) => {
    setJoinedChallenges(new Set([...joinedChallenges, ch.id]));
  };

  return (
    <div className="nomi-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy size={14} style={{ color: '#D97706' }} />
          <span className="text-sm font-bold" style={{ color: '#0F1923' }}>Friends Leaderboard</span>
        </div>
        <span className="text-xs font-medium" style={{ color: '#8FA3B8' }}>
          You're #{userRank}
        </span>
      </div>

      {/* Rankings */}
      <div className="space-y-1 mb-4">
        {sorted.map((friend, i) => {
          const isUser = friend.name === 'You';
          const isOver = friend.weeklySpend > 120;
          const rank = i + 1;

          return (
            <div
              key={friend.name}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
              style={{
                background: isUser ? '#E8F2FB' : 'transparent',
                border: isUser ? '1px solid #B8D8F4' : '1px solid transparent',
              }}>
              <div className="w-5 text-center text-sm flex-shrink-0">
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉'
                  : <span className="text-xs font-mono" style={{ color: '#8FA3B8' }}>#{rank}</span>}
              </div>

              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: isUser ? '#006AC3' : isOver ? '#FEE2E2' : '#E6F9F0',
                  color: isUser ? 'white' : isOver ? '#DC2626' : '#059669',
                }}>
                {friend.avatar}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold" style={{ color: isUser ? '#006AC3' : '#0F1923' }}>
                    {friend.name}
                  </span>
                  {friend.streak > 0 && (
                    <span className="text-xs" style={{ color: '#EA580C' }}>🔥{friend.streak}</span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold"
                  style={{ color: isOver ? '#DC2626' : '#059669' }}>
                  ${friend.weeklySpend}
                </span>
                <div className="text-xs" style={{ color: '#8FA3B8' }}>/wk</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="mb-3" style={{ borderTop: '1px solid #EEF3F8' }} />

      {/* Challenges */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Swords size={13} style={{ color: '#006AC3' }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#5A6880' }}>Challenges</span>
        </div>
        <div className="space-y-1.5">
          {MOCK_CHALLENGES.map((ch) => {
            const joined = joinedChallenges.has(ch.id);
            return (
              <div
                key={ch.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: '#F8FAFC', border: '1px solid #E5EDF5' }}>
                <div className="flex items-center gap-2">
                  <Users size={11} style={{ color: '#8FA3B8' }} />
                  <div>
                    <div className="text-xs font-medium" style={{ color: '#0F1923' }}>{ch.title}</div>
                    <div className="text-xs" style={{ color: '#8FA3B8' }}>
                      {ch.participants} joined · {ch.duration}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => !joined && handleJoin(ch)}
                  className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-all flex-shrink-0"
                  style={joined ? {
                    background: '#E6F9F0',
                    color: '#059669',
                    border: '1px solid #A7E8CB',
                    cursor: 'default',
                  } : {
                    background: '#E8F2FB',
                    color: '#006AC3',
                    border: '1px solid #B8D8F4',
                    cursor: 'pointer',
                  }}>
                  {joined ? '✓ Joined' : 'Join'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
