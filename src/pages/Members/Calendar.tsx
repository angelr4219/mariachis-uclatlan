



// =====================================================================
// 9) PAGE — src/pages/Members/Calendar.tsx (final, fixed paths)
// =====================================================================
import React from 'react';
import { useEvents } from '../hooks/useEvents';
import CalendarApp from '../../components/Calendar/CalendarApp';
import type { EventItem } from '../../types/events';


const MembersCalendarPage: React.FC = () => {
const { events, loading, error } = useEvents();
const [active, setActive] = React.useState<EventItem | null>(null);


return (
<section className="ucla-content" style={{ maxWidth: 1100, margin: '0 auto' }}>
<h1 className="ucla-heading-xl">Calendar</h1>
<p className="ucla-paragraph">All events appear here automatically as they are added.</p>


{loading && <p>Loading events…</p>}
{error && <p style={{ color: 'salmon' }}>{error}</p>}


<CalendarApp events={events} onEventClick={setActive} />


{active && (
<div className="modal-backdrop" onClick={() => setActive(null)}>
<div className="modal" onClick={(e) => e.stopPropagation()}>
<h3 style={{ marginTop: 0 }}>{active.title}</h3>
<p>
{active.start.toLocaleString()} {active.end ? `— ${active.end.toLocaleString()}` : ''}
</p>
{active.location && <p><strong>Location:</strong> {active.location}</p>}
{active.description && <p>{active.description}</p>}
<div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
<a className="btn" href={`/members/performer-availability?event=${active.id}`}>Respond Availability</a>
<button className="btn secondary" onClick={() => setActive(null)}>Close</button>
</div>
</div>
</div>
)}


<style>{`
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: grid; place-items: center; }
.modal { background: #fff; padding: 1rem; border-radius: 10px; max-width: 520px; width: calc(100% - 2rem); }
.btn { padding: 0.5rem 0.85rem; border-radius: 8px; border: 1px solid #2774AE; background: #2774AE; color: #fff; text-decoration: none; }
.btn.secondary { background: transparent; color: #2774AE; }
`}</style>
</section>
);
};


export default MembersCalendarPage;