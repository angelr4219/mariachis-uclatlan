import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';

interface UserData {
  id?: string;
  name: string;
  email: string;
  instrument: string;
  schoolYear: string;
  section: string;
  role: string;
}

const ManageMembersPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [newUser, setNewUser] = useState<UserData>({
    name: '',
    email: '',
    instrument: '',
    schoolYear: '',
    section: '',
    role: 'performer',
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as UserData[];
      setUsers(usersData);
    };

    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return alert('Name and Email are required.');
    await addDoc(collection(db, 'users'), newUser);
    setNewUser({ name: '', email: '', instrument: '', schoolYear: '', section: '', role: 'performer' });
    window.location.reload(); // Simple Refresh
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateDoc(doc(db, 'users', userId), { role: newRole });
    window.location.reload();
  };

  return (
    <section style={{ padding: '2rem' }}>
      <h1>Manage Members</h1>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Add New Member</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <input name="name" placeholder="Full Name" value={newUser.name} onChange={handleInputChange} />
          <input name="email" placeholder="Email" value={newUser.email} onChange={handleInputChange} />
          <input name="instrument" placeholder="Instrument" value={newUser.instrument} onChange={handleInputChange} />
          <input name="schoolYear" placeholder="Year (e.g., 3rd Year)" value={newUser.schoolYear} onChange={handleInputChange} />
          <input name="section" placeholder="Section" value={newUser.section} onChange={handleInputChange} />
          <select name="role" value={newUser.role} onChange={handleInputChange}>
            <option value="performer">Performer</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleAddUser}>Add Member</button>
        </div>
      </div>

      <h2>All Members</h2>
      {users.map(user => (
        <div key={user.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
          <p><strong>{user.name}</strong> ({user.email})</p>
          <p>Instrument: {user.instrument} | Section: {user.section} | Year: {user.schoolYear}</p>
          <p>Current Role: {user.role}</p>
          <select
            value={user.role}
            onChange={(e) => handleRoleChange(user.id!, e.target.value)}
          >
            <option value="performer">Performer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      ))}
    </section>
  );
};

export default ManageMembersPage;
