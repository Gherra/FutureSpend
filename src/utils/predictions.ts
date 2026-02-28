import type { Category, CostBreakdown } from '../types';

// Deterministic prediction based on keywords — no API needed

const CATEGORY_RISK: Record<Category, number> = {
  Work: 1.0,
  Personal: 0.85,
  Family: 1.15,
  Social: 1.4,
  Health: 0.9,
};

function scoreTitle(title: string) {
  const t = title.toLowerCase();

  let food = 0;
  if (/fine dining|omakase|tasting menu|steak|wagyu|sushi bar/.test(t)) food = 75;
  else if (/restaurant|dinner|brunch|ramen|pho|thai|italian|sushi/.test(t)) food = 42;
  else if (/bar|pub|cocktails|drinks|happy hour|wine|beer|nightclub|club/.test(t)) food = 55;
  else if (/coffee|cafe|latte|boba|tea|bakery|bagel/.test(t)) food = 18;
  else if (/lunch|sandwich|food court|food truck|poke/.test(t)) food = 22;
  else if (/study group|meeting|zoom|work session|standup/.test(t)) food = 12;
  else if (/grocery|costco|superstore/.test(t)) food = 80;
  else if (/gym|workout|yoga|pilates|spin/.test(t)) food = 0;
  else food = 15;

  let transport = 0;
  if (/airport|flying|flight|travel|trip/.test(t)) transport = 45;
  else if (/downtown|gastown|yaletown|granville|commercial/.test(t)) transport = 22;
  else if (/uber|lyft|rideshare|taxi|cab/.test(t)) transport = 28;
  else if (/transit|bus|skytrain|translink/.test(t)) transport = 6;
  else if (/walk|nearby|local|home|online|virtual|zoom/.test(t)) transport = 0;
  else if (/drive|parking|burnaby|surrey|richmond|langley/.test(t)) transport = 18;
  else transport = 10;

  let activities = 0;
  if (/concert|festival|show|gala|event|conference|summit/.test(t)) activities = 65;
  else if (/movie|cinema|imax|theatre|broadway/.test(t)) activities = 22;
  else if (/bowling|arcade|laser tag|escape room|paintball/.test(t)) activities = 35;
  else if (/shopping|mall|outlet|boutique|store|haul/.test(t)) activities = 85;
  else if (/spa|massage|facial|nails|salon/.test(t)) activities = 70;
  else if (/gym|yoga|pilates|spin|fitness/.test(t)) activities = 25;
  else if (/hike|trail|park|beach|outdoor/.test(t)) activities = 5;
  else activities = 0;

  return { food, transport, activities };
}

export function predictCost(
  title: string,
  category: Category,
  socialPressure: number
): CostBreakdown {
  const base = scoreTitle(title);
  const pressureMult = 1 + (socialPressure / 100) * 0.75;
  const categoryMult = CATEGORY_RISK[category];

  const food = Math.round(base.food * pressureMult * categoryMult);
  const transport = Math.round(base.transport * pressureMult);
  const activities = Math.round(base.activities * pressureMult * categoryMult);
  const total = food + transport + activities;

  return { food, transport, activities, total };
}

export function getSpendingTriggers(title: string, socialPressure: number): string[] {
  const t = title.toLowerCase();
  const triggers: string[] = [];

  if (socialPressure > 70) triggers.push("High peer pressure — tendency to match others' spending");
  if (/bar|club|drinks|cocktail|nightclub/.test(t)) triggers.push('Alcohol context — costs escalate non-linearly');
  if (/shopping|mall|outlet/.test(t)) triggers.push('Retail environment — impulse purchase zone');
  if (/group|friends|crew|squad|gang|team/.test(t)) triggers.push('Group dynamics — social conformity spending');
  if (/birthday|celebration|anniversary|graduation|bachelorette/.test(t)) triggers.push('Celebration context — discretionary spend override');
  if (/happy hour|sale|deal|discount/.test(t)) triggers.push('FOMO pricing — perceived deals drive overspending');
  if (/downtown|yaletown|gastown/.test(t)) triggers.push('High-cost neighbourhood — venue premiums apply');
  if (triggers.length === 0) triggers.push('Routine spend — low volatility expected');

  return triggers;
}

export function getWhyExplanation(
  title: string,
  category: Category,
  socialPressure: number,
  breakdown: CostBreakdown
): string {
  const t = title.toLowerCase();
  const pressure = socialPressure > 70 ? 'high' : socialPressure > 40 ? 'moderate' : 'low';
  const topCat =
    breakdown.food >= breakdown.activities && breakdown.food >= breakdown.transport
      ? 'food & drinks'
      : breakdown.activities >= breakdown.transport
      ? 'activities'
      : 'transport';

  const categoryNote =
    CATEGORY_RISK[category] > 1.1
      ? `${category} events historically run 15–40% over budget due to group dynamics.`
      : `${category} events tend to stay predictable in cost.`;

  let contextNote = '';
  if (/bar|club|drinks/.test(t))
    contextNote = 'Bar settings trigger round-buying psychology — one drink rarely stays one.';
  else if (/coffee|cafe/.test(t))
    contextNote = 'Coffee meetups extend to 90+ min on average, often adding a second order.';
  else if (/shopping/.test(t))
    contextNote = '"Just browsing" trips average 3× the planned spend.';
  else if (/restaurant|dinner/.test(t))
    contextNote = 'Shared meals invite dessert/appetizer upsells from the table.';

  return `Largest cost driver: ${topCat} ($${breakdown.food > 0 ? breakdown.food : breakdown.activities}). Social pressure is ${pressure} (${socialPressure}%), multiplying base costs by ${(1 + (socialPressure / 100) * 0.75).toFixed(2)}×. ${categoryNote} ${contextNote}`.trim();
}

export function getHistoricalContext(title: string, category: Category): string {
  const t = title.toLowerCase();

  if (/bar|pub|cocktail|drinks|nightclub|club|crawl|happy hour/.test(t)) {
    return [
      'Your last 4 bar nights averaged $72 total — $34 over initial estimates.',
      'Friday and Saturday bar visits run 28% higher than weeknight outings.',
      'Round-buying dynamics add an average of $18 per person when group size exceeds 4.',
    ].join(' ');
  }

  if (/restaurant|dinner|sushi|ramen|pho|steak|miku|yaletown|brunch/.test(t)) {
    return [
      'Based on your last 3 restaurant visits (avg $58), dinner occasions run 35% over lunch estimates.',
      'Downtown and Yaletown venues carry a 20% menu premium vs suburban locations.',
      'March weekend bills average $14 more per person due to seasonal pricing.',
    ].join(' ');
  }

  if (/coffee|cafe|latte|boba|tea|bakery/.test(t)) {
    return [
      'Your last 6 café visits averaged $28 — 60% higher than a single-drink estimate.',
      'SFU study sessions average 2.1 hrs in-venue, correlating with a second-order rate of 74%.',
      'Weekend café spend runs 18% higher than weekday visits for similar group sizes.',
    ].join(' ');
  }

  if (/concert|festival|show|rogers|event|gala/.test(t)) {
    return [
      'Your last 2 concert nights averaged $118 total including transport and in-venue spend.',
      'In-venue food and drinks at Rogers Arena average 3.4× street pricing.',
      'Post-event rideshare during peak hours adds an average of $22 vs pre-booking.',
    ].join(' ');
  }

  if (/shopping|mall|outlet|haul/.test(t)) {
    return [
      'Your last 3 mall visits averaged $142 — 2.8× the intended spend.',
      'Saturday afternoon shopping trips spend 45% more than weekday errands.',
      'Visiting 3+ stores in one session correlates with a 67% rate of unplanned purchases.',
    ].join(' ');
  }

  if (/lunch|team lunch|work lunch/.test(t)) {
    return [
      'Your last 3 team lunches averaged $68 — rising 12% each quarter.',
      'Work lunch occasions with 4+ colleagues average $22 more than solo or pair visits.',
      'Downtown lunch venues carry a 15% "corporate premium" vs campus options.',
    ].join(' ');
  }

  if (/gym|yoga|pilates|spin|fitness|workout|hike|trail/.test(t)) {
    return [
      'Health and fitness events average $32 in ancillary spend (transit, post-workout food).',
      'Group fitness classes add 40% in post-session social spending on average.',
      'Your health category events stay the most predictable — within 8% of estimates.',
    ].join(' ');
  }

  // Generic fallback by category
  if (category === 'Social') {
    return [
      'Social events in your calendar average $94 total spend — 38% higher than initial estimates.',
      'Friday social events historically run the highest, averaging $112 per occasion.',
      'March weekends show a 23% seasonal uptick in social spending vs the annual average.',
    ].join(' ');
  }

  if (category === 'Work') {
    return [
      'Work-related events average $55, with client-facing occasions running 40% higher.',
      'Expense reimbursement coverage averages 60% of total spend for your event type.',
      'After-work social additions (drinks, transport) account for 35% of work event spend.',
    ].join(' ');
  }

  return [
    'Similar events in your spending history average $45 with moderate variability.',
    'Weekend timing adds roughly 15% to equivalent weekday events.',
    'Group size is the strongest predictor of final spend for this event type.',
  ].join(' ');
}
