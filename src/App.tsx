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
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MemberNavbar from './components/MembersNavbar';
import MemberFooter from './components/MembersFooter';
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
      {isMemberRoute && user && <MemberNavbar />}
      <main className="ucla-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/members" element={user ? <MembersOnly /> : <Navigate to="/login" replace />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      {!isMemberRoute && <Footer />}
      {isMemberRoute && user && <MemberFooter />}
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
