
// =============================================
// FILE: src/App.tsx (clean, uses AdminOnly helper)
// =============================================
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Pages
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
import Calendar from './pages/Members/Calendar';
import BookUs from './pages/bookUs';
import Join from './pages/joinUs';
import HireUs from './pages/HireUs';

// Dashboards
import AdminDashboard from './adminComponents/adminDashboard';
import PerformerDashboard from './performerComponents/PerformerDashboard';

// Navbars
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MembersNavbar from './components/MembersNavbar';
import AdminNavbar from './adminComponents/adminNavbar';
import PerformerNavbar from './performerComponents/performerNavbar';

// Auth / Roles
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth } from './firebase';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import { isAdminEmail } from './config/roles';

// Admin helper & pages
import AdminOnly from './routes/AdminOnly';
import AdminLayout from './layouts/AdminLayout'; // still used for the /admin root landing
import AdminEvents from './pages/admin/AdminEvents';
import AdminManageMembers from './adminComponents/AdminManageMembers';
import AdminInquiries from './adminComponents/AdminInquiries';
import ParticipationReport from './components/ParticipationReport';
import Reports from './adminComponents/Reports.tsx';

// Role-based layout
import RoleBasedLayout from './rolebasedlayout/rbl';

// Responsive globals (safe areas, grid utils)
import './styles/global.css';

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
        // console.debug('claims', tokenResult.claims);
      } else {
        setClaims(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = React.useMemo(() => isAdminEmail(user?.email ?? undefined), [user]);
  const isMemberRoute = location.pathname.startsWith('/members');
  const isDashboardRoute =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/performer-dashboard') ||
    location.pathname.startsWith('/admin');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isPerformerRoute = location.pathname.startsWith('/performer-dashboard');

  return (
    <div className="app-shell">
      {/* Role-aware headers */}
      {!isMemberRoute && !isDashboardRoute && <Navbar />}
      {isMemberRoute && user && <MembersNavbar />}
      {isAdminRoute && user && isAdmin && <AdminNavbar />}
      {isPerformerRoute && user && <PerformerNavbar />}

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

          {/* Members */}
          <Route path="/members" element={user ? <MembersOnly /> : <Navigate to="/login" replace />} />
          <Route path="/members/profile" element={user ? <MembersProfile /> : <Navigate to="/login" replace />} />
          <Route path="/members/events" element={user ? <MembersEvents /> : <Navigate to="/login" replace />} />
          <Route path="/members/resources" element={user ? <MembersResources /> : <Navigate to="/login" replace />} />
          <Route path="/members/settings" element={user ? <MembersSettings /> : <Navigate to="/login" replace />} />
          <Route path="/members/performer-availability" element={user ? <PerformerAvailability /> : <Navigate to="/login" replace />} />
          <Route path="/members/calendar" element={<Calendar />} />

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

          {/* Admin root landing still explicitly framed */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute user={user}>
                <AdminRoute isAdmin={isAdmin}>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          {/* Admin children via AdminOnly helper */}
          <Route path="/admin/participation" element={<AdminOnly user={user} isAdmin={isAdmin}><ParticipationReport /></AdminOnly>} />
          <Route path="/admin/inquiries" element={<AdminOnly user={user} isAdmin={isAdmin}><AdminInquiries /></AdminOnly>} />
          <Route path="/admin/events" element={<AdminOnly user={user} isAdmin={isAdmin}><AdminEvents /></AdminOnly>} />
          <Route path="/admin/managemembers" element={<AdminOnly user={user} isAdmin={isAdmin}><AdminManageMembers /></AdminOnly>} />
          <Route path="/admin/reports" element={<AdminOnly user={user} isAdmin={isAdmin}><Reports /></AdminOnly>} />

          {/* Performer-only */}
          <Route
            path="/performer-dashboard"
            element={
              <ProtectedRoute user={user}>
                <PerformerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {!isMemberRoute && <Footer />}
    </div>
  );
};

const AppWrapper: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;

