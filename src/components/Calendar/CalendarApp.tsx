// ==============================
// FILE: src/components/Calendar/CalendarApp.tsx
// ==============================
import React from 'react';
import './CalendarApp.css';
import type { EventItem } from '../../types/events';

export interface CalendarAppProps {
  events: EventItem[];              // start/end as JS Date
  month?: number;                   // 0–11
  year?: number;                    // YYYY
  firstDayOfWeek?: 0 | 1;           // 0=Sun (default), 1=Mon
  onEventClick?: (ev: EventItem) => void;
  onMonthChange?: (year: number, month: number) => void;
  renderEvent?: (ev: EventItem) => React.ReactNode;
  maxPillsPerDay?: number;          // default 3
  expandMultiDay?: boolean;         // default true
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

function buildGrid(cursor: Date, firstDOW: 0 | 1): Date[] {
  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const delta = (firstOfMonth.getDay() - firstDOW + 7) % 7; // back up to firstDOW
  const start = addDays(firstOfMonth, -delta);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(start, i)); // 6 weeks
  return cells;
}

const monthTitle = (d: Date) => d.toLocaleString(undefined, { month: 'long', year: 'numeric' });

function rotate<T>(arr: T[], by: number) {
  return arr.slice(by).concat(arr.slice(0, by));
}

function keyOf(d: Date) {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function groupEventsByDay(events: EventItem[], expandMultiDay: boolean): Map<string, EventItem[]> {
  const map = new Map<string, EventItem[]>();
  for (const ev of events) {
    const start = new Date(ev.start.getFullYear(), ev.start.getMonth(), ev.start.getDate());
    const lastDate = ev.end && ev.end > ev.start
      ? new Date(ev.end.getFullYear(), ev.end.getMonth(), ev.end.getDate())
      : start;

    if (!expandMultiDay) {
      const k = keyOf(start);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(ev);
      continue;
    }

    let d = start; let guard = 0;
    while (d <= lastDate && guard++ < 60) {
      const k = keyOf(d);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(ev);
      d = addDays(d, 1);
    }
  }
  return map;
}

const CalendarApp: React.FC<CalendarAppProps> = ({
  events,
  month,
  year,
  firstDayOfWeek = 0,
  onEventClick,
  onMonthChange,
  renderEvent,
  maxPillsPerDay = 3,
  expandMultiDay = true,
}) => {
  const [cursor, setCursor] = React.useState(() =>
    new Date(year ?? new Date().getFullYear(), month ?? new Date().getMonth(), 1)
  );

  React.useEffect(() => {
    onMonthChange?.(cursor.getFullYear(), cursor.getMonth());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.getFullYear(), cursor.getMonth()]);

  const cells = React.useMemo(() => buildGrid(cursor, firstDayOfWeek), [cursor, firstDayOfWeek]);
  const eventsByDate = React.useMemo(() => groupEventsByDay(events, expandMultiDay), [events, expandMultiDay]);

  const today = new Date();
  const isCurrentMonth = (d: Date) => d.getMonth() === cursor.getMonth();

  const prevMonth = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const nextMonth = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

  const weekdayLabels = React.useMemo(() => rotate(WEEKDAYS, firstDayOfWeek), [firstDayOfWeek]);

  return (
    <div className="cal-wrap" role="group" aria-label="Calendar">
      <div className="cal-header">
        <button type="button" className="cal-nav" onClick={prevMonth} aria-label="Previous month">◀</button>
        <div className="cal-title" aria-live="polite">{monthTitle(cursor)}</div>
        <button type="button" className="cal-nav" onClick={nextMonth} aria-label="Next month">▶</button>
      </div>

      <div className="cal-grid cal-weekdays" role="row">
        {weekdayLabels.map((w) => (
          <div key={w} className="cal-weekday" role="columnheader" aria-label={w}>{w}</div>
        ))}
      </div>

      <div className="cal-grid cal-cells" role="grid" aria-readonly>
        {cells.map((date, i) => {
          const k = keyOf(date);
          const list = eventsByDate.get(k) || [];
          const isToday = sameDay(date, today);
          return (
            <div
              key={i}
              className={`cal-cell ${isCurrentMonth(date) ? '' : 'muted'}`}
              role="gridcell"
              aria-selected={isToday}
            >
              <div className={`cal-date ${isToday ? 'today' : ''}`} aria-label={date.toDateString()}>
                {date.getDate()}
              </div>
              <div className="cal-events">
                {list.slice(0, maxPillsPerDay).map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    className={`cal-pill${ev.status ? ` status-${ev.status}` : ''}`}
                    title={`${ev.title}${ev.location ? ' @ ' + ev.location : ''}`}
                    onClick={() => onEventClick?.(ev)}
                  >
                    {renderEvent ? renderEvent(ev) : ev.title}
                  </button>
                ))}
                {list.length > maxPillsPerDay && (
                  <div className="cal-more">+{list.length - maxPillsPerDay} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarApp;



