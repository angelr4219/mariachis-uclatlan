// FILE: src/pages/MembersOnly.tsx (UPDATED)
import React from 'react';
import './MembersOnly.css';
import { Link } from 'react-router-dom';

const DEFAULT_FUNNY_SVG = `data:image/svg+xml;utf8,
  <svg xmlns='http://www.w3.org/2000/svg' width='600' height='360' viewBox='0 0 600 360'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0%' stop-color='%232774AE'/>
        <stop offset='100%' stop-color='%23FFD100'/>
      </linearGradient>
    </defs>
    <rect width='600' height='360' fill='url(%23g)'/>
    <text x='50%' y='45%' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='40' fill='white'>
      Mariachi Mood 😎🎺
    </text>
    <text x='50%' y='70%' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='20' fill='white'>
      Add your own funny pic below!
    </text>
  </svg>`;

const useFunnyPicture = () => {
  const [src, setSrc] = React.useState<string | null>(() => {
    try { return localStorage.getItem('members:funnyPicture'); } catch { return null; }
  });

  const update = (val: string | null) => {
    setSrc(val);
    try {
      if (val) localStorage.setItem('members:funnyPicture', val);
      else localStorage.removeItem('members:funnyPicture');
    } catch {}
  };

  return { src: src ?? DEFAULT_FUNNY_SVG, update };
};

// Small local-storage backed interest/pledge state
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
  const { src, update } = useFunnyPicture();
  const [url, setUrl] = React.useState('');
  const [hover, setHover] = React.useState(false);
  const { state, setState } = useHalloweenState();

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      update(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  const onSelectFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  const applyUrl = () => {
    if (!url.trim()) return;
    update(url.trim());
    setUrl('');
  };

  const clearPic = () => update(null);

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
            <li>Angel - Should we make an Instagram groupchat over groupme gruopchat, if you think so please bug enrique abuot it.</li>
            <li>Keep an eye on <strong>GroupMe</strong> for last‑minute updates & location pin.</li>
          </ul>

        </article>

        {/* Funny picture — now uses your saved image with optional upload/URL */}
        <article className="card funny-picture">
          <figure className="funny-figure" onDragOver={(e) => { e.preventDefault(); setHover(true); }} onDragLeave={() => setHover(false)} onDrop={onDrop}>
            <img src={src} alt="Member-submitted funny image" className={`funny-image ${hover ? 'hover' : ''}`} />
            <figcaption className="caption">Drop a file here or use the controls below ⤵️</figcaption>
          </figure>
          <div className="funny-controls">
            <label className="btn-outline">
              <input type="file" accept="image/*" onChange={onSelectFile} style={{ display: 'none' }} />
              Upload Image
            </label>
            <div className="url-input">
              <input type="url" placeholder="Paste image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
              <button className="btn" onClick={applyUrl}>Use URL</button>
              <button className="btn ghost" onClick={clearPic}>Clear</button>
            </div>
          </div>
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

      {/* Halloween Social interest + pledge */}
      <article className="card halloween">
        <h2>Halloween Social 🎃 — Interested?</h2>
        <p>We’re thinking about a low‑key Halloween social. Would you come, and would you be willing to pitch in a few dollars for snacks/decor?</p>

        <div className="poll" role="group" aria-label="Halloween social interest">
          {(['yes','maybe','no'] as const).map(opt => (
            <button
              key={opt}
              className={`option-btn ${state.interest === opt ? 'selected' : ''}`}
              onClick={() => setState({ ...state, interest: opt })}
            >{opt === 'yes' ? 'Yes' : opt === 'maybe' ? 'Maybe' : 'No'}</button>
          ))}
        </div>

        <div className="pledge">
          <label htmlFor="pledge" className="pledge-label">If yes/maybe: would you pitch in? <span className="muted">(suggested $5–$10)</span></label>
          <div className="pledge-row">
            <span className="prefix">$</span>
            <input
              id="pledge"
              inputMode="decimal"
              pattern="^[0-9]*[.,]?[0-9]*$"
              className="pledge-input"
              placeholder="0"
              value={state.pledge}
              onChange={(e) => setState({ ...state, pledge: e.target.value.replace(/[^0-9.,]/g,'') })}
            />
            <button className="btn" onClick={() => alert('Saved locally — thanks!')}>Save</button>
          </div>
          <p className="note muted small">Your response is stored locally in your browser for now. We’ll share a formal RSVP if we proceed.</p>
        </div>

        {state.interest && (
          <div className="you-said">
            <strong>Your current response:</strong> {state.interest.toUpperCase()} {state.pledge ? `• Pledge: $${state.pledge}` : ''}
          </div>
        )}
      </article>
    </section>
  );
};

export default MembersOnly;

