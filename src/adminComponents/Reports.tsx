
// =============================================
// FILE: src/pages/admin/Reports.tsx
// Purpose: Admin reports template page (responsive skeleton)
// =============================================
import React from 'react';
import './Reports.css';

const Reports: React.FC = () => {
  return (
    <section className="reports stack">
      <header className="stack">
        <h1 className="title">Reports</h1>
        <p className="lede">Overview of participation, inquiries, and revenue performance.</p>
      </header>

      <div className="toolbar">
        <div className="left">
          <label className="field">
            <span>From</span>
            <input type="date" />
          </label>
          <label className="field">
            <span>To</span>
            <input type="date" />
          </label>
          <label className="field">
            <span>Ensemble</span>
            <select>
              <option>All</option>
              <option>Uclatlán</option>
              <option>Los Desafinados</option>
              <option>Romance Nocturno</option>
            </select>
          </label>
        </div>
        <div className="right">
          <button className="btn">Export CSV</button>
          <button className="btn btn-secondary">Refresh</button>
        </div>
      </div>

      <div className="grid cols-3 stack-md">
        <article className="card stat">
          <h3>Participation Summary</h3>
          <p className="muted">Attendance, average performers per event, top contributors.</p>
          <div className="placeholder">Chart/Numbers</div>
        </article>
        <article className="card stat">
          <h3>Inquiry Funnel</h3>
          <p className="muted">Submitted → Accepted → Booked → Completed</p>
          <div className="placeholder">Chart/Numbers</div>
        </article>
        <article className="card stat">
          <h3>Revenue (Est.)</h3>
          <p className="muted">Client charges vs. performer payouts (estimates)</p>
          <div className="placeholder">Chart/Numbers</div>
        </article>
      </div>

      <section className="card stack">
        <h3>Recent Activity</h3>
        <div className="table">
          <div className="row head">
            <div>Date</div>
            <div>Type</div>
            <div>Event / Inquiry</div>
            <div>Status</div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div className="row" key={i}>
              <div>—</div>
              <div>—</div>
              <div>—</div>
              <div><span className="badge">—</span></div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
};

export default Reports;



