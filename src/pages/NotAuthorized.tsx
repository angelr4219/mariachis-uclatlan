
// =============================================
// FILE: src/pages/NotAuthorized.tsx
// Fallback page if a user reaches a route without permission
// =============================================
import React from 'react';
import { Link } from 'react-router-dom';

const NotAuthorized: React.FC = () => (
  <div style={{ padding: '2rem', maxWidth: 680, margin: '0 auto' }}>
    <h1 style={{ marginBottom: '0.5rem' }}>Not authorized</h1>
    <p style={{ marginBottom: '1rem' }}>
      You don’t have permission to view this page. If you believe this is a mistake, please contact an admin.
    </p>
    <Link to="/">Go home</Link>
  </div>
);

export default NotAuthorized;


