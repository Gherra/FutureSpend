import type { CalendarEvent, Friend, Challenge } from '../types';

// Seed today as Feb 28 2026 — use real Date so events show correctly
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export const SEED_EVENTS: CalendarEvent[] = [
  {
    id: 'ev-1',
    title: 'Team lunch at Miku Restaurant',
    date: daysFromNow(0),
    category: 'Work',
    socialPressure: 60,
  },
  {
    id: 'ev-2',
    title: 'Saturday night bar crawl downtown',
    date: daysFromNow(1),
    category: 'Social',
    socialPressure: 88,
  },
  {
    id: 'ev-3',
    title: 'Study group at coffee shop (SFU)',
    date: daysFromNow(1),
    category: 'Personal',
    socialPressure: 30,
  },
  {
    id: 'ev-4',
    title: 'Family brunch — mom\'s birthday',
    date: daysFromNow(2),
    category: 'Family',
    socialPressure: 72,
  },
  {
    id: 'ev-5',
    title: 'Yoga class + smoothie after',
    date: daysFromNow(2),
    category: 'Health',
    socialPressure: 20,
  },
  {
    id: 'ev-6',
    title: 'Concert at Rogers Arena with friends',
    date: daysFromNow(3),
    category: 'Social',
    socialPressure: 85,
  },
  {
    id: 'ev-7',
    title: 'Mall shopping haul — spring wardrobe',
    date: daysFromNow(4),
    category: 'Personal',
    socialPressure: 55,
  },
  {
    id: 'ev-8',
    title: 'Client dinner — Yaletown steakhouse',
    date: daysFromNow(4),
    category: 'Work',
    socialPressure: 65,
  },
  {
    id: 'ev-9',
    title: 'Boba & board games night',
    date: daysFromNow(5),
    category: 'Social',
    socialPressure: 50,
  },
  {
    id: 'ev-10',
    title: 'Hike at Cypress Mountain',
    date: daysFromNow(6),
    category: 'Health',
    socialPressure: 25,
  },
];

export const MOCK_FRIENDS: Friend[] = [
  { name: 'Priya M.', avatar: 'PM', weeklySpend: 38, streak: 12, status: 'under' },
  { name: 'Josh K.', avatar: 'JK', weeklySpend: 62, streak: 5, status: 'under' },
  { name: 'Aisha L.', avatar: 'AL', weeklySpend: 147, streak: 0, status: 'over' },
  { name: 'You', avatar: 'ME', weeklySpend: 0, streak: 0, status: 'under' }, // dynamic
  { name: 'Tyler B.', avatar: 'TB', weeklySpend: 211, streak: 0, status: 'over' },
];

export const MOCK_CHALLENGES: Challenge[] = [
  { id: 'ch-1', title: '$20 Weekend Cap', cap: 20, duration: 'this weekend', participants: 4 },
  { id: 'ch-2', title: 'No Delivery Week', cap: 0, duration: 'next 7 days', participants: 7 },
  { id: 'ch-3', title: 'Coffee at Home Challenge', cap: 15, duration: 'next 7 days', participants: 3 },
];

export const WEEKLY_BUDGET_DEFAULT = 120; // CAD
