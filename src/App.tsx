import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
//import Members from './pages/Members';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import MembersOnly from './pages/MembersOnly';
import MembersProfile from './pages/Members/Profile';
import MembersEvents from './pages/Members/Events';
import MembersResources from './pages/Members/Resources';
import MembersSettings from './pages/Members/Settings';
import AdminDashboard from './pages/AdminDashBoard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MembersNavbar from './components/MembersNavbar';
import MembersFooter from './components/MembersFooter';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth } from './firebase';
import PerformerAvailability from './pages/Members/PerformerAvailability';
import Events from './pages/Members/Events';
import ManageMembersPage from './pages/ManageMembers';

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
        console.log(tokenResult.claims);
      }
    });
    return () => unsubscribe();
  }, []);

  const isMemberRoute = location.pathname.startsWith('/members');

  return (
    <>
      {!isMemberRoute && <Navbar />}
      {isMemberRoute && user && <MembersNavbar />}
      <main className="ucla-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/members" element={user ? <MembersOnly /> : <Navigate to="/login" replace />} />
          <Route path="/members/profile" element={user ? <MembersProfile /> : <Navigate to="/login" replace />} />
          <Route path="/members/events" element={user ? <MembersEvents /> : <Navigate to="/login" replace />} />
          <Route path="/members/resources" element={user ? <MembersResources /> : <Navigate to="/login" replace />} />
          <Route path="/members/settings" element={user ? <MembersSettings /> : <Navigate to="/login" replace />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="src/pages/AdminDashboard.tsx" element={user? <AdminDashboard /> : <Navigate to="/login" replace />} />
          <Route path="src/pages/AdminDashboard.tsx" element={user  ? <AdminDashboard /> : <Navigate to="/login" replace />} />
          <Route path="src/pages/Members/PerformerAvailability.tsx" element={user ? <PerformerAvailability /> : <Navigate to="/login" replace />} />
          <Route path="/members/events" element={user ? <Events /> : <Navigate to="/login" replace />} />
          <Route path="/members/manage" element={<ManageMembersPage />} />

              
        </Routes>
      </main>
      {!isMemberRoute && <Footer />}
      {isMemberRoute && user && <MembersFooter />}
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