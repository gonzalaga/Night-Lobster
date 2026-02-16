export function nextRunAt(hourLocal: number, now = new Date()): Date {
  const next = new Date(now);
  next.setHours(hourLocal, 0, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}
