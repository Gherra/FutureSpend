export type Category = 'Work' | 'Personal' | 'Family' | 'Social' | 'Health';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string
  time?: string; // "HH:MM" 24-hour, optional
  category: Category;
  socialPressure: number; // 0-100
}

export interface CostBreakdown {
  transport: number;
  food: number;
  activities: number;
  total: number;
}

export interface ScanResult {
  event: string;
  category: Category;
  socialPressure: number;
  breakdown: CostBreakdown;
  whyExplanation: string;
  jekyllAdvice: string;
  hydeComment: string;
  spendingTriggers: string[];
  historicalContext: string;
}

export interface Friend {
  name: string;
  avatar: string;
  weeklySpend: number;
  streak: number;
  status: 'under' | 'over';
}

export interface Challenge {
  id: string;
  title: string;
  cap: number;
  duration: string;
  participants: number;
}

export interface SavingsAction {
  id: string;
  eventTitle: string;
  suggestion: string;
  potentialSaving: number;
  type: 'swap' | 'cap' | 'bundle' | 'pledge' | 'timing';
}
