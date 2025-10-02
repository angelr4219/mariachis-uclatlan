import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import './Settings.css';

/**
 * MembersSettings
 *
 * This settings page includes a logout button. When pressed, the user is signed out
 * from Firebase Auth, any local admin flag is cleared, and the user is redirected to
 * the login page. Adjust the CSS in MembersSettings.css to match your site styles.
 */
const MembersSettings: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear any local admin password flag if your app uses one
      localStorage.removeItem('adminAccess');
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <section className="ucla-content">
      <h1 className="ucla-heading-xl">Account Settings</h1>
      <p className="ucla-paragraph">
        Here you can update your profile, change your password, manage notification preferences, and log out.
      </p>
      <button className="logout-button" onClick={handleLogout}>
        Log Out
      </button>
    </section>
  );
};

export default MembersSettings;
