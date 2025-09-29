// =============================================
// FILE: src/App.tsx
// Purpose: Make the entire /members section a protected area using
//          a single <ProtectedRoute> with nested child routes.
//          (Admin pages are temporarily unprotected by removing the AdminRoute.)
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

// Pages (public)
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import BookUs from './pages/bookUs';
import Join from './pages/joinUs';
import HireUs from './pages/HireUs';

// Members (protected)
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

// Navbars / layout bits
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MembersNavbar from './components/MembersNavbar';
import AdminNavbar from './adminComponents/adminNavbar';
import PerformerNavbar from './performerComponents/performerNavbar';

// Debug component: displays user and admin status for testing
import AdminDebug from './components/AdminDebug';

// Auth / Roles
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth } from './firebase';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import { isAdminEmail } from './config/roles';

// Admin helpers & pages
import AdminOnly from './routes/AdminOnly';
import AdminLayout from './layouts/AdminLayout';
import AdminEvents from './pages/admin/AdminEvents';
import AdminManageMembers from './adminComponents/AdminManageMembers';
import AdminInquiries from './adminComponents/AdminInquiries';
import ParticipationReport from './components/ParticipationReport';
// Import the new Reports page (admin reports) from the pages/admin folder
import Reports from './adminComponents/Reports';
import Staff from './pages/people/Staff';
import Musicians from './pages/people/Musicians';
import Dancers from './pages/people/Dancers';

// Role-based landing
import RoleBasedLayout from './rolebasedlayout/rbl';

// Global styles
import './styles/global.css';

// --- Tiny wrapper so /members can nest all child routes under one ProtectedRoute ---
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

  /*
   * Determine if the current user is an admin. We first check for a custom
   * claim (set via Firebase Cloud Functions) which is the preferred way to
   * handle roles. If no claim exists, we fall back to checking the
   * hard‑coded allowlist in roles.ts. We also normalize email casing to
   * ensure case‑insensitive comparisons.
   */
  const isAdmin = React.useMemo(() => {
    if (!user) return false;
    // Use custom claim if present (e.g. { admin: true } or { role: 'admin' })
    if (claims?.admin || claims?.role === 'admin') {
      return true;
    }
    // Fallback to email allowlist (case‑insensitive)
    const email = (user.email ?? '').toLowerCase();
    return isAdminEmail(email);
  }, [user, claims]);

  // Page-type flags for which header to show
  const path = location.pathname;
  const isMemberRoute = path.startsWith('/members');
  const isAdminRoute = path.startsWith('/admin');
  const isPerformerRoute = path.startsWith('/performer-dashboard');
  const isDashboardRoute = path.startsWith('/dashboard') || isPerformerRoute || isAdminRoute;

  return (
    <div className="app-shell">
      {/* Role-aware headers (Admin header renders inside AdminLayout) */}
      {!isMemberRoute && !isDashboardRoute && <Navbar />}
      {isMemberRoute && user && <MembersNavbar />}
      {isPerformerRoute && user && <PerformerNavbar />}
      {isAdminRoute && user && isAdmin && <AdminNavbar />}

      <main className="container main stack" role="main">
        <Routes>
          {/* Public */}
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

          {/* Members (all under ONE ProtectedRoute) */}
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

          {/* Role-based landing (single route; removed duplicate) */}
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

{/* ADMIN — nested; AdminLayout itself renders the AdminNavbar once */}
<Route
  path="/admin/*"
  element={
    <ProtectedRoute user={user}>
      {/* Inline admin check: render AdminLayout or redirect to dashboard */}
      {isAdmin ? <AdminLayout /> : <Navigate to="/dashboard" replace />}
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

{/* Legacy path for direct participation URL */}
<Route path="/admin/participation" element={<ParticipationReport />} />


          {/* Performer-only (simple protected leaf) */}
          <Route
            path="/performer-dashboard"
            element={
              <ProtectedRoute user={user}>
                <PerformerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all → Home or 404 page if you add one */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}

      {/* Debug panel (only visible when user clicks the button). Remove or comment out in production. */}
      <AdminDebug user={user} isAdmin={isAdmin} claims={claims} />
    </div>
  );
};

const AppWrapper: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;