// src/pages/MembersResources.tsx
import React from 'react';
import '../Members/Resources.css';

const BOX_SHEET_MUSIC_URL = 'https://ucla.app.box.com/folder/248008790297';
const INSTAGRAM_URL = 'https://www.instagram.com/mariachideuclatlan/';
const GROUPME_URL = 'https://groupme.com/'; // TODO: replace with the exact GroupMe join link

const MembersResources: React.FC = () => {
  return (
    <section className="ucla-content resources-shell">
      <header className="resources-header">
        <h1 className="ucla-heading-xl">Resources</h1>
        <p className="lede">Quick links for members: sheet music, Instagram, and GroupMe.</p>
      </header>

      <div className="resources-grid">
        {/* Sheet Music */}
        <article className="card res-card">
          <h2 className="res-title">🎼 Sheet Music Library</h2>
          <p className="res-desc">Access PDF parts for each instrument section via UCLA Box.</p>
          <a
            className="btn btn-primary"
            href={BOX_SHEET_MUSIC_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Sheet Music Library →
          </a>
        </article>

        {/* Instagram */}
        <article className="card res-card">
          <h2 className="res-title">📸 Instagram</h2>
          <p className="res-desc">Follow for announcements, gig photos, and social updates.</p>
          <a
            className="btn insta"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open the official Instagram page"
          >
            Open Instagram →
          </a>
        </article>

        {/* GroupMe */}
        <article className="card res-card">
          <h2 className="res-title">💬 GroupMe</h2>
          <p className="res-desc">
            Join the GroupMe for day-of logistics and last‑minute updates. If this link
            doesn’t work for you, ping the Board for the latest invite.
          </p>
          <a
            className="btn groupme"
            href={GROUPME_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open the GroupMe group"
          >
            Open GroupMe →
          </a>
        </article>
      </div>

      <footer className="resources-foot">
        <p className="muted">
          Tip: we can move these URLs into Firestore (e.g., <code>config/publicLinks</code>) so admins can
          update them without a code change.
        </p>
      </footer>
    </section>
  );
};

export default MembersResources;

