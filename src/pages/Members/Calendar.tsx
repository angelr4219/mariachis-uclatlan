// =============================================
// FILE: src/pages/Members/Calendar.tsx (UPDATED)
// Uses CalendarApp with live availability + attendee drawer
// =============================================
import React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import { isAdminEmail } from '../../config/roles';
import { subscribeEvents, subscribeCalendarFeedInquiries, mergeCalendarFeeds } from '../../services/calendar';
import type { CalendarItem } from '../../services/calendar';
import type { EventItem } from '../../types/events';
import CalendarApp from '../../components/Calendar/CalendarApp';
import { fetchParticipantsProp as fetchEventParticipants, subscribeParticipantsProp as subscribeParticipants } from '../../services/participants';
import './Calendar.css';

const Calendar: React.FC = () => {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [events, setEvents] = React.useState<CalendarItem[]>([]);
  const [inquiries, setInquiries] = React.useState<CalendarItem[]>([]);
  const [items, setItems] = React.useState<CalendarItem[]>([]);

  React.useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setIsAdmin(isAdminEmail(u?.email ?? undefined));
    });
    return () => unsubAuth();
  }, []);

  React.useEffect(() => {
    const unsubE = subscribeEvents({ statuses: ['published'], onChange: setEvents });
    const unsubI = subscribeCalendarFeedInquiries(setInquiries);
    return () => { unsubE(); unsubI(); };
  }, []);

  React.useEffect(() => {
    setItems(mergeCalendarFeeds(events, inquiries));
  }, [events, inquiries]);

  const asEventItems = React.useMemo(() => items as unknown as EventItem[], [items]);

  return (
    <section className="calendar-page">
      <h1 className="ucla-heading-xl">Calendar</h1>
      <p className="ucla-paragraph">Published events{isAdmin ? ' + client inquiries' : ''}.</p>

      {asEventItems.length === 0 ? (
        <p>No upcoming items yet.</p>
      ) : (
        <CalendarApp
          events={asEventItems}
          view="agenda"
          showViewToggle
          canViewParticipants
          fetchParticipants={fetchEventParticipants}
          subscribeParticipants={subscribeParticipants}
          viewerRole={isAdmin ? 'admin' : 'member'}
          filterByAudience
          showAvailabilityBadges
        />
      )}
    </section>
  );
};

export default Calendar;
