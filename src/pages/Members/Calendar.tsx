 
  // =============================================
  // FILE: src/pages/Members/Calendar.tsx (updated)
  // Shows published Events for everyone; if user is admin, also shows Inquiries.
  // =============================================
  import React from 'react';
  import { onAuthStateChanged } from 'firebase/auth';
  import { auth } from '../../firebase';
  import { isAdminEmail } from '../../config/roles';
  import { subscribeEvents, subscribeCalendarFeedInquiries, mergeCalendarFeeds } from '../../services/calendar';
  import type { CalendarItem } from '../../services/calendar';
  import './Calendar.css';
  
  const Calendar: React.FC = () => {
    const [userEmail, setUserEmail] = React.useState<string | undefined>(undefined);
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [events, setEvents] = React.useState<CalendarItem[]>([]);
    const [inquiries, setInquiries] = React.useState<CalendarItem[]>([]);
    const [items, setItems] = React.useState<CalendarItem[]>([]);
  
    React.useEffect(() => {
      const unsubAuth = onAuthStateChanged(auth, (u) => {
        const email = u?.email ?? undefined;
        setUserEmail(email);
        setIsAdmin(isAdminEmail(email));
      });
      return () => unsubAuth();
    }, []);
  
    React.useEffect(() => {
      // Always subscribe to published events
      const unsubE = subscribeEvents({ statuses: ['published'], onChange: setEvents });
  
      // Subscribe to public feed of inquiry stubs (readable by everyone per rules)
      const unsubI = subscribeCalendarFeedInquiries(setInquiries);
  
      return () => {
        unsubE();
        unsubI();
      };
    }, [isAdmin]);
  
    React.useEffect(() => {
      setItems(mergeCalendarFeeds(events, inquiries));
    }, [events, inquiries]);
  
    // Group by YYYY-MM-DD for simple agenda view
    const byDate = React.useMemo(() => {
      const map = new Map<string, CalendarItem[]>();
      for (const it of items) {
        const key = it.start.toISOString().slice(0, 10);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(it);
      }
      return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [items]);
  
    return (
      <section className="calendar-page">
        <h1 className="ucla-heading-xl">Calendar</h1>
        <p className="ucla-paragraph">Published events{isAdmin ? ' + client inquiries' : ''}.</p>
  
        {byDate.length === 0 && <p>No upcoming items yet.</p>}
  
        <div className="calendar-agenda">
          {byDate.map(([date, list]) => (
            <div key={date} className="day-group">
              <h3 className="day-head">{new Date(date).toLocaleDateString()}</h3>
              <ul className="day-items">
                {list.map((it) => (
                  <li key={`${it.type}-${it.id}`} className={`item ${it.type}`}>
                    <span className={`dot ${it.type}`}/>
                    <div className="item-main">
                      <div className="title-row">
                        <strong>{it.title}</strong>
                        {it.type === 'inquiry' && <span className="badge warn">Inquiry</span>}
                        {it.type === 'event' && it.status && <span className={`badge ${it.status}`}>{it.status}</span>}
                      </div>
                      <div className="meta">
                        <span>{it.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {it.end ? ` – ${it.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </span>
                        {it.location ? <span> • {it.location}</span> : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    );
  };
  
  export default Calendar;
  
  