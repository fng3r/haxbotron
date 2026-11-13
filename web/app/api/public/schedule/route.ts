import { NextResponse } from 'next/server';

import { getControlPlaneService } from '@/lib/control-plane/service';
import { ScheduleSource, isScheduleDate, linkSchedule, scheduleDate } from '@/lib/live/schedule';

export const dynamic = 'force-dynamic';
let source: ScheduleSource | undefined;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const date = params.get('date') ?? scheduleDate();
  if (!isScheduleDate(date)) {
    return NextResponse.json({ message: 'Use a valid date in YYYY-MM-DD format.' }, { status: 400 });
  }
  const headers = { 'Cache-Control': 'no-store' };
  const baseUrl = process.env.CIS_HAXBALL_URL ?? 'https://cis-haxball.ru';
  if (!baseUrl) {
    return NextResponse.json({ date, timezone: 'Europe/Moscow', configured: false, reservations: [] }, { headers });
  }
  try {
    source ??= new ScheduleSource(baseUrl);
    const schedule = await source.get(date);
    const rooms = await getControlPlaneService()
      .listPublicLiveRooms()
      .catch(() => []);
    return NextResponse.json(linkSchedule(schedule, rooms, params.get('ruid') || undefined), { headers });
  } catch {
    return NextResponse.json({ message: 'Broadcast schedule is temporarily unavailable.' }, { status: 503, headers });
  }
}
