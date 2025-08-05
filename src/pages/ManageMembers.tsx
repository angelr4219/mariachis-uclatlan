import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import './ManageMembers.css';

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

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const usersData = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data() as { user: UserData };
      return {
        id: docSnap.id,
        ...data.user
      };
    });
    console.log(usersData);
    setUsers(usersData);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return alert('Name and Email are required.');
    await addDoc(collection(db, 'users'), { user: newUser });
    setNewUser({ name: '', email: '', instrument: '', schoolYear: '', section: '', role: 'performer' });
    fetchUsers(); // Re-fetch the list dynamically
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateDoc(doc(db, 'users', userId), { 'user.role': newRole });
    window.location.reload();
  };

  return (
    <section className="manage-members-container">
      <h1>Manage Members</h1>

      <div className="add-member-section">
        <h2>Add New Member</h2>
        <div className="add-member-form">
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
      <div className="members-list">
        {users.map(user => (
          <div key={user.id} className="member-card">
            <div className="member-info">
              <p><strong>{user.name}</strong> ({user.email})</p>
              <p>Instrument: {user.instrument} | Section: {user.section} | Year: {user.schoolYear}</p>
              <p>Current Role: {user.role}</p>
            </div>
            <div className="member-actions">
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(user.id!, e.target.value)}
              >
                <option value="performer">Performer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ManageMembersPage;