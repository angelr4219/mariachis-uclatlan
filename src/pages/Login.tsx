// src/Pages/Login.tsx
import React, { useEffect, useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [phone, setPhone] = useState(''); // +1##########
  const [code, setCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const goMembers = () => navigate('/members-only');

  // if already signed in, bounce to members
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) goMembers();
    });
    return () => unsub();
  }, []);

  // ---------------- Email / Password ----------------
  const handleEmailLogin: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      goMembers();
    } catch (err: any) {
      console.error('[Email login] ', err);
      setError(err?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Google ----------------
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      goMembers();
    } catch (err: any) {
      console.error('[Google login] ', err);
      setError(err?.message ?? 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Phone (reCAPTCHA + SMS) ----------------
  const ensureRecaptcha = (): RecaptchaVerifier => {
    if (window.recaptchaVerifier) return window.recaptchaVerifier;

    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
    } catch (e1) {
      console.warn('[reCAPTCHA modular ctor failed, trying compat]', e1);
      // @ts-expect-error allow dual signature for compat
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', { size: 'invisible' }, auth);
    }
    return window.recaptchaVerifier!;
  };

  const sendPhoneCode = async () => {
    setError('');
    setLoading(true);
    try {
      const verifier = ensureRecaptcha();
      const result = await signInWithPhoneNumber(auth, phone.trim(), verifier);
      setConfirmationResult(result);
    } catch (err: any) {
      console.error('[sendPhoneCode] ', err);
      setError(err?.message ?? 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneCode = async () => {
    if (!confirmationResult) return;
    setError('');
    setLoading(true);
    try {
      await confirmationResult.confirm(code.trim());
      goMembers();
    } catch (err: any) {
      console.error('[verifyPhoneCode] ', err);
      setError(err?.message ?? 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="background">
        <div className="shape" />
        <div className="shape" />

        <form onSubmit={handleEmailLogin}>
          <h3>Login Here</h3>

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@ucla.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Log In'}
          </button>

          <div className="social" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="go"
              onClick={handleGoogleLogin}
              aria-label="Continue with Google"
              disabled={loading}
            >
              Continue with Google
            </button>
          </div>

          <div style={{ marginTop: 24 }}>
            {!confirmationResult ? (
              <>
                <label htmlFor="phone">Phone (E.164, e.g. +13105551234)</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+1##########"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <button type="button" onClick={sendPhoneCode} disabled={loading || !phone}>
                  Send verification code
                </button>
              </>
            ) : (
              <>
                <label htmlFor="code">Enter verification code</label>
                <input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button type="button" onClick={verifyPhoneCode} disabled={loading || !code}>
                  Verify & Sign in
                </button>
              </>
            )}
          </div>

          {error && <p style={{ color: 'salmon', marginTop: 16 }}>{error}</p>}
          <div id="recaptcha-container" />
        </form>
      </div>
    </div>
  );
};

export default Login;
