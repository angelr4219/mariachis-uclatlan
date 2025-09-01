// src/layouts/PublicLayout.tsx
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';


const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
return (
<>
<Navbar />
<main className="ucla-container">{children}</main>
<Footer />
</>
);
};


export default PublicLayout;