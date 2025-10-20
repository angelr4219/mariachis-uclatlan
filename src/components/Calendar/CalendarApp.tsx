// =============================================
// FILE: src/components/Calendar/CalendarApp.tsx
// Right-side drawer + availability badges + live subscriptions
// =============================================
import React from 'react';
import './CalendarApp.css';
import type { EventItem } from '../../types/events';

// Optional shape for attendees returned by fetch/subscribe
export type ParticipantInfo = {
  uid: string;
  name?: string;
  // Your hooks may use multiple vocabularies; we'll normalize them
  status?:
    | 'going' | 'maybe' | 'declined' | 'unknown'
    | 'yes' | 'no'
    | 'accepted' | 'tentative';
  section?: string; // instrument/section (optional)
};

export interface CalendarAppProps {
  events: EventItem[];                // start/end as JS Date
  month?: number;                     // 0–11
  year?: number;                      // YYYY
  firstDayOfWeek?: 0 | 1;             // 0=Sun (default), 1=Mon
  onEventClick?: (ev: EventItem) => void;
  onMonthChange?: (year: number, month: number) => void;
  renderEvent?: (ev: EventItem) => React.ReactNode;
  maxPillsPerDay?: number;            // default 3
  expandMultiDay?: boolean;           // default true

  // View controls
  view?: 'month' | 'agenda';          // default 'month'
  showViewToggle?: boolean;           // default true

  // Attendee drawer
  canViewParticipants?: boolean;      // if true, drawer shows attendees
  fetchParticipants?: (eventId: string) => Promise<ParticipantInfo[]>;

  // Live availability subscriptions (Firestore onSnapshot wrapper)
  // Return an unsubscribe function.
  subscribeParticipants?: (eventId: string, cb: (list: ParticipantInfo[]) => void) => () => void;

  // Audience filtering
  viewerRole?: 'guest' | 'member' | 'admin'; // default 'guest'
  filterByAudience?: boolean;         // default true

  // Availability badges toggle
  showAvailabilityBadges?: boolean;   // default true
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
    const start = ev.start ? new Date(ev.start.getFullYear(), ev.start.getMonth(), ev.start.getDate()) : new Date();
    const lastDate = ev.end && ev.start && ev.end > ev.start
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

// Audience helpers (optional): if your EventItem has ev.audience = 'public' | 'members' | 'admins'
function canViewerSee(ev: EventItem, role: 'guest'|'member'|'admin') {
  const aud = (ev as any).audience as 'public'|'members'|'admins'|undefined;
  if (!aud) return true; // if not set, default visible
  if (aud === 'public') return true;
  if (aud === 'members') return role === 'member' || role === 'admin';
  if (aud === 'admins') return role === 'admin';
  return true;
}

// ---- Availability summary (normalize multiple vocabularies) ----
type AvSummary = { yes: number; maybe: number; no: number };

// Normalize status into yes/maybe/no
function toYNM(s?: ParticipantInfo['status']): 'yes'|'maybe'|'no'|'unknown' {
  if (!s) return 'unknown';
  const k = String(s).toLowerCase();
  if (k === 'yes' || k === 'going' || k === 'accepted') return 'yes';
  if (k === 'maybe' || k === 'tentative') return 'maybe';
  if (k === 'no' || k === 'declined') return 'no';
  return 'unknown';
}

const summarize = (list: ParticipantInfo[] | null | undefined): AvSummary => {
  const res: AvSummary = { yes: 0, maybe: 0, no: 0 };
  if (!list) return res;
  for (const p of list) {
    const st = toYNM(p.status);
    if (st === 'yes') res.yes++;
    else if (st === 'maybe') res.maybe++;
    else if (st === 'no') res.no++;
  }
  return res;
};

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
  view = 'month',
  showViewToggle = true,
  canViewParticipants = false,
  fetchParticipants,
  subscribeParticipants,
  viewerRole = 'guest',
  filterByAudience = true,
  showAvailabilityBadges = true,
}) => {
  const [cursor, setCursor] = React.useState(() =>
    new Date(year ?? new Date().getFullYear(), month ?? new Date().getMonth(), 1)
  );
  const [activeView, setActiveView] = React.useState<'month' | 'agenda'>(view);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<EventItem | null>(null);
  const [attendees, setAttendees] = React.useState<ParticipantInfo[] | null>(null);
  const [loadingAttendees, setLoadingAttendees] = React.useState(false);

  // Live availability map: eventId -> summary
  const [avMap, setAvMap] = React.useState<Record<string, AvSummary>>({});
  const subsRef = React.useRef<Record<string, () => void>>({});

  // Announce month externally
  React.useEffect(() => {
    onMonthChange?.(cursor.getFullYear(), cursor.getMonth());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.getFullYear(), cursor.getMonth()]);

  // Keep external view prop in sync
  React.useEffect(() => { setActiveView(view); }, [view]);

  // Keyboard: close on Escape
  React.useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const visibleEvents = React.useMemo(() => {
    return (filterByAudience ? events.filter(e => canViewerSee(e, viewerRole)) : events)
      .sort((a, b) => (a.start && b.start ? +a.start - +b.start : 0));
  }, [events, viewerRole, filterByAudience]);

  const cells = React.useMemo(() => buildGrid(cursor, firstDayOfWeek), [cursor, firstDayOfWeek]);
  const eventsByDate = React.useMemo(() => groupEventsByDay(visibleEvents, expandMultiDay), [visibleEvents, expandMultiDay]);
  const weekdayLabels = React.useMemo(() => rotate(WEEKDAYS, firstDayOfWeek), [firstDayOfWeek]);

  // Agenda grouping
  const agendaGroups = React.useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const it of visibleEvents) {
      const key = it.start ? keyOf(it.start) : '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [visibleEvents]);

  // ---------- Live subscriptions to availability ----------
  React.useEffect(() => {
    // cleanup existing
    Object.values(subsRef.current).forEach((unsub) => unsub());
    subsRef.current = {};

    if (!subscribeParticipants) {
      // one-shot fetch to seed counts if fetchParticipants is available
      (async () => {
        const ids = new Set<string>();
        const source = activeView === 'month' ? Array.from(eventsByDate.values()).flat() : visibleEvents;
        for (const ev of source) ids.add(ev.id);
        const updates: Record<string, AvSummary> = {};
        if (fetchParticipants) {
          for (const id of ids) {
            try {
              const list = await fetchParticipants(id);
              updates[id] = summarize(list);
            } catch { /* ignore */ }
          }
          setAvMap((prev) => ({ ...prev, ...updates }));
        }
      })();
      return;
    }

    const addSub = (eventId: string) => {
      if (subsRef.current[eventId]) return; // already subscribed
      const unsub = subscribeParticipants!(eventId, (list) => {
        setAvMap((prev) => ({ ...prev, [eventId]: summarize(list) }));
      });
      subsRef.current[eventId] = unsub;
    };

    const source = activeView === 'month' ? Array.from(eventsByDate.values()).flat() : visibleEvents;
    for (const ev of source) addSub(ev.id);

    return () => {
      Object.values(subsRef.current).forEach((unsub) => unsub());
      subsRef.current = {};
    };
  }, [activeView, eventsByDate, visibleEvents, subscribeParticipants, fetchParticipants]);

  const openEventDrawer = async (ev: EventItem) => {
    onEventClick?.(ev);
    setSelectedEvent(ev);
    setDrawerOpen(true);

    if (canViewParticipants && fetchParticipants) {
      setLoadingAttendees(true);
      try {
        const list = await fetchParticipants(ev.id);
        setAttendees(list);
        setAvMap((prev) => ({ ...prev, [ev.id]: summarize(list) }));
      } finally {
        setLoadingAttendees(false);
      }
    } else {
      setAttendees(null);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedEvent(null);
    setAttendees(null);
  };

  const AvBadges: React.FC<{ id: string }> = ({ id }) => {
    if (!showAvailabilityBadges) return null;
    const s = avMap[id];
    if (!s) return null;
    const total = s.yes + s.maybe + s.no;
    if (total === 0) return null;
    return (
      <div className="av-badges" aria-label={`Availability: ${s.yes} yes, ${s.maybe} maybe, ${s.no} no`}>
        <span className="av-chip yes">Yes {s.yes}</span>
        {s.maybe ? <span className="av-chip maybe">Maybe {s.maybe}</span> : null}
        {s.no ? <span className="av-chip no">No {s.no}</span> : null}
      </div>
    );
  };

  return (
    <div className="cal-wrap" role="group" aria-label="Calendar">
      <div className="cal-header">
        <div className="left-ctrls">
          <button type="button" className="cal-nav" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Previous month">◀</button>
          <div className="cal-title" aria-live="polite">{monthTitle(cursor)}</div>
          <button type="button" className="cal-nav" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Next month">▶</button>
        </div>
        {showViewToggle && (
          <div className="view-toggle" role="tablist" aria-label="Calendar view selector">
            <button
              className={`view-btn ${activeView === 'month' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeView === 'month'}
              onClick={() => setActiveView('month')}
            >Month</button>
            <button
              className={`view-btn ${activeView === 'agenda' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeView === 'agenda'}
              onClick={() => setActiveView('agenda')}
            >Agenda</button>
          </div>
        )}
      </div>

      {activeView === 'month' ? (
        <>
          <div className="cal-grid cal-weekdays" role="row">
            {weekdayLabels.map((w) => (
              <div key={w} className="cal-weekday" role="columnheader" aria-label={w}>{w}</div>
            ))}
          </div>

          <div className="cal-grid cal-cells" role="grid" aria-readonly={true}>
            {cells.map((date, i) => {
              const k = keyOf(date);
              const list = eventsByDate.get(k) || [];
              const isToday = sameDay(date, new Date());
              const inMonth = date.getMonth() === cursor.getMonth();
              return (
                <div key={i} className={`cal-cell ${inMonth ? '' : 'muted'}`} role="gridcell" aria-selected={isToday}>
                  <div className={`cal-date ${isToday ? 'today' : ''}`} aria-label={date.toDateString()}>
                    {date.getDate()}
                  </div>
                  <div className="cal-events">
                    {list.slice(0, maxPillsPerDay).map((ev) => (
                      <div key={ev.id} className="cal-pill-wrap">
                        <button
                          type="button"
                          className={`cal-pill${(ev as any).status ? ` status-${(ev as any).status}` : ''}`}
                          title={`${ev.title}${(ev as any).location ? ' @ ' + (ev as any).location : ''}`}
                          onClick={() => openEventDrawer(ev)}
                        >
                          {renderEvent ? renderEvent(ev) : ev.title}
                        </button>
                        <AvBadges id={ev.id} />
                      </div>
                    ))}
                    {list.length > maxPillsPerDay && (
                      <div className="cal-more">+{list.length - maxPillsPerDay} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="agenda-wrap">
          {agendaGroups.length === 0 && <p className="muted-text">No items.</p>}
          {agendaGroups.map(([dateKey, list]) => (
            <div key={dateKey} className="agenda-day">
              <h3 className="agenda-day-head">{new Date(dateKey).toLocaleDateString()}</h3>
              <ul className="agenda-items">
                {list.map((ev) => (
                  <li key={ev.id} className="agenda-item">
                    <span className="agenda-time">
                      {ev.start ? ev.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      {ev.end ? ` – ${ev.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </span>
                    <div className="agenda-pill-wrap">
                      <button
                        type="button"
                        className={`agenda-pill${(ev as any).status ? ` status-${(ev as any).status}` : ''}`}
                        onClick={() => openEventDrawer(ev)}
                        title={`${ev.title}${(ev as any).location ? ' @ ' + (ev as any).location : ''}`}
                      >
                        <strong>{ev.title}</strong>
                        {(ev as any).location ? <span className="agenda-loc"> • {(ev as any).location}</span> : null}
                      </button>
                      <AvBadges id={ev.id} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Right-side Drawer (Reports-style) */}
      {drawerOpen && selectedEvent && (
        <div className="cal-drawer-container" aria-hidden={!drawerOpen}>
          <div className="cal-drawer-backdrop" onClick={closeDrawer} />

          <div
            className="cal-drawer-panel"
            role="dialog"
            aria-modal={true}
            aria-label="Event details"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-head">
              <div>
                <div className="drawer-title">{selectedEvent.title}</div>
                <div className="drawer-meta">
                  {selectedEvent.start ? selectedEvent.start.toLocaleString() : 'N/A'}
                  {selectedEvent.end ? ` – ${selectedEvent.end.toLocaleTimeString()}` : ''}
                  {(selectedEvent as any).location ? ` • ${(selectedEvent as any).location}` : ''}
                </div>
              </div>
              <button className="drawer-close" onClick={closeDrawer} aria-label="Close">✕</button>
            </div>

            <div className="drawer-body">
              <div className="stack">
                <div className="muted-text">
                  {(selectedEvent as any).description ?? 'No description provided.'}
                </div>

                {/* Availability summary chips (always visible if known) */}
                <div>
                  <AvBadges id={selectedEvent.id} />
                </div>

                {/* Attendees (optional) */}
                {canViewParticipants ? (
                  loadingAttendees ? (
                    <div className="loading">Loading attendees…</div>
                  ) : attendees && attendees.length ? (
                    <AttendeeTabs list={attendees} />
                  ) : (
                    <div className="muted-text">No attendee data.</div>
                  )
                ) : (
                  <div className="muted-text">Attendee visibility disabled.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarApp;

// ---------- Small internal tabbed view for attendees ----------
const AttendeeTabs: React.FC<{ list: ParticipantInfo[] }> = ({ list }) => {
  const [tab, setTab] = React.useState<'going'|'maybe'|'declined'|'all'>('going');

  const buckets = React.useMemo(() => {
    const g = list.filter(p => toYNM(p.status) === 'yes');
    const m = list.filter(p => toYNM(p.status) === 'maybe');
    const d = list.filter(p => toYNM(p.status) === 'no');
    return { g, m, d };
  }, [list]);

  const renderRow = (p: ParticipantInfo) => (
    <tr key={p.uid}>
      <td>{p.name ?? p.uid}</td>
      <td className={`status ${toYNM(p.status)}`}>{toYNM(p.status)}</td>
      <td>{p.section ?? '—'}</td>
    </tr>
  );

  const current =
    tab === 'all' ? list
      : tab === 'going' ? buckets.g
      : tab === 'maybe' ? buckets.m
      : buckets.d;

  return (
    <div className="att-wrap">
      <div className="att-tabs" role="tablist" aria-label="Attendee filters">
        <button className={`att-tab ${tab==='going'?'active':''}`} onClick={() => setTab('going')} role="tab" aria-selected={tab==='going'}>
          Going ({buckets.g.length})
        </button>
        <button className={`att-tab ${tab==='maybe'?'active':''}`} onClick={() => setTab('maybe')} role="tab" aria-selected={tab==='maybe'}>
          Maybe ({buckets.m.length})
        </button>
        <button className={`att-tab ${tab==='declined'?'active':''}`} onClick={() => setTab('declined')} role="tab" aria-selected={tab==='declined'}>
          Declined ({buckets.d.length})
        </button>
        <button className={`att-tab ${tab==='all'?'active':''}`} onClick={() => setTab('all')} role="tab" aria-selected={tab==='all'}>
          All ({list.length})
        </button>
      </div>

      <table className="att-table">
        <thead>
          <tr>
            <th>Performer</th>
            <th>Status</th>
            <th>Section</th>
          </tr>
        </thead>
        <tbody>
          {current.length ? current.map(renderRow) : (
            <tr><td colSpan={3} className="muted-text" style={{textAlign:'center'}}>No one here.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
