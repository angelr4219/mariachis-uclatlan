
// ===============================
// 8) Minimal tests (Jest + RTL) — example test file
//    File: src/services/__tests__/sanitize.test.tsx
// ===============================
import { sanitizeMessage, stripHTML, cleanPhone, isValidPhoneE164 } from '../../services/sanitize';

test('stripHTML removes tags', () => {
  expect(stripHTML('<b>x</b> & <i>y</i>')).toBe('x & y');
});

test('sanitizeMessage removes scripts and control chars', () => {
  const dirty = '<script>alert(1)</script>Hello\u0007';
  expect(sanitizeMessage(dirty)).toBe('Hello');
});

test('cleanPhone and validation', () => {
  expect(cleanPhone('(310) 555-1234')).toBe('3105551234');
  expect(isValidPhoneE164('+13105551234')).toBe(true);
  expect(isValidPhoneE164('3105551234')).toBe(false);
});


