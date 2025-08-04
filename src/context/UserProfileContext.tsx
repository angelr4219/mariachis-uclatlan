import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface UserProfile {
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

interface UserProfileContextProps {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const UserProfileContext = createContext<UserProfileContextProps>({
  user: null,
  profile: null,
  loading: true,
});

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserProfileContext.Provider value={{ user, profile, loading }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => useContext(UserProfileContext);
