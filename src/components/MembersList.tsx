import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

interface UserData {
  id: string;
  name: string;
  email: string;
  instrument: string;
  schoolYear: string;
  section: string;
  role: string;
}

const MembersList: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData: UserData[] = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as UserData[];
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Loading members...</p>;

  return (
    <div>
      <h2>All Members</h2>
      {users.map(user => (
        <div key={user.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
          <p><strong>{user.name}</strong> ({user.email})</p>
          <p>Instrument: {user.instrument} | Section: {user.section} | Year: {user.schoolYear}</p>
          <p>Role: {user.role}</p>
        </div>
      ))}
    </div>
  );
};

export default MembersList;
