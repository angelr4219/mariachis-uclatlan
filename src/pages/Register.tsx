// src/pages/Register.tsx — Profile Integration
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { auth } from '../firebase';
import { serverTimestamp } from 'firebase/firestore';
import { upsertProfile } from '../services/profile';
import type { UserProfile } from '../types/user';

// ---------------- Utils ----------------
const csvToArray = (csv: string): string[] =>
  Array.from(new Set(csv.split(',').map((s) => s.trim()).filter(Boolean)));

const E164_RE = /^\+[1-9]\d{7,14}$/; // basic phone sanity check

// ---------------- Component ----------------
const RegisterForm: React.FC = () => {
  const navigate = useNavigate();

  // Email/Password registration form
  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    year: '',
    major: '',
    instrumentsCsv: '',
    sectionCsv: '',
    returning: '',
    bio: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    password: '',
  });

  // Phone auth state
  const [phone, setPhone] = useState(''); // "+1##########"
  const [code, setCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  > = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // -------- Email/Password Submit --------
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);

      const profile: Partial<UserProfile> = {
        uid: cred.user.uid,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        year: form.year || undefined,
        major: form.major.trim() || undefined,
        instruments: csvToArray(form.instrumentsCsv),
        sections: csvToArray(form.sectionCsv),
        isReturning: form.returning === 'Yes',
        bio: form.bio.trim() || undefined,
        emergencyContact:
          form.emergencyName || form.emergencyPhone || form.emergencyRelation
            ? {
                name: form.emergencyName.trim(),
                phone: form.emergencyPhone.trim(),
                relation: form.emergencyRelation.trim() || undefined,
              }
            : undefined,
        roles: ['performer'],
        createdAt: serverTimestamp(),
      };

      await upsertProfile(cred.user.uid, profile);
      navigate('/members');
    } catch (err: any) {
      console.error('[Register/email] ', err);
      setError(err?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // -------- Google Sign Up --------
  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);

      const profile: Partial<UserProfile> = {
        uid: user.uid,
        name: user.displayName ?? '',
        email: (user.email ?? '').toLowerCase(),
        phoneNumber: user.phoneNumber ?? undefined,
        roles: ['performer'],
        createdAt: serverTimestamp(),
      };

      await upsertProfile(user.uid, profile);
      navigate('/members');
    } catch (err: any) {
      console.error('[Register/google] ', err);
      setError(err?.message ?? 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // -------- Phone Sign Up --------
  useEffect(() => {
    // Render an invisible reCAPTCHA verifier once
    if (typeof window === 'undefined') return;
    if ((window as any)._recaptchaInitialized) return;

    try {
      // Modular signature
      // @ts-ignore - types vary across SDK minor versions
      new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      // @ts-ignore
      (window as any).recaptchaVerifier = (auth as any).recaptchaVerifier ?? (window as any).recaptchaVerifier;
    } catch (e1) {
      try {
        // Compat signature fallback
        // @ts-ignore
        (window as any).recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', { size: 'invisible' }, auth);
      } catch (e2) {
        console.warn('reCAPTCHA init failed', e1, e2);
      }
    }
    (window as any)._recaptchaInitialized = true;
  }, []);

  const sendCode = async () => {
    setError(null);
    setLoading(true);
    try {
      const verifier = (window as any).recaptchaVerifier;
      if (!verifier) throw new Error('reCAPTCHA not ready');
      if (!E164_RE.test(phone.trim())) throw new Error('Enter a valid E.164 phone (e.g. +13105551234)');
      const result = await signInWithPhoneNumber(auth, phone.trim(), verifier);
      setConfirmationResult(result);
    } catch (err: any) {
      console.error('[Register/phone send] ', err);
      setError(err?.message ?? 'Failed to send verification code');
      try { // allow retrial
        // @ts-ignore
        (window as any).recaptchaVerifier?.reset?.();
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    if (!confirmationResult) return;
    setError(null);
    setLoading(true);
    try {
      const { user } = await confirmationResult.confirm(code.trim());
      const profile: Partial<UserProfile> = {
        uid: user.uid,
        name: form.name.trim() || undefined,
        email: (user.email ?? form.email.trim()).toLowerCase() || undefined,
        phoneNumber: user.phoneNumber ?? phone.trim(),
        roles: ['performer'],
        createdAt: serverTimestamp(),
      };
      await upsertProfile(user.uid, profile);
      navigate('/members');
    } catch (err: any) {
      console.error('[Register/phone verify] ', err);
      setError(err?.message ?? 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="register-container">
      <h1 className="register-title">Create your account</h1>
      <p className="register-subtitle">Choose email, Google, or phone. You can edit details later in your portal.</p>

      {/* Email/Password registration */}
      <form onSubmit={handleSubmit} className="register-form">
        <div className="field"><label className="label" htmlFor="name">Full Name</label><input className="input" id="name" name="name" value={form.name} onChange={handleChange} placeholder="Jane Doe" required /></div>

        <div className="grid-2 gap">
          <div className="field"><label className="label" htmlFor="email">Email</label><input className="input" id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@ucla.edu" autoComplete="email" required /></div>
          <div className="field"><label className="label" htmlFor="phoneNumber">Phone</label><input className="input" id="phoneNumber" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="(###) ###-####" /></div>
        </div>

        <div className="grid-2 gap">
          <div className="field">
            <label className="label" htmlFor="year">Year in School</label>
            <select className="input" id="year" name="year" value={form.year} onChange={handleChange} required>
              <option value="">Select Year</option>
              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
              <option>4th Year</option>
              <option>Graduate</option>
            </select>
          </div>
          <div className="field"><label className="label" htmlFor="major">Major</label><input className="input" id="major" name="major" value={form.major} onChange={handleChange} placeholder="Physics, EE, Music, ..." /></div>
        </div>

        <div className="field"><label className="label" htmlFor="instrumentsCsv">Instrument(s) (comma-separated)</label><input className="input" id="instrumentsCsv" name="instrumentsCsv" value={form.instrumentsCsv} onChange={handleChange} placeholder="violin, guitar, trumpet, voice" /></div>
        <div className="field"><label className="label" htmlFor="sectionCsv">Section(s) (optional, comma-separated)</label><input className="input" id="sectionCsv" name="sectionCsv" value={form.sectionCsv} onChange={handleChange} placeholder="violas, violins, harp, voces" /></div>

        <div className="field"><label className="label" htmlFor="returning">Are you a returning member?</label>
          <select className="input" id="returning" name="returning" value={form.returning} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className="field"><label className="label" htmlFor="bio">Short Bio (optional)</label><textarea className="input" id="bio" name="bio" value={form.bio} onChange={handleChange} placeholder="Tell us a little about your experience" rows={3} /></div>

        <div className="grid-3 gap">
          <div className="field"><label className="label" htmlFor="emergencyName">Emergency Contact Name</label><input className="input" id="emergencyName" name="emergencyName" value={form.emergencyName} onChange={handleChange} /></div>
          <div className="field"><label className="label" htmlFor="emergencyPhone">Emergency Contact Phone</label><input className="input" id="emergencyPhone" name="emergencyPhone" value={form.emergencyPhone} onChange={handleChange} /></div>
          <div className="field"><label className="label" htmlFor="emergencyRelation">Relation</label><input className="input" id="emergencyRelation" name="emergencyRelation" value={form.emergencyRelation} onChange={handleChange} /></div>
        </div>

        <div className="field"><label className="label" htmlFor="password">Password</label><input className="input" type="password" id="password" name="password" value={form.password} onChange={handleChange} required /></div>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="submit" disabled={loading}>{loading ? 'Creating account…' : 'Register with Email'}</button>
      </form>

      {/* Divider */}
      <div className="divider"><span>or</span></div>

      {/* Google */}
      <div className="oauth-row">
        <button type="button" className="btn-google" onClick={handleGoogle} disabled={loading} aria-label="Continue with Google">
          Continue with Google
        </button>
      </div>

      {/* Phone sign-up */}
      <div className="phone-card">
        {!confirmationResult ? (
          <div className="grid-2 gap">
            <div className="field"><label className="label" htmlFor="phone">Phone (E.164, e.g. +13105551234)</label><input className="input" id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1##########" /></div>
            <div className="field"><label className="label">&nbsp;</label><button type="button" className="btn-outline" onClick={sendCode} disabled={loading || !phone}>Send verification code</button></div>
          </div>
        ) : (
          <div className="grid-2 gap">
            <div className="field"><label className="label" htmlFor="code">Enter verification code</label><input className="input" id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" /></div>
            <div className="field"><label className="label">&nbsp;</label><button type="button" className="btn-outline" onClick={confirmCode} disabled={loading || !code}>Verify & Create account</button></div>
          </div>
        )}
        <div id="recaptcha-container" />
      </div>

    </section>
  );
};

export default RegisterForm;
