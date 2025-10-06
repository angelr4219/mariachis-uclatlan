// FILE: src/pages/MembersOnly.tsx (UPDATED)
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

  const [url, setUrl] = React.useState('');
  const [hover, setHover] = React.useState(false);
  



  return (
    <section className="members-dashboard ucla-content">
      <header className="welcome">
        <h1 className="ucla-heading-xl">Welcome back! 🎶</h1>
        <p className="ucla-paragraph">Your space for events, resources, and all things Mariachi de Uclatlán.</p>
      </header>

      <div className="grid">
        {/* Week 2 Announcement */}
        <article className="card announcement">
          <h2>Hi — welcome back to Week 2!</h2>
          <ul className="nice-list">
            <li><strong>Rehearsal</strong> is at <strong>7:00 PM</strong>.</li>
            <li><strong>Dinner</strong> is at <strong>6:00 PM</strong> (location TBA).</li>
            <li>Keep an eye on <strong>GroupMe</strong> for last‑minute updates & location pin.</li>
            <li>Angel — Should we make an Instagram group chat instead of GroupMe? If you think so, please bug Enrique about it.</li>
          </ul>
        </article>

        {/* NEW: secondary announcement asking members to ping the Board if they want the IG chat */}
        <article className="card announcement">
          <h2>Community Chat Idea — Tell the Board</h2>
          <p>
            If you’d prefer an Instagram group chat (or have another platform you like), let the Board know so we can
            gauge interest. A quick message to Enrique or any Board member is perfect — if enough people want it,
            we’ll set it up and share the invite link here.
          </p>
        </article>

        {/* Funny picture — now uses your saved image with optional upload/URL */}
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
          <li>🧑‍🎓 Welcome new members—check Resources for onboarding!</li>
        </ul>
      </article>
    </section>
  );
};

export default MembersOnly;
