
// src/pages/MembersProfile.tsx
import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const MembersProfile: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      console.log("Logged-in user:", user); 
  
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          console.log("Profile data:", docSnap.data()); 
          setUserData(docSnap.data());
        } else {
          console.log("No document found for user.");
        }
      } else {
        console.log("No user is currently logged in.");
      }
    };
    fetchProfile();
  }, []);
  

  if (!userData) {
    return <p className="ucla-paragraph">Loading profile...</p>;
  }

  return (
    <section className="ucla-content">
      <h1 className="ucla-heading-xl">Your Profile</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {Object.entries(userData).map(([key, value]) => (
          <li key={key} style={{ marginBottom: '0.5rem' }}>
            <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {String(value)}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default MembersProfile;
