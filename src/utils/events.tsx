



// =================================
// 2) UTILS — src/utils/events.ts
// =================================
import type { EventDoc, EventItem } from '../types/events';


export function normalizeEvent(doc: EventDoc): EventItem {
const toDate = (t?: any): Date | undefined => (t && typeof t.toDate === 'function' ? t.toDate() : t ? new Date(t) : undefined);
return {
id: doc.id,
title: doc.title,
start: toDate(doc.start)!,
end: toDate(doc.end),
location: doc.location,
description: doc.description,
status: doc.status,
};
}


export function formatDateRange(ev: Pick<EventItem, 'start' | 'end'>) {
const date = ev.start.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
const startTime = ev.start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const endTime = ev.end ? ev.end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';
const time = ev.end ? `${startTime} – ${endTime}` : startTime;
return { date, time };
}



