export type DateRangeParams = { range?: string; start?: string; end?: string };

export function resolveDateRange({ range, start, end }: DateRangeParams) {
  const endDate = end ? new Date(end) : new Date();
  let startDate: Date;

  if (range === "custom" && start) {
    startDate = new Date(start);
  } else {
    const days = range === "30" ? 30 : 7;
    startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));
  }

  return { start: startDate, end: endDate };
}

export function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
