// دوال مساعدة `workdayUtils` لمنطق التطبيق واختباراته.
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

export function summarizeWorkdayShifts(shifts = []) {
  if (!Array.isArray(shifts) || shifts.length === 0) return null;
  const firstStart = parseClockMinutes(shifts[0]?.start, NaN);
  if (!Number.isFinite(firstStart)) return null;

  let previousEndOffset = 0;
  let totalMinutes = 0;
  const normalizedShifts = [];
  for (let index = 0; index < shifts.length; index += 1) {
    const shift = shifts[index] || {};
    const start = parseClockMinutes(shift.start, NaN);
    const end = parseClockMinutes(shift.end, NaN);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    const difference = (end - start + DAY_MINUTES) % DAY_MINUTES;
    const durationMinutes = difference || DAY_MINUTES;
    const startOffsetMinutes = index === 0 ? 0 : (start - firstStart + DAY_MINUTES) % DAY_MINUTES;
    const endOffsetMinutes = startOffsetMinutes + durationMinutes;
    if ((index > 0 && startOffsetMinutes < previousEndOffset) || endOffsetMinutes > DAY_MINUTES) return null;
    if (durationMinutes === DAY_MINUTES && shifts.length > 1) return null;

    normalizedShifts.push({
      start,
      end,
      startOffsetMinutes,
      endOffsetMinutes,
      durationMinutes,
    });
    previousEndOffset = endOffsetMinutes;
    totalMinutes += durationMinutes;
  }

  const lastShift = normalizedShifts[normalizedShifts.length - 1];
  return {
    startMinutes: firstStart,
    endMinutes: (firstStart + lastShift.endOffsetMinutes) % DAY_MINUTES,
    durationMinutes: lastShift.endOffsetMinutes,
    hours: totalMinutes / 60,
    shifts: normalizedShifts,
  };
}

export function getWorkdaySchedule(storeInfo = {}) {
  const configuredShifts = summarizeWorkdayShifts(storeInfo?.workday_shifts);
  if (configuredShifts) return configuredShifts;

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
    shifts: [{ start: startMinutes, end: (startMinutes + durationMinutes) % DAY_MINUTES, startOffsetMinutes: 0, endOffsetMinutes: durationMinutes, durationMinutes }],
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

export function createWorkdayScheduleHourBuckets(schedule = {}) {
  const shifts = Array.isArray(schedule?.shifts) ? schedule.shifts : [];
  if (!shifts.length) return createWorkdayHourBuckets(schedule?.startMinutes, schedule?.durationMinutes);
  return shifts.flatMap((shift, shiftIndex) => {
    const startOffset = Number(shift?.startOffsetMinutes);
    const endOffset = Number(shift?.endOffsetMinutes);
    const duration = endOffset - startOffset;
    if (!Number.isFinite(duration) || duration <= 0) return [];
    const count = Math.ceil(duration / 60);
    return Array.from({ length: count }, (_, index) => ({
      index: 0,
      shiftIndex,
      offsetMinutes: startOffset + index * 60,
      label: formatClockMinutes(Number(schedule.startMinutes) + startOffset + index * 60),
    }));
  }).map((bucket, index) => ({ ...bucket, index }));
}

export function getWorkdayScheduleBucketIndex(value, schedule = {}) {
  const offset = getWorkdayOffsetMinutes(value, schedule?.startMinutes);
  if (offset == null) return null;
  const shifts = Array.isArray(schedule?.shifts) ? schedule.shifts : [];
  if (!shifts.length) {
    const duration = Math.min(DAY_MINUTES, Math.max(1, Number(schedule?.durationMinutes) || DAY_MINUTES));
    return offset < duration ? Math.floor(offset / 60) : null;
  }

  let bucketOffset = 0;
  for (const shift of shifts) {
    const startOffset = Number(shift?.startOffsetMinutes);
    const endOffset = Number(shift?.endOffsetMinutes);
    const duration = endOffset - startOffset;
    if (!Number.isFinite(duration) || duration <= 0) continue;
    if (offset >= startOffset && offset < endOffset) {
      return bucketOffset + Math.floor((offset - startOffset) / 60);
    }
    bucketOffset += Math.ceil(duration / 60);
  }
  return null;
}

export function isWithinWorkdayShifts(value, schedule = {}) {
  const offset = getWorkdayOffsetMinutes(value, schedule?.startMinutes);
  if (offset == null) return false;
  const shifts = Array.isArray(schedule?.shifts) ? schedule.shifts : [];
  if (shifts.length) {
    return shifts.some((shift) => {
      const startOffset = Number(shift?.startOffsetMinutes);
      const endOffset = Number(shift?.endOffsetMinutes);
      return Number.isFinite(startOffset) && Number.isFinite(endOffset) && offset >= startOffset && offset < endOffset;
    });
  }
  const duration = Math.min(DAY_MINUTES, Math.max(1, Number(schedule?.durationMinutes) || DAY_MINUTES));
  return offset < duration;
}

export function getWorkdayOffsetMinutes(value, startMinutes = 0) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const minuteOfDay = date.getHours() * 60 + date.getMinutes();
  return (minuteOfDay - (Number(startMinutes) || 0) + DAY_MINUTES) % DAY_MINUTES;
}
