function bucket(hour: number): 'morning' | 'midday' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

const SIMPLE: Record<ReturnType<typeof bucket>, string> = {
  morning: 'Good morning',
  midday: 'Good day',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  night: 'Good night',
};

export function simpleGreeting(date: Date): string {
  return SIMPLE[bucket(date.getHours())];
}

const CREATIVE: Record<ReturnType<typeof bucket>, string[]> = {
  morning: [
    'Rise and shine',
    'Fresh start — you’ve got this',
    'Morning focus mode',
  ],
  midday: [
    'Stay in the flow',
    'Halfway through the day — keep going',
    'You’re doing great',
  ],
  afternoon: [
    'Keep the momentum',
    'Solid afternoon energy',
    'One step at a time',
  ],
  evening: [
    'Wind down when you need to',
    'Evening calm',
    'Almost there',
  ],
  night: [
    'Rest is productive too',
    'Night owl mode',
    'Easy does it',
  ],
};

export function creativeGreeting(date: Date): string {
  const b = bucket(date.getHours());
  const list = CREATIVE[b];
  const idx = date.getHours() % list.length;
  return list[idx] ?? SIMPLE[b];
}
