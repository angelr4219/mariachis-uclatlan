// FILE: src/pages/MembersOnly.tsx (UPDATED for Week 3)
import React from 'react';
import './MembersOnly.css';
import { Link } from 'react-router-dom';

const STATIC_IMAGE = "/dist/UCLATLAN_Fowler_3.png";
const STATIC_CAPTION = "Picture Brandon made";

// New: simple caption persisted to localStorage
const useFunnyCaption = () => {
  const [caption, setCaption] = React.useState<string>(() => {
    try { return localStorage.getItem('members:funnyCaption') || ''; } catch { return ''; }
  });
  React.useEffect(() => {
    try { localStorage.setItem('members:funnyCaption', caption); } catch {}
  }, [caption]);
  return { caption, setCaption };
};

// Small local-storage backed interest/pledge state (kept for future use if needed)
type HalloweenState = { interest: 'yes'|'maybe'|'no'|null; pledge: string };
const useHalloweenState = () => {
  const [state, setState] = React.useState<HalloweenState>(() => {
    try { return JSON.parse(localStorage.getItem('members:halloweenInterest') || 'null') ?? { interest: null, pledge: '' }; }
    catch { return { interest: null, pledge: '' }; }
  });
  React.useEffect(() => {
    try { localStorage.setItem('members:halloweenInterest', JSON.stringify(state)); } catch {}
  }, [state]);
  return { state, setState };
};

const MembersOnly: React.FC = () => {
  // hooks kept here in case you want to surface the caption/state later
  useFunnyCaption();
  useHalloweenState();

  return (
    <section className="members-dashboard ucla-content">
      <header className="welcome">
        <h1 className="ucla-heading-xl">Welcome back! 🎶</h1>
        <p className="ucla-paragraph">Your space for events, resources, and all things Mariachi de Uclatlán.</p>
      </header>

      <div className="grid">
        {/* Week 3 Announcement */}
        <article className="card announcement">
          <h2>Hi — welcome to Week 3!</h2>
          <ul className="nice-list">
            <li><strong>Rehearsal</strong> is at <strong>7:00 PM</strong>.</li>
            <li><strong>Dinner</strong> is at <strong>6:00 PM</strong> (location TBA).</li>
            <li>
              Watch <strong>GroupMe</strong> and our <strong>Instagram chats</strong> for updates on
              socials, gig calls, and any last‑minute changes.
            </li>
            <li>Questions? Ping Enrique or any Board member.</li>
          </ul>
        </article>

        {/* Reminder about comms channels */}
        <article className="card announcement">
          <h2>Comms Reminder</h2>
          <p>
            We’ll post timely updates in <strong>GroupMe</strong> and the <strong>Instagram chats</strong>.
            Make sure you’re in both so you don’t miss rehearsal notes, social plans, and call times.
          </p>
        </article>

        {/* Funny picture — still static asset */}
        <article className="card funny-picture">
          <figure className="funny-figure">
            <img
              src={STATIC_IMAGE}
              alt="Mariachi de Uclatlán — members spotlight"
              className="funny-image"
              loading="lazy"
              decoding="async"
            />
            <figcaption className="caption">{STATIC_CAPTION}</figcaption>
          </figure>
        </article>
      </div>

      {/* What’s new */}
      <article className="card news">
        <h2>What’s new</h2>
        <ul className="bullets">
          <li>🎺 New: Export your event calendar from <Link to="/members/settings">Settings → Download .ics</Link>.</li>
          <li>📅 Remember to update your availability for upcoming gigs.</li>
          <li>📣 For social updates and quick polls, check GroupMe & Instagram chats.</li>
        </ul>
      </article>
    </section>
  );
};

export default MembersOnly;
