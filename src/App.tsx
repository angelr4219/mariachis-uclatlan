// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import MembersOnly from './pages/MembersOnly';
import MembersProfile from './pages/Members/Profile';
import MembersEvents from './pages/Members/Events';
import MembersResources from './pages/Members/Resources';
import MembersSettings from './pages/Members/Settings';
import PerformerAvailability from './pages/Members/PerformerAvailability';
import ManageMembersPage from './pages/ManageMembers';
import AdminDashboard from './adminComponents/adminDashboard';
import PerformerDashboard from './performerComponents/PerformerDashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MembersNavbar from './components/MembersNavbar';
import AdminNavbar from './adminComponents/adminNavbar.tsx'; 
import PerformerNavbar from './performerComponents/performerNavbar.tsx';  
import Calendar from './pages/Members/Calendar';

import RoleBasedLayout from './rolebasedlayout/rbl';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

import BookUs from './pages/bookUs';
import Join from './pages/joinUs';

// ✅ Admin-only pages
import AdminManageMembers from './adminComponents/AdminManageMembers';
import AdminReports from './adminComponents/AdminReports';

const App: React.FC = () => {
  const [user, setUser] = React.useState<any>(null);
  const [setClaims] = React.useState<any>(null);
  const [isAdmin, setIsAdmin] = React.useState<boolean>(false); // ✅ added
  const location = useLocation();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const tokenResult = await getIdTokenResult(currentUser);
        setClaims(tokenResult.claims);
        console.log(tokenResult.claims);

        // ✅ fetch roles from Firestore profile
        try {
          const ref = doc(db, 'profiles', currentUser.uid);
          const snap = await getDoc(ref);
          const roles = snap.exists() ? (snap.data() as any).roles || [] : [];
          setIsAdmin(Array.isArray(roles) && roles.includes('admin'));
        } catch (e) {
          console.warn('Failed to load profile roles', e);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const isMemberRoute = location.pathname.startsWith('/members');
  const isDashboardRoute =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/performer-dashboard') ||
    location.pathname.startsWith('/admin-dashboard');
  const isAdminRoute = location.pathname.startsWith('/admin-dashboard');
  const isPerformerRoute = location.pathname.startsWith('/performer-dashboard');

  return (
    <>
      {/* Public Pages Navbar */}
      {!isMemberRoute && !isDashboardRoute && <Navbar />}

      {/* Member Pages Navbar */}
      {isMemberRoute && user && <MembersNavbar />}
      {/* Admin Pages Navbar */}
      {isAdminRoute && user && <AdminNavbar />}
      {/* Performer Pages Navbar */}
      {isPerformerRoute && user && <PerformerNavbar />}

      <main className="ucla-container">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/book-us" element={<BookUs />} />
          <Route path="/join" element={<Join />} />

          {/* Members Section */}
          <Route path="/members" element={user ? <MembersOnly /> : <Navigate to="/login" replace />} />
          <Route path="/members/profile" element={user ? <MembersProfile /> : <Navigate to="/login" replace />} />
          <Route path="/members/events" element={user ? <MembersEvents /> : <Navigate to="/login" replace />} />
          <Route path="/members/resources" element={user ? <MembersResources /> : <Navigate to="/login" replace />} />
          <Route path="/members/settings" element={user ? <MembersSettings /> : <Navigate to="/login" replace />} />
          <Route path="/members/performer-availability" element={user ? <PerformerAvailability /> : <Navigate to="/login" replace />} />
          <Route path="/members/manage" element={user ? <ManageMembersPage /> : <Navigate to="/login" replace />} />
          <Route path="/members/calendar" element={<Calendar />} />

          {/* Dashboards */}
          <Route
            path="/dashboard"
            element={
              <RoleBasedLayout
                adminComponent={<AdminDashboard />}
                performerComponent={<PerformerDashboard />}
                publicComponent={<Home />}
              />
            }
          />

          {/* ✅ Admin-only routes */}
          <Route
            path="/admin/manage"
            element={user ? (isAdmin ? <AdminManageMembers /> : <Navigate to="/members" replace />) : <Navigate to="/login" replace />}
          />
          <Route
            path="/admin/reports"
            element={user ? (isAdmin ? <AdminReports /> : <Navigate to="/members" replace />) : <Navigate to="/login" replace />}
          />
        </Routes>
      </main>

      {!isMemberRoute && <Footer />}
    </>
  );
};

const AppWrapper: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
