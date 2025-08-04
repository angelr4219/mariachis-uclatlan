import { httpsCallable } from "firebase/functions";
import { functions } from '../firebase'; // <-- Correct import
import { useState } from "react";

const RoleAssigner: React.FC = () => {
  const [uid, setUid] = useState('');
  const [role, setRole] = useState<'performer' | 'admin'>('performer');
  const [message, setMessage] = useState('');

  const handleAssignRole = async () => {
    const setUserRole = httpsCallable(functions, 'setUserRole');
    try {
      const result = await setUserRole({ uid, role });
      setMessage((result.data as { message: string }).message);
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  return (
    <div>
      <h2>Assign Role</h2>
      <input type="text" placeholder="User UID" value={uid} onChange={(e) => setUid(e.target.value)} />
      <select value={role} onChange={(e) => setRole(e.target.value as 'performer' | 'admin')}>
        <option value="performer">Performer</option>
        <option value="admin">Admin</option>
      </select>
      <button onClick={handleAssignRole}>Assign Role</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default RoleAssigner;
