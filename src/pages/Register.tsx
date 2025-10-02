// =============================================
// FILE: src/pages/Register.tsx
// Fix: type-only imports for TS "verbatimModuleSyntax" + minor typings
// =============================================
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 👉 Split type vs value imports (TS 5 verbatimModuleSyntax)
import type { Auth, ConfirmationResult } from 'firebase/auth';
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../firebase';
import { upsertProfile } from '../services/profile';
import './Register.css';

// Avoid using RecaptchaVerifier in a type position to keep imports clean
declare global {
  interface Window {
    _registerRecaptcha?: any; // instance cached here
  }
}

const recaptchaContainerId = 'recaptcha-container-register';

const RegisterForm: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    year: '',
    major: '',
    instrument: '',
    instrumentsCsv: '',
    sectionCsv: '',
    returning: '',
    bio: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    password: '',
  });

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Phone auth state
  const [phone, setPhone] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const navigate = useNavigate();

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  > = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const instrumentsFromCsv = useMemo(
    () => form.instrumentsCsv.split(',').map((s) => s.trim()).filter(Boolean),
    [form.instrumentsCsv]
  );

  const firstSectionFromCsv = useMemo(() => {
    const arr = form.sectionCsv.split(',').map((s) => s.trim()).filter(Boolean);
    return arr.length ? arr[0] : '';
  }, [form.sectionCsv]);

  const seedProfileFor = async (
    uid: string,
    fallbackEmail?: string | null,
    extras?: Partial<Parameters<typeof upsertProfile>[1]>
  ) => {
    await upsertProfile(uid, {
      name: form.name,
      email: form.email || fallbackEmail || undefined,
      phoneNumber: form.phoneNumber,
      year: form.year,
      major: form.major,
      instrument: form.instrument,
      instruments: instrumentsFromCsv.length ? instrumentsFromCsv : undefined,
      section: firstSectionFromCsv || undefined,
      returning: form.returning,
      bio: form.bio,
      emergencyName: form.emergencyName,
      emergencyPhone: form.emergencyPhone,
      emergencyRelation: form.emergencyRelation,
      roles: ['performer'],
      ...(extras || {}),
    });
  };

  // ---------- Email/password flow ----------
  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await seedProfileFor(cred.user.uid, cred.user.email);
      navigate('/members');
    } catch (err: any) {
      setError(err?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Google flow ----------
  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await seedProfileFor(cred.user.uid, cred.user.email);
      navigate('/members');
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Phone flow ----------
  const ensureRecaptcha = (authInst: Auth) => {
    if (!window._registerRecaptcha) {
      window._registerRecaptcha = new RecaptchaVerifier(authInst, recaptchaContainerId, {
        size: 'normal',
      });
    }
    return window._registerRecaptcha as RecaptchaVerifier;
  };

  const sendCode = async () => {
    setError('');
    if (!phone) {
      setError('Enter a phone number in E.164 format, e.g. +13105551234');
      return;
    }
    setLoading(true);
    try {
      const verifier = ensureRecaptcha(auth);
      const conf = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(conf);
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    setError('');
    if (!confirmationResult || !code) {
      setError('Enter the verification code you received');
      return;
    }
    setLoading(true);
    try {
      const cred = await confirmationResult.confirm(code);
      await seedProfileFor(cred.user.uid, cred.user.email, { phoneNumber: phone });
      navigate('/members');
    } catch (err: any) {
      setError(err?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="register-container">
      <h1 className="register-title">Create your account</h1>
      <p className="register-subtitle">Use email, Google, or phone. You can edit details later in your portal.</p>

      {/* Email/Password registration */}
      <form onSubmit={handleSubmit} className="register-form">
        <div className="field">
          <label className="label" htmlFor="name">Full Name</label>
          <input className="input" id="name" name="name" value={form.name} onChange={handleChange} placeholder="Jane Doe" required />
        </div>

        <div className="grid-2 gap">
          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@ucla.edu" autoComplete="email" required />
          </div>
          <div className="field">
            <label className="label" htmlFor="phoneNumber">Phone</label>
            <input className="input" id="phoneNumber" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="(###) ###-####" />
          </div>
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
              <option>Alumni</option>
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="major">Major</label>
            <input className="input" id="major" name="major" value={form.major} onChange={handleChange} placeholder="Physics, EE, Music, ..." />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="instrument">Primary Instrument</label>
          <input className="input" id="instrument" name="instrument" value={form.instrument} onChange={handleChange} placeholder="Violin, Trumpet, Vihuela..." />
        </div>

        <div className="field">
          <label className="label" htmlFor="instrumentsCsv">Instrument(s) (comma-separated)</label>
          <input className="input" id="instrumentsCsv" name="instrumentsCsv" value={form.instrumentsCsv} onChange={handleChange} placeholder="violin, guitar, trumpet, voice" />
        </div>

        <div className="field">
          <label className="label" htmlFor="sectionCsv">Section(s) (comma-separated)</label>
          <input className="input" id="sectionCsv" name="sectionCsv" value={form.sectionCsv} onChange={handleChange} placeholder="violas, violins, harp, voces" />
        </div>

        <div className="field">
          <label className="label" htmlFor="returning">Are you a returning member?</label>
          <select className="input" id="returning" name="returning" value={form.returning} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className="field">
          <label className="label" htmlFor="bio">Short Bio</label>
          <textarea className="input" id="bio" name="bio" value={form.bio} onChange={handleChange} placeholder="Tell us a little about your experience" rows={3} />
        </div>

        <div className="grid-3 gap">
          <div className="field">
            <label className="label" htmlFor="emergencyName">Emergency Contact Name</label>
            <input className="input" id="emergencyName" name="emergencyName" value={form.emergencyName} onChange={handleChange} />
          </div>
          <div className="field">
            <label className="label" htmlFor="emergencyPhone">Emergency Contact Phone</label>
            <input className="input" id="emergencyPhone" name="emergencyPhone" value={form.emergencyPhone} onChange={handleChange} />
          </div>
          <div className="field">
            <label className="label" htmlFor="emergencyRelation">Relation</label>
            <input className="input" id="emergencyRelation" name="emergencyRelation" value={form.emergencyRelation} onChange={handleChange} />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="password">Password</label>
          <input className="input" type="password" id="password" name="password" value={form.password} onChange={handleChange} required />
        </div>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Register with Email'}
        </button>
      </form>

      <div className="divider"><span>or</span></div>

      <div className="oauth-row">
        <button type="button" className="btn-google" onClick={handleGoogle} disabled={loading} aria-label="Continue with Google">
          Continue with Google
        </button>
      </div>

      <div className="phone-card">
        {!confirmationResult ? (
          <div className="grid-2 gap">
            <div className="field">
              <label className="label" htmlFor="phone">Phone (E.164, e.g. +13105551234)</label>
              <input className="input" id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1##########" />
            </div>
            <div className="field">
              <label className="label">&nbsp;</label>
              <button type="button" className="btn-outline" onClick={sendCode} disabled={loading || !phone}>
                Send verification code
              </button>
            </div>
          </div>
        ) : (
          <div className="grid-2 gap">
            <div className="field">
              <label className="label" htmlFor="code">Enter verification code</label>
              <input className="input" id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
            </div>
            <div className="field">
              <label className="label">&nbsp;</label>
              <button type="button" className="btn-outline" onClick={confirmCode} disabled={loading || !code}>
                Verify & Create account
              </button>
            </div>
          </div>
        )}
        <div id={recaptchaContainerId} />
      </div>
    </section>
  );
};

export default RegisterForm;
