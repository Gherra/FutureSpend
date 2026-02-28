import type { CostBreakdown } from '../types';

// Jekyll & Hyde response templates — deterministic, keyword-matched

interface PersonalityLines {
  jekyll: string;
  hyde: string;
}

function pickByHash(arr: string[], seed: number): string {
  return arr[Math.abs(seed) % arr.length];
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

export function generatePersonalities(
  title: string,
  breakdown: CostBreakdown,
  _socialPressure: number
): PersonalityLines {
  const t = title.toLowerCase();
  const seed = hashString(title);
  const total = breakdown.total;

  // — BAR / NIGHTLIFE —
  if (/bar|pub|nightclub|club|cocktails|drinks|happy hour|wine night|beer/.test(t)) {
    return {
      jekyll: pickByHash([
        `Pre-drink at home before heading out — saves $15–25 on the first round. Suggest BYO snacks for the pre-game to also cut food costs.`,
        `Set a firm card limit of $${Math.max(20, Math.round(total * 0.6))} and switch to cash only. Studies show cash spending is 15% lower than card.`,
        `Volunteer to be the designated driver — socially acceptable exit from the spending spiral and saves the Uber too.`,
      ], seed),
      hyde: pickByHash([
        `Sure, "just one drink." That's adorable. See you in 3 hours wondering where $${total + 30} went and crying in a rideshare.`,
        `The bar tab ALWAYS looks manageable on the first round. Then it's rounds, then it's shots, then it's 2am nachos. GODSPEED.`,
        `You've already mentally spent it. Don't fight it. Just… Venmo me $10 to watch the trainwreck.`,
      ], seed),
    };
  }

  // — RESTAURANT / DINING —
  if (/restaurant|dinner|brunch|sushi|ramen|pho|steakhouse|fine dining|omakase/.test(t)) {
    return {
      jekyll: pickByHash([
        `Check the menu online and decide before you arrive — prevents upsell impulse. Skip the apps and dessert and save ~$18.`,
        `Suggest splitting a large entrée or doing set menus — often 20% cheaper per person than ordering individually.`,
        `Lunch service at the same restaurant is usually 30–40% cheaper. See if the group can shift the timing.`,
      ], seed),
      hyde: pickByHash([
        `You KNOW you're going to order the most expensive thing on the menu. Don't even pretend. At least take a photo.`,
        `Oh cool, a group dinner. That means the bill gets split "equally" even though you had water and Karen had three cocktails. Classic.`,
        `Fine dining is just a fancy way of saying "you will leave hungrier and $${total} poorer." Enjoy!`,
      ], seed),
    };
  }

  // — COFFEE / CAFE —
  if (/coffee|cafe|latte|boba|tea shop|bakery|starbucks|tim hortons/.test(t)) {
    return {
      jekyll: pickByHash([
        `Brew at home first — arriving caffeinated means you order less. One drink instead of two saves $6–8.`,
        `Suggest the library or a free common area for the actual study/work — keep the cafe as a treat, not the venue.`,
        `Cap yourself at one order. Bring a refillable water bottle so you're not tempted by a second round.`,
      ], seed),
      hyde: pickByHash([
        `"Just a quick coffee." Two hours and $${breakdown.food + 8} later, you've accomplished nothing but anxiety. Perfect.`,
        `Boba is $8 a cup and you'll get three because "I deserve it." And honestly? You do. But your bank account disagrees.`,
        `Study group at a cafe = paying $${breakdown.food} for the illusion of productivity. Very academic of you.`,
      ], seed),
    };
  }

  // — SHOPPING —
  if (/shopping|mall|outlet|boutique|haul|store|retail|amazon|online shop/.test(t)) {
    return {
      jekyll: pickByHash([
        `Make a strict list before you go and stick to it. Apps like Flipp help you price-check before committing.`,
        `Implement a 24-hour rule: if you want to buy something non-essential, wait a day. 60% of impulse purchases don't survive the wait.`,
        `Leave your credit card at home. Cash-only trips average significantly less than card trips for unplanned purchases.`,
      ], seed),
      hyde: pickByHash([
        `"I'll just look." Nobody has ever JUST LOOKED at a mall. That's not a thing. $${total} minimum, incoming.`,
        `New season, new you, new $${breakdown.activities} you absolutely did not budget for. The mall loves you, bestie.`,
        `You: "I only need one thing." Also you: *returns with 7 things and a loyalty card you'll never use*.`,
      ], seed),
    };
  }

  // — CONCERT / EVENT —
  if (/concert|festival|show|gala|event|game|sports|match|performance/.test(t)) {
    return {
      jekyll: pickByHash([
        `Pre-buy snacks and drinks before entering the venue — in-venue prices run 3–4× market rate.`,
        `Rideshare split is your friend here. 4-person Uber vs solo can cut transport costs by 60%.`,
        `Look for student/group discounts on the event itself — even $5 off per person adds up for the group.`,
      ], seed),
      hyde: pickByHash([
        `Ah yes, the concert merch stand. The one place where a t-shirt costs $65 and you'll absolutely buy it anyway.`,
        `$${breakdown.activities} ticket. $${breakdown.food} "just one beer." $${breakdown.transport} Uber surge at midnight. Totally worth it though (it's not).`,
        `You said you wouldn't buy merch. You're going to buy merch. We all know it. Accept your fate.`,
      ], seed),
    };
  }

  // — GYM / FITNESS —
  if (/gym|yoga|pilates|spin|fitness|workout|crossfit|climbing|rock climbing/.test(t)) {
    return {
      jekyll: pickByHash([
        `Great investment in your health. Consider carpooling to the gym to cut transport costs in half.`,
        `Pack your own post-workout snack — the smoothie bar adds $8–15 per visit. That's $400+/year.`,
        `Check if your employer, student union, or benefits plan covers any membership costs.`,
      ], seed),
      hyde: pickByHash([
        `The gym membership you use inconsistently is the most expensive thing you own. But this time is different, right?`,
        `Post-workout smoothie: $14. Parking: $8. Feeling morally superior for the rest of the day: priceless. (It's not priceless, it's $${total}.)`,
        `You're going to the gym. Cute. See you at the cafe next to it afterwards, spending $${breakdown.food}.`,
      ], seed),
    };
  }

  // — HIGH COST GENERIC —
  if (total > 80) {
    return {
      jekyll: `This event is in the high-spend zone. Cap yourself at $${Math.round(total * 0.65)} and communicate it to the group before arriving — social contracts reduce peer pressure.`,
      hyde: `$${total} on a ${title.split(' ').slice(0, 3).join(' ')}?? Listen, I'm not judging. I'm absolutely judging. That's rent money cosplaying as fun.`,
    };
  }

  // — MEDIUM COST GENERIC —
  if (total > 35) {
    return {
      jekyll: `Moderate spend event. Review the breakdown above and identify the one line item you can reduce — usually food or activities hold the most slack.`,
      hyde: `Only $${total}? Look at you being "responsible." Don't worry, you'll find a way to make it $${total + 25}. You always do.`,
    };
  }

  // — LOW COST / DEFAULT —
  return {
    jekyll: `Low-risk event! If social pressure rises on the day, it's okay to politely decline upgrades or add-ons. Hold your ground.`,
    hyde: `$${total}? That's not even your most expensive mistake this week. Go forth and… try not to impulse buy something random.`,
  };
}
