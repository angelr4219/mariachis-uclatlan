import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

interface UserData {
  id: string;
  name: string;
  email: string;
  instrument: string;
  schoolYear: string;
  section: string;
  role: string;
}

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as UserData[];
      setUsers(usersData);
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateDoc(doc(db, "users", userId), { role: newRole });
    alert(`Role updated to ${newRole}`);
    window.location.reload();
  };

  return (
    <div>
      <h2>Manage Users</h2>
      {users.map(user => (
        <div key={user.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
          <p><strong>{user.name}</strong> ({user.email})</p>
          <p>Instrument: {user.instrument} | Section: {user.section} | Year: {user.schoolYear}</p>
          <p>Current Role: {user.role}</p>
          <select
            value={user.role}
            onChange={(e) => handleRoleChange(user.id, e.target.value)}
          >
            <option value="performer">Performer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      ))}
    </div>
  );
};

export default ManageUsers;
