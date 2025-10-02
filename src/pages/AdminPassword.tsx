// =============================================
// FILE: src/pages/AdminPassword.tsx
// Description: Public page to set a local admin flag, then redirect to /admin
// =============================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Prefer environment var so you don't hard-code in bundle:
// const ADMIN_SECRET = import.meta.env.VITE_ADMIN_PASSWORD || '';
const ADMIN_SECRET = 'chuy1345';

const AdminPassword: React.FC = () => {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (pw === ADMIN_SECRET) {
      localStorage.setItem('adminAccess', 'true');
      navigate('/admin');
    } else {
      setError('Invalid password. Try again.');
    }
  };

  return (
    <section className="ucla-content">
      <h1 className="ucla-heading-xl">Admin Access</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
        <label htmlFor="admin-password" style={{ display: 'block', marginBottom: '.5rem' }}>
          Enter admin password:
        </label>
        <input
          id="admin-password"
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setError(''); }}
          required
          style={{ padding: '0.5rem', fontSize: '1rem', marginBottom: '.5rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Enter</button>
        {error && <p style={{ color: 'red', marginTop: '.5rem' }}>{error}</p>}
      </form>
    </section>
  );
};

export default AdminPassword;
