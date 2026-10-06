import { createWorkdayHourBuckets, getWorkdaySchedule, getWorkdayOffsetMinutes, shiftBusinessDate } from "./workdayUtils";

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
});
