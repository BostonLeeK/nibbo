import { endOfDay, startOfDay, startOfWeek, subDays } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

const KYIV = "Europe/Kyiv";

export function kyivStartOfTodayUtc(now = new Date()): Date {
  const z = toZonedTime(now, KYIV);
  return fromZonedTime(startOfDay(z), KYIV);
}

export function kyivStartOfWeekUtc(now = new Date()): Date {
  const z = toZonedTime(now, KYIV);
  return fromZonedTime(startOfWeek(z, { weekStartsOn: 1 }), KYIV);
}

export function kyivCalendarYmd(now = new Date()): string {
  return formatInTimeZone(now, KYIV, "yyyy-MM-dd");
}

export function kyivInstantAsCalendarYmd(instant: Date): string {
  return formatInTimeZone(instant, KYIV, "yyyy-MM-dd");
}

export function kyivRangeUtcFromCalendarYmd(startYmd: string, endYmd: string): { start: Date; end: Date } {
  const [ys, ms, ds] = startYmd.split("-").map((x) => parseInt(x, 10));
  const [ye, me, de] = endYmd.split("-").map((x) => parseInt(x, 10));
  const zs = new Date(ys, ms - 1, ds);
  const ze = new Date(ye, me - 1, de);
  return {
    start: fromZonedTime(startOfDay(zs), KYIV),
    end: fromZonedTime(endOfDay(ze), KYIV),
  };
}

export function kyivCalendarYmdMinusDays(endYmd: string, inclusiveSpan: number): string {
  const { start } = kyivRangeUtcFromCalendarYmd(endYmd, endYmd);
  return kyivInstantAsCalendarYmd(subDays(start, inclusiveSpan - 1));
}

export function kyivShiftCalendarDays(ymd: string, deltaDays: number): string {
  const { start } = kyivRangeUtcFromCalendarYmd(ymd, ymd);
  return kyivInstantAsCalendarYmd(subDays(start, deltaDays));
}
