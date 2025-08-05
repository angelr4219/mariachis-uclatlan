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
import AdminNavbar from './adminComponents/adminNavbar.tsx'; // Adjust path if needed
import PerformerNavbar from './performerComponents/performerNavbar.tsx';  // Adjust path if needed

import RoleBasedLayout from './rolebasedlayout/rbl'; // Adjust import path as needed
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth } from './firebase';

const App: React.FC = () => {
  const [user, setUser] = React.useState<any>(null);
  const [setClaims] = React.useState<any>(null);
  const location = useLocation();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const tokenResult = await getIdTokenResult(currentUser);
        setClaims(tokenResult.claims);
        console.log(tokenResult.claims);
      }
    });
    return () => unsubscribe();
  }, []);
  const isMemberRoute = location.pathname.startsWith('/members');

  const isDashboardRoute = location.pathname.startsWith('/dashboard') || 
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

          {/* Members Section */}
          <Route path="/members" element={user ? <MembersOnly /> : <Navigate to="/login" replace />} />
          <Route path="/members/profile" element={user ? <MembersProfile /> : <Navigate to="/login" replace />} />
          <Route path="/members/events" element={user ? <MembersEvents /> : <Navigate to="/login" replace />} />
          <Route path="/members/resources" element={user ? <MembersResources /> : <Navigate to="/login" replace />} />
          <Route path="/members/settings" element={user ? <MembersSettings /> : <Navigate to="/login" replace />} />
          <Route path="/members/performer-availability" element={user ? <PerformerAvailability /> : <Navigate to="/login" replace />} />
          <Route path="/members/manage" element={user ? <ManageMembersPage /> : <Navigate to="/login" replace />} />

          {/* Role-Based Layout (Admin/Performer/Public Dashboards) */}
          <Route path="/dashboard" element={
            <RoleBasedLayout
              adminComponent={<AdminDashboard />}
              performerComponent={<PerformerDashboard />}
              publicComponent={<Home />}
            />
          } />
        </Routes>
      </main>

      {!isMemberRoute && <Footer />}

    </>
  );
};

const AppWrapper: React.FC = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

export default AppWrapper;
