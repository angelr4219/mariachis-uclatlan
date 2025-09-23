// =============================================
// FILE: src/pages/Contact.tsx
// Description: Public Contact page that also showcases member cards.
// - If not logged in, visitors see a login prompt + public cards.
// - If logged in, they see the same grid (we could show more fields later).
// - Cards pull minimal public info from Firestore: name, instrument/section, photoURL.
// =============================================
import React from 'react';
import './Contact.css';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export type PublicMember = {
  id: string;
  name?: string;
  instrument?: string;
  section?: string;
  photoURL?: string;
};

const Contact: React.FC = () => {
  const [user, setUser] = React.useState<any>(null);
  const [members, setMembers] = React.useState<PublicMember[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  React.useEffect(() => {
    const load = async () => {
      try {
        // Pull a reasonable number for a public page; adjust/remove limit as needed
        const q = query(collection(db, 'users'), orderBy('name'), limit(60));
        const snap = await getDocs(q);
        const rows: PublicMember[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setMembers(rows);
      } catch (e) {
        console.error('[Contact] load members failed', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="contact container stack">
      <header className="stack">
        <h1 className="title">Contact Us</h1>
        {!user && (
          <div className="notice card">
            <strong>Members-only pages require login.</strong>
            <p className="muted">If you can't log in right now, you can still reach us and browse our members below.</p>
            <a href="/login" className="btn">Log in</a>
          </div>
        )}
        <p className="lede">
          Email us at <a href="mailto:mariachi@ucla.edu">mariachi@ucla.edu</a> or use this page to get familiar with the ensemble.
        </p>
      </header>

      <section className="card stack">
        <h2>Meet Our Members</h2>
        {loading ? (
          <p className="muted">Loading members…</p>
        ) : (
          <div className="grid cols-3 stack-md members-grid">
            {members.map((m) => (
              <article className="member" key={m.id}>
                <div className="avatar">
                  {m.photoURL ? (
                    <img src={m.photoURL} alt={m.name ? `${m.name} avatar` : 'Member avatar'} />
                  ) : (
                    <div className="fallback" aria-hidden>
                      {initialsOf(m.name)}
                    </div>
                  )}
                </div>
                <div className="info">
                  <h3 className="name">{m.name || 'Member'}</h3>
                  <p className="role">{m.instrument || m.section || 'Performer'}</p>
                </div>
              </article>
            ))}
            {members.length === 0 && (
              <p className="muted" style={{ gridColumn: '1 / -1' }}>No members to show yet.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

function initialsOf(name?: string): string {
  if (!name) return '🎺';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('');
}

export default Contact;


