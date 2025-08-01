// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Members from './pages/Members';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import MembersOnly from './pages/MembersOnly';
import MembersProfile from './pages/Members/Profile';
import MembersEvents from './pages/Members/Events';
import MembersResources from './pages/Members/Resources';
import MembersSettings from './pages/Members/Settings';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MembersNavbar from './components/MembersNavbar';
import MembersFooter from './components/MembersFooter';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';



const App: React.FC = () => {
  const [user, setUser] = React.useState<any>(null);
  const location = useLocation();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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
