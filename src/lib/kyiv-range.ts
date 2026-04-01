import { startOfDay, startOfWeek } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const KYIV = "Europe/Kyiv";

export function kyivStartOfTodayUtc(now = new Date()): Date {
  const z = toZonedTime(now, KYIV);
  return fromZonedTime(startOfDay(z), KYIV);
}

export function kyivStartOfWeekUtc(now = new Date()): Date {
  const z = toZonedTime(now, KYIV);
  return fromZonedTime(startOfWeek(z, { weekStartsOn: 1 }), KYIV);
}
