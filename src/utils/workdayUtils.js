const DAY_MINUTES = 24 * 60;

export function parseClockMinutes(value, fallback = 0) {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return fallback;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return fallback;
  return hours * 60 + minutes;
}

export function formatClockMinutes(value) {
  const normalized = ((Math.floor(Number(value) || 0) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

export function getWorkdaySchedule(storeInfo = {}) {
  const hasStart = Boolean(storeInfo?.workday_start);
  const hasSavedSchedule = hasStart || Boolean(storeInfo?.workday_end) || Number(storeInfo?.workday_hours) > 0;
  const defaultStart = hasSavedSchedule ? 0 : 8 * 60;
  const startMinutes = parseClockMinutes(storeInfo?.workday_start, defaultStart);
  let durationMinutes = Number(storeInfo?.workday_hours) * 60;
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > DAY_MINUTES) {
    if (storeInfo?.workday_end) {
      const endMinutes = parseClockMinutes(storeInfo.workday_end, startMinutes);
      durationMinutes = (endMinutes - startMinutes + DAY_MINUTES) % DAY_MINUTES || DAY_MINUTES;
    } else {
      durationMinutes = hasSavedSchedule ? DAY_MINUTES : 16 * 60;
    }
  }
  return {
    startMinutes,
    durationMinutes: Math.min(DAY_MINUTES, Math.max(1, Math.round(durationMinutes))),
    hours: Math.min(24, Math.max(0.25, durationMinutes / 60)),
  };
}

export function shiftBusinessDate(value, startMinutes = 0) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setMinutes(date.getMinutes() - (Number(startMinutes) || 0));
  return date;
}

export function createWorkdayHourBuckets(startMinutes = 0, durationMinutes = DAY_MINUTES) {
  const count = Math.ceil(Math.min(DAY_MINUTES, Math.max(1, Number(durationMinutes) || DAY_MINUTES)) / 60);
  return Array.from({ length: count }, (_, index) => ({
    index,
    offsetMinutes: index * 60,
    label: formatClockMinutes(startMinutes + index * 60),
  }));
}

export function getWorkdayOffsetMinutes(value, startMinutes = 0) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const minuteOfDay = date.getHours() * 60 + date.getMinutes();
  return (minuteOfDay - (Number(startMinutes) || 0) + DAY_MINUTES) % DAY_MINUTES;
}
