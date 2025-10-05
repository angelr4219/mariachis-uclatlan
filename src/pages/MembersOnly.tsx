
// FILE: src/pages/MembersOnly.tsx
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

const MembersOnly: React.FC = () => {
  const { src, update } = useFunnyPicture();
  const [url, setUrl] = React.useState('');
  const [hover, setHover] = React.useState(false);

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
      <article className="card announcement">
          <h2>Hi — welcome back to Week 2!</h2>
          <p>
          This week in Uclatlán, we kick things off with <strong>rehearsal on Monday, Oct 6 at 7:00 PM</strong>.
          </p>
          <p>
          We typically have a <strong>mariachi dinner at 6:00 PM</strong> — <em>location TBA</em>. Keep an eye on the Events page for updates.
          </p>
        </article>

        <article className="card funny-picture">
<figure className="funny-figure">
{/* Hard-coded image — replace the URL below */}
<img
src="https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=1600&auto=format&fit=crop"
alt="Mariachi vibes: a playful moment"
className="funny-image"
/>
<figcaption className="caption">Mood check ✅ — add your own jokes below in the chat 😄</figcaption>
</figure>
</article>
      </div>

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
