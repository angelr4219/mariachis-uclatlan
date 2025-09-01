// =============================================
// FILE: src/App.tsx (DROP-IN REPLACEMENT)
// Adds: role detection (performer), loading state, and new route guards
// =============================================
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import AdminEvents from './pages/admin/AdminEvents';
import MemberEvents from './pages/Members/MemberEvents';
import HireUs from './pages/HireUs';
import BookUs from './pages/bookUs';
import Join from './pages/joinUs';
import ClientBooking from './pages/ClientBooking';
import Calendar from './pages/Members/Calendar';

import RoleBasedLayout from './rolebasedlayout/rbl';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

// Layouts & guards
import PublicLayout from './layouts/publicLayout';
import MembersLayout from './layouts/MembersLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import MemberRoute from './routes/MemberRoute';
import PerformerRoute from './routes/PerformerRoute';

import RSVP from './pages/Members/RSVP';
import LoadingScreen from './pages/LoadingScreen';
import NotAuthorized from './pages/NotAuthorized';

const App: React.FC = () => {
  const [user, setUser] = React.useState<any>(null);
  const [roles, setRoles] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  const isAdmin = roles.includes('admin');
  const isPerformer = roles.includes('performer');

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        setLoading(true);
        if (currentUser) {
          // Prefer Firestore profile roles; fall back to custom claims if present
          let foundRoles: string[] = [];
          try {
            const ref = doc(db, 'profiles', currentUser.uid);
            const snap = await getDoc(ref);
            if (snap.exists()) {
              const data = snap.data() as any;
              if (Array.isArray(data.roles)) foundRoles = data.roles.map((r: any) => String(r).toLowerCase());
            }
          } catch (e) {
            console.warn('Failed to load profile roles', e);
          }

          if (foundRoles.length === 0) {
            try {
              const tokenResult = await getIdTokenResult(currentUser);
              const claimRoles = (tokenResult.claims.roles || []) as any[];
              if (Array.isArray(claimRoles)) foundRoles = claimRoles.map((r) => String(r).toLowerCase());
              if ((tokenResult.claims as any).admin && !foundRoles.includes('admin')) foundRoles.push('admin');
            } catch (e) {
              console.warn('Failed to load custom claims', e);
            }
          }

          setRoles(foundRoles);
        } else {
          setRoles([]);
        }
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <PublicLayout>
        <LoadingScreen />
      </PublicLayout>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <Home />
          </PublicLayout>
        }
      />
      <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
      <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
      <Route path="/book-us" element={<PublicLayout><BookUs /></PublicLayout>} />
      <Route path="/join" element={<PublicLayout><Join /></PublicLayout>} />
      <Route path="/client-booking" element={<PublicLayout><ClientBooking /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
      <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />

      {/* Member routes (must be signed in) */}
      <Route
        path="/members"
        element={
          <MemberRoute user={user}>
            <MembersLayout>
              <MembersOnly />
            </MembersLayout>
          </MemberRoute>
        }
      />
      <Route
        path="/members/profile"
        element={
          <MemberRoute user={user}>
            <MembersLayout>
              <MembersProfile />
            </MembersLayout>
          </MemberRoute>
        }
      />
      <Route
        path="/members/events"
        element={
          <MemberRoute user={user}>
            <MembersLayout>
              <MembersEvents />
            </MembersLayout>
          </MemberRoute>
        }
      />
      <Route
        path="/members/resources"
        element={
          <MemberRoute user={user}>
            <MembersLayout>
              <MembersResources />
            </MembersLayout>
          </MemberRoute>
        }
      />
      <Route
        path="/members/settings"
        element={
          <MemberRoute user={user}>
            <MembersLayout>
              <MembersSettings />
            </MembersLayout>
          </MemberRoute>
        }
      />
      <Route
        path="/members/manage"
        element={
          <MemberRoute user={user}>
            <MembersLayout>
              <ManageMembersPage />
            </MembersLayout>
          </MemberRoute>
        }
      />
      <Route
        path="/members/calendar"
        element={
          <MemberRoute user={user}>
            <MembersLayout>
              <Calendar />
            </MembersLayout>
          </MemberRoute>
        }
      />
      <Route
        path="/members/rsvp"
        element={
          <MemberRoute user={user}>
            <MembersLayout>
              <RSVP />
            </MembersLayout>
          </MemberRoute>
        }
      />

      {/* Performer-only route (admins allowed) */}
      <Route
        path="/members/performer-availability"
        element={
          <ProtectedRoute user={user}>
            <PerformerRoute isPerformer={isPerformer} isAdmin={isAdmin}>
              <MembersLayout>
                <PerformerAvailability />
              </MembersLayout>
            </PerformerRoute>
          </ProtectedRoute>
        }
      />

      {/* Dashboards */}
      <Route
        path="/dashboard"
        element={
          <PublicLayout>
            <RoleBasedLayout
              adminComponent={<AdminDashboard />}
              performerComponent={<PerformerDashboard />}
              publicComponent={<Home />}
            />
          </PublicLayout>
        }
      />

      {/* Admin only */}
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
      <Route
        path="/admin/manage"
        element={
          <ProtectedRoute user={user}>
            <AdminRoute isAdmin={isAdmin}>
              <AdminLayout>
                <ManageMembersPage />
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

      {/* Member events alias */}
      <Route
        path="/member-events"
        element={
          <MemberRoute user={user}>
            <MembersLayout>
              <MemberEvents />
            </MembersLayout>
          </MemberRoute>
        }
      />

      {/* Fallbacks */}
      <Route path="/not-authorized" element={<PublicLayout><NotAuthorized /></PublicLayout>} />
      <Route path="*" element={<PublicLayout><div style={{ padding: '2rem' }}>404 — Page not found</div></PublicLayout>} />
    </Routes>
  );
};

const AppWrapper: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
