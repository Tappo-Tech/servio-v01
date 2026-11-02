// اختبارات الوحدة والانحدار الخاصة بالوحدة `workdayUtils` وسلوكها المتوقع.
import { createWorkdayHourBuckets, createWorkdayScheduleHourBuckets, getWorkdaySchedule, getWorkdayOffsetMinutes, getWorkdayScheduleBucketIndex, isWithinWorkdayShifts, shiftBusinessDate, summarizeWorkdayShifts } from "./workdayUtils";

describe("workday schedule helpers", () => {
  test("builds ascending hourly buckets from the configured start through the duration", () => {
    const schedule = getWorkdaySchedule({ workday_start: "08:00:00", workday_end: "00:00:00", workday_hours: 16 });
    const buckets = createWorkdayHourBuckets(schedule.startMinutes, schedule.durationMinutes);
    expect(buckets).toHaveLength(16);
    expect(buckets[0].label).toBe("08:00");
    expect(buckets[15].label).toBe("23:00");
  });

  test("supports overnight workdays and maps after-midnight sales to the previous business date", () => {
    const schedule = getWorkdaySchedule({ workday_start: "18:00:00", workday_end: "04:00:00", workday_hours: 10 });
    const afterMidnight = new Date(2026, 9, 6, 2, 15, 0);
    expect(getWorkdayOffsetMinutes(afterMidnight, schedule.startMinutes)).toBe(495);
    expect(shiftBusinessDate(afterMidnight, schedule.startMinutes).getDate()).toBe(5);
  });

  test("uses the original 08:00 to midnight workday when no schedule is configured", () => {
    const schedule = getWorkdaySchedule({});
    const buckets = createWorkdayHourBuckets(schedule.startMinutes, schedule.durationMinutes);
    expect(schedule.startMinutes).toBe(480);
    expect(schedule.durationMinutes).toBe(960);
    expect(buckets).toHaveLength(16);
    expect(buckets[0].label).toBe("08:00");
    expect(buckets.at(-1).label).toBe("23:00");
  });

  test("supports multiple ordered shifts with breaks and reports the full operating span", () => {
    const schedule = getWorkdaySchedule({
      workday_start: "08:00:00",
      workday_end: "01:00:00",
      workday_hours: 14,
      workday_shifts: [
        { start: "08:00", end: "12:00" },
        { start: "13:00", end: "17:00" },
        { start: "19:00", end: "01:00" },
      ],
    });
    const buckets = createWorkdayScheduleHourBuckets(schedule);
    expect(schedule.startMinutes).toBe(480);
    expect(schedule.durationMinutes).toBe(1020);
    expect(schedule.hours).toBe(14);
    expect(schedule.shifts).toHaveLength(3);
    expect(buckets).toHaveLength(14);
    expect(buckets[4].label).toBe("13:00");
    expect(buckets[8].label).toBe("19:00");
    expect(buckets.at(-1).label).toBe("00:00");
    expect(isWithinWorkdayShifts(new Date(2026, 9, 5, 12, 30), schedule)).toBe(false);
    expect(isWithinWorkdayShifts(new Date(2026, 9, 5, 13, 0), schedule)).toBe(true);
    expect(isWithinWorkdayShifts(new Date(2026, 9, 6, 1, 0), schedule)).toBe(false);
    expect(getWorkdayScheduleBucketIndex(new Date(2026, 9, 5, 20, 15), schedule)).toBe(9);
    expect(getWorkdayScheduleBucketIndex(new Date(2026, 9, 5, 18, 0), schedule)).toBe(null);
  });

  test("supports an overnight first shift followed by a shift the next morning", () => {
    const schedule = summarizeWorkdayShifts([
      { start: "18:00", end: "02:00" },
      { start: "08:00", end: "12:00" },
    ]);
    expect(schedule).toMatchObject({ startMinutes: 1080, durationMinutes: 1080, hours: 12 });
    expect(schedule.shifts.map((shift) => shift.startOffsetMinutes)).toEqual([0, 840]);
  });

  test("rejects overlapping, out-of-order, or over-24-hour multi-shift schedules", () => {
    expect(summarizeWorkdayShifts([
      { start: "08:00", end: "14:00" },
      { start: "13:00", end: "18:00" },
    ])).toBeNull();
    expect(summarizeWorkdayShifts([
      { start: "08:00", end: "12:00" },
      { start: "18:00", end: "22:00" },
      { start: "14:00", end: "16:00" },
    ])).toBeNull();
    expect(summarizeWorkdayShifts([
      { start: "08:00", end: "00:00" },
      { start: "00:00", end: "08:01" },
    ])).toBeNull();
  });
});
