// =============================================
// FILE: src/components/AdminDebug.tsx
// Purpose: A simple debug utility component to display the current user's
//          email and admin status. When the button is clicked, it logs
//          relevant information to the console and optionally displays
//          it on screen. Use this during testing to verify that
//          authentication and role checks are working correctly.
// =============================================

import React from 'react';
import './AdminDebug.css';

interface AdminDebugProps {
  user: any;
  isAdmin: boolean;
  claims: any;
}

const AdminDebug: React.FC<AdminDebugProps> = ({ user, isAdmin, claims }) => {
  const [visible, setVisible] = React.useState(false);
  const handleClick = () => {
    // Log to the console for developer inspection
    console.log('AdminDebug -> user:', user);
    console.log('AdminDebug -> isAdmin:', isAdmin);
    console.log('AdminDebug -> claims:', claims);
    // Toggle visibility of on‑screen debug info
    setVisible((prev) => !prev);
  };
  return (
    <div className="admin-debug">
      <button className="admin-debug-btn" onClick={handleClick}>
        {visible ? 'Hide Debug' : 'Show Debug'}
      </button>
      {visible && (
        <div className="admin-debug-info">
          <p>
            <strong>User email:</strong> {user?.email || 'None'}
          </p>
          <p>
            <strong>isAdmin:</strong> {isAdmin ? 'true' : 'false'}
          </p>
          <p>
            <strong>Claims:</strong> {JSON.stringify(claims) || '{}'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminDebug;