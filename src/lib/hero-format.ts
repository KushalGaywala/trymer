export function formatDigitalTime(
  date: Date,
  format: '12h' | '24h',
  showSeconds: boolean
): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  if (format === '24h') {
    const h = date.getHours();
    const m = date.getMinutes();
    const s = date.getSeconds();
    return showSeconds ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}`;
  }
  let h = date.getHours() % 12;
  if (h === 0) h = 12;
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
  const m = date.getMinutes();
  const s = date.getSeconds();
  return showSeconds
    ? `${h}:${pad(m)}:${pad(s)} ${ampm}`
    : `${h}:${pad(m)} ${ampm}`;
}

export function formatDateLine(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${pad(date.getDate())}`;
}

export function interpolateHeroTemplate(
  template: string,
  time: string,
  date: string
): string {
  return template.replace(/\{time\}/g, time).replace(/\{date\}/g, date);
}
