
// src/pages/Register.tsx
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';

const RegisterForm: React.FC = () => {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    year: '',
    major: '',
    instrument: '',
    returning: '',
    readsMusic: '',
    ownsInstrument: '',
    notes: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, 'users', userCredential.user.uid), form);
      navigate('/members');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <section className="ucla-content">
      <h1 className="ucla-heading-xl">Register</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
        {['fullName', 'email', 'phone', 'major', 'instrument', 'password'].map((field) => (
          <div key={field} style={{ marginBottom: '1rem' }}>
            <label htmlFor={field} style={{ display: 'block', fontWeight: 600 }}>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
            <input
              type={field === 'password' ? 'password' : 'text'}
              id={field}
              name={field}
              value={(form as any)[field]}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
            />
          </div>
        ))}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="year" style={{ display: 'block', fontWeight: 600 }}>Year in School:</label>
          <select name="year" id="year" value={form.year} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem' }}>
            <option value="">Select Year</option>
            <option>1st</option>
            <option>2nd</option>
            <option>3rd</option>
            <option>4th</option>
            <option>Graduate</option>
          </select>
        </div>
        {['returning', 'readsMusic', 'ownsInstrument'].map((field) => (
          <div key={field} style={{ marginBottom: '1rem' }}>
            <label htmlFor={field} style={{ display: 'block', fontWeight: 600 }}>{field === 'readsMusic' ? 'Do you read sheet music?' : field === 'ownsInstrument' ? 'Do you own your instrument?' : 'Are you a returning member?'}</label>
            <select name={field} id={field} value={(form as any)[field]} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem' }}>
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        ))}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="notes" style={{ display: 'block', fontWeight: 600 }}>Other info / schedule conflicts:</label>
          <textarea
            name="notes"
            id="notes"
            value={form.notes}
            onChange={handleChange}
            rows={4}
            style={{ width: '100%', padding: '0.5rem' }}
          ></textarea>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', backgroundColor: '#2774AE', color: 'white', border: 'none', borderRadius: '4px' }}>
          Register
        </button>
      </form>
    </section>
  );
};

export default RegisterForm;
