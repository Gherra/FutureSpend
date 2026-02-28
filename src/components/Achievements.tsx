import { Flame, Shield, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  color: string;
  Icon: LucideIcon;
}

interface Props {
  streak: number;
  damageControlActed: number;
  totalSpend: number;
  weeklyBudget: number;
}

export default function Achievements({ streak, damageControlActed, totalSpend, weeklyBudget }: Props) {
  const achievements: Achievement[] = [
    {
      id: 'jekyll-apprentice',
      name: "Jekyll's Apprentice",
      description: 'Maintain a 3-day budget streak',
      unlocked: streak >= 3,
      color: '#006AC3',
      Icon: Flame,
    },
    {
      id: 'damage-controller',
      name: 'Damage Controller',
      description: 'Act on 2 damage control suggestions',
      unlocked: damageControlActed >= 2,
      color: '#DC2626',
      Icon: Shield,
    },
    {
      id: 'budget-whisperer',
      name: 'Budget Whisperer',
      description: 'Stay under budget for a full week',
      unlocked: totalSpend < weeklyBudget && totalSpend > 0,
      color: '#059669',
      Icon: TrendingDown,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="nomi-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold" style={{ color: '#0F1923' }}>Achievements</span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
          {unlockedCount}/3 unlocked
        </span>
      </div>

      <div className="space-y-2">
        {achievements.map((ach) => {
          const { Icon } = ach;
          return (
            <div
              key={ach.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
              style={{
                background: ach.unlocked ? `${ach.color}08` : '#F8FAFC',
                border: `1px solid ${ach.unlocked ? `${ach.color}25` : '#E5EDF5'}`,
              }}>
              {/* Badge icon */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: ach.unlocked ? `${ach.color}15` : '#EEF3F8',
                  border: `2px solid ${ach.unlocked ? `${ach.color}35` : '#DDE5EE'}`,
                  // Subtle shine on unlocked badges
                  boxShadow: ach.unlocked ? `0 0 8px ${ach.color}30` : 'none',
                }}>
                <Icon size={14} style={{ color: ach.unlocked ? ach.color : '#C8D8E8' }} />
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className="text-xs font-semibold leading-tight"
                  style={{ color: ach.unlocked ? '#0F1923' : '#B8CCE0' }}>
                  {ach.name}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#8FA3B8' }}>
                  {ach.description}
                </div>
              </div>

              {ach.unlocked && (
                <div
                  className="text-xs font-bold flex-shrink-0 px-1.5 py-0.5 rounded-full"
                  style={{ background: `${ach.color}12`, color: ach.color }}>
                  Earned
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
