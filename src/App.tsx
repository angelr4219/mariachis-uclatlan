// ===============================
// FILE: src/App.tsx (updated)
// ===============================
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
import AdminDashboard from './adminComponents/adminDashboard';
import PerformerDashboard from './performerComponents/PerformerDashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MembersNavbar from './components/MembersNavbar';
import AdminNavbar from './adminComponents/adminNavbar'; // ← unified to components path
import PerformerNavbar from './performerComponents/performerNavbar';
import Calendar from './pages/Members/Calendar';
import RoleBasedLayout from './rolebasedlayout/rbl';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth } from './firebase';
import BookUs from './pages/bookUs';
import Join from './pages/joinUs';
import HireUs from './pages/HireUs';

import AdminInquiries from './adminComponents/AdminInquiries'; // + add import



// --- NEW: import the report page ---
import ParticipationReport from './components/ParticipationReport';
// Admin-only utilities
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import { isAdminEmail } from './config/roles';
import AdminLayout from './layouts/AdminLayout';
import AdminEvents from './pages/admin/AdminEvents';
import AdminManageMembers from './adminComponents/AdminManageMembers'; // ← new import

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

  const isAdmin = React.useMemo(() => isAdminEmail(user?.email ?? undefined), [user]);
  const isMemberRoute = location.pathname.startsWith('/members');
  const isDashboardRoute =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/performer-dashboard') ||
    location.pathname.startsWith('/admin');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isPerformerRoute = location.pathname.startsWith('/performer-dashboard');

  return (
    <>
      {/* Public Pages Navbar */}
      {!isMemberRoute && !isDashboardRoute && <Navbar />}

      {/* Member Pages Navbar */}
      {isMemberRoute && user && <MembersNavbar />}

      {/* Admin Pages Navbar (only for admin users) */}
      {isAdminRoute && user && isAdmin && <AdminNavbar />}

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
          <Route path="/hire-us" element={<HireUs />} />
          <Route path="/join" element={<Join />} />

          {/* Members Section */}
          <Route path="/members" element={user ? <MembersOnly /> : <Navigate to="/login" replace />} />
          <Route path="/members/profile" element={user ? <MembersProfile /> : <Navigate to="/login" replace />} />
          <Route path="/members/events" element={user ? <MembersEvents /> : <Navigate to="/login" replace />} />
          <Route path="/members/resources" element={user ? <MembersResources /> : <Navigate to="/login" replace />} />
          <Route path="/members/settings" element={user ? <MembersSettings /> : <Navigate to="/login" replace />} />
          <Route path="/members/performer-availability" element={user ? <PerformerAvailability /> : <Navigate to="/login" replace />} />
          <Route path="/members/calendar" element={<Calendar />} />

          {/* Role-Based Layout */}
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

          {/* =============================== */}
          {/* Admin-only routes */}
          {/* =============================== */}
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
          <Route
          path="/admin/participation"
          element={
          <ProtectedRoute user={user}>
          <AdminRoute isAdmin={isAdmin}>
          <AdminLayout>
          <ParticipationReport />
          </AdminLayout>
          </AdminRoute>
          </ProtectedRoute>
          }
          />

        <Route
          path="/admin/inquiries"
          element={
            <ProtectedRoute user={user}>
              <AdminRoute isAdmin={isAdmin}>
                <AdminLayout>
                  <AdminInquiries />
                </AdminLayout>
              </AdminRoute>
            </ProtectedRoute>
          }
        />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute user={user}>
                <AdminRoute isAdmin={isAdmin}>
                  <AdminLayout>
                    <AdminEvents />
                  </AdminLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          {/* NEW: Admin Manage Members */}
          <Route
            path="/admin/managemembers"
            element={
              <ProtectedRoute user={user}>
                <AdminRoute isAdmin={isAdmin}>
                  <AdminLayout>
                    <AdminManageMembers />
                  </AdminLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute user={user}>
                <AdminRoute isAdmin={isAdmin}>
                  <AdminLayout>
                    <div style={{ padding: '1rem' }}>Reports coming soon…</div>
                  </AdminLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          {/* =============================== */}
          {/* Performer-only routes */}
          {/* =============================== */}
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

