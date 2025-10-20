// =============================================
// FILE: src/App.tsx
// Purpose: Central route definition using a flexible ProtectedRoute.
// =============================================

import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from 'react-router-dom';

// Public pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import BookUs from './pages/bookUs';
import Join from './pages/joinUs';
import HireUs from './pages/HireUs';

// Member pages (protected)
import MembersOnly from './pages/MembersOnly';
import MembersProfile from './pages/Members/Profile';
import MembersEvents from './pages/Members/Events';
import MembersResources from './pages/Members/Resources';
import MembersSettings from './pages/Members/Settings';
import PerformerAvailability from './pages/Members/PerformerAvailability';
import Calendar from './pages/Members/Calendar';

// Dashboards
import AdminDashboard from './adminComponents/adminDashboard';
import PerformerDashboard from './performerComponents/PerformerDashboard';

// Navbars & layout bits
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MembersNavbar from './components/MembersNavbar';
import AdminNavbar from './adminComponents/adminNavbar';
import PerformerNavbar from './performerComponents/performerNavbar';

// Debug helper
import AdminDebug from './components/AdminDebug';

// Auth & roles
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth } from './firebase';
import ProtectedRoute from './routes/ProtectedRoute';
import { isAdminEmail } from './config/roles';
import AdminPassword from './pages/AdminPassword';


// Admin helpers & pages
import AdminLayout from './layouts/AdminLayout';
import AdminEvents from './pages/admin/AdminEvents';
import AdminManageMembers from './adminComponents/AdminManageMembers';
import AdminInquiries from './adminComponents/AdminInquiries';
import ParticipationReport from './components/ParticipationReport';
import Reports from './adminComponents/Reports';  // Use the new Reports page
import Staff from './pages/people/Staff';
import Musicians from './pages/people/Musicians';
import Dancers from './pages/people/Dancers';

// Role-based landing
import RoleBasedLayout from './rolebasedlayout/rbl';

// Styles
import './styles/global.css';

// Wrapper for member routes
const MembersLayout: React.FC = () => <Outlet />;

const App: React.FC = () => {
  const [user, setUser] = React.useState<any>(null);
  const [claims, setClaims] = React.useState<any>(null);
  const location = useLocation();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const tokenResult = await getIdTokenResult(currentUser);
        setClaims(tokenResult.claims);
      } else {
        setClaims(null);
      }
    });
    return () => unsubscribe();
  }, []);


  const hasAdminPass = typeof window !== 'undefined' && localStorage.getItem('adminAccess') === 'true';
  const isAdminUser = React.useMemo(() => {
    const hasAdminPass = typeof window !== 'undefined' && localStorage.getItem('adminAccess') === 'true';
    if (hasAdminPass) return true;
    if (!user) return false;
    if (claims?.admin || claims?.role === 'admin') return true;
    return isAdminEmail(user.email ?? undefined);
  }, [user, claims, location.pathname]); // pathname changes after /admin-password -> /admin
  
  // Determine route flags for navbars
  const path = location.pathname;
  const isMemberRoute = path.startsWith('/members');
  const isAdminRoute = path.startsWith('/admin');
  const isPerformerRoute = path.startsWith('/performer-dashboard');
  const isDashboardRoute = path.startsWith('/dashboard') || isPerformerRoute || isAdminRoute;

  return (
    <div className="app-shell">
      {/* Show the appropriate navbar */}
      {!isMemberRoute && !isDashboardRoute && <Navbar />}
      {isMemberRoute && user && <MembersNavbar />}
      {isPerformerRoute && user && <PerformerNavbar />}
      {/* AdminNavbar will be rendered inside the admin route below */}

      <main className="container main stack" role="main">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/book-us" element={<BookUs />} />
          <Route path="/hire-us" element={<HireUs />} />
          <Route path="/join" element={<Join />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/musicians" element={<Musicians />} />
          <Route path="/dancers" element={<Dancers />} />
          <Route path="/admin-password" element={<AdminPassword />} />



          {/* Members (all under one ProtectedRoute) */}
          <Route
            path="/members"
            element={
              <ProtectedRoute user={user}>
                <MembersLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<MembersOnly />} />
            <Route path="profile" element={<MembersProfile />} />
            <Route path="events" element={<MembersEvents />} />
            <Route path="resources" element={<MembersResources />} />
            <Route path="settings" element={<MembersSettings />} />
            <Route path="performer-availability" element={<PerformerAvailability />} />
            <Route path="calendar" element={<Calendar />} />
          </Route>

          {/* Role-based landing */}
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
          
          {/* ADMIN — nested: embed the AdminNavbar and AdminLayout */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute user={user} isAdminUser={isAdminUser} requiresAdmin>
                <>
                  
                  <AdminLayout />
                </>
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="managemembers" element={<AdminManageMembers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="inquiries" element={<AdminInquiries />} />
            <Route path="participation" element={<ParticipationReport />} />
          </Route>

          {/* Legacy participation path (optional) */}
          <Route path="/admin/participation" element={<ParticipationReport />} />

          {/* Performer-only route */}
          <Route
            path="/performer-dashboard"
            element={
              <ProtectedRoute user={user}>
                <PerformerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Hide footer on admin pages */}
      {!isAdminRoute && <Footer />}

      {/* Debug panel (optional) */}
      <AdminDebug user={user} isAdmin={isAdminUser} claims={claims} />
    </div>
  );
};

const AppWrapper: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
