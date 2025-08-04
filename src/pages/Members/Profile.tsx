import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import UserProfile from '../../components/UserProfile'; // Import your component here

interface UserData {
  name: string;
  email: string;
  phoneNumber: string;
  year: string;
  major: string;
  instrument: string;
  returning: string;
  ownsInstrument: string;
  readsMusic: string;
  notes: string;
  role: string;
}

const ProfilePage: React.FC = () => {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data() as UserData);
      }
      setLoading(false);
    };

    fetchUserData();
  }, [user]);

  if (loading) return <p>Loading profile...</p>;
  if (!userData) return <p>No profile data found.</p>;

  return (
    <section className="ucla-content">
      <h1 className="ucla-heading-xl">Your Profile</h1>
      <UserProfile userData={userData} />
    </section>
  );
};

export default ProfilePage;
