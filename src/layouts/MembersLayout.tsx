// src/layouts/MembersLayout.tsx
import React from 'react';
import MembersNavbar from '../components/MembersNavbar';


const MembersLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
return (
<>
<MembersNavbar />
<main className="ucla-container">{children}</main>
</>
);
};


export default MembersLayout;