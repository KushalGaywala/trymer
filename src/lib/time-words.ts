const ONES = [
  'twelve',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
];

const TEENS = [
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

function wordsUnderHundred(n: number): string {
  if (n < 10) return ONES[n];
  if (n < 20) return TEENS[n - 10];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
  if (one === 0) return tens[ten] ?? String(n);
  return `${tens[ten]} ${ONES[one]}`;
}

function hourToWord(h12: number): string {
  if (h12 === 12) return 'twelve';
  return ONES[h12] ?? String(h12);
}

/** Spoken-style 12-hour time */
export function timeInWords(date: Date): string {
  const h24 = date.getHours();
  const m = date.getMinutes();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const hw = hourToWord(h12);
  const minPart = m === 0 ? "o'clock" : wordsUnderHundred(m);

  let day: string;
  if (h24 < 5 || h24 >= 22) day = 'at night';
  else if (h24 < 12) day = 'in the morning';
  else if (h24 < 18) day = 'in the afternoon';
  else day = 'in the evening';

  return `${hw} ${minPart} ${day}`.replace(/\s+/g, ' ').trim();
}
