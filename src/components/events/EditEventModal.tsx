
// =============================================
// FILE: src/components/events/EditEventModal.tsx (NEW)
// Purpose: Reusable modal to edit existing event fields
// - Minimal required fields: title, location, description, status
// - Optional: date, startTime, endTime (only sent if provided)
// - You can extend to include more fields as your Event schema evolves
// =============================================
import React from 'react';
import './EditEventModal.css';

export type EventEditValues = {
  title: string;
  location: string;
  description: string;
  status: 'draft' | 'published' | 'cancelled' | string;
  date?: string;       // e.g. '2025-10-12' or your preferred format
  startTime?: string;  // e.g. '18:00'
  endTime?: string;    // e.g. '20:00'
};

type Props = {
  open: boolean;
  initialValues?: EventEditValues;
  onClose: () => void;
  onSave: (values: EventEditValues) => void | Promise<void>;
};

const DEFAULTS: EventEditValues = {
  title: '',
  location: '',
  description: '',
  status: 'draft',
  date: '',
  startTime: '',
  endTime: '',
};

const EditEventModal: React.FC<Props> = ({ open, initialValues, onClose, onSave }) => {
  const [v, setV] = React.useState<EventEditValues>(initialValues ?? DEFAULTS);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setV(initialValues ?? DEFAULTS);
  }, [initialValues, open]);

  if (!open) return null;

  const update = (patch: Partial<EventEditValues>) => setV((prev) => ({ ...prev, ...patch }));

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(v);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__card">
        <header className="modal__header">
          <h2 className="modal__title">Edit Event</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <form onSubmit={handleSubmit} className="modal__body">
          <label className="field">
            <span className="field__label">Title</span>
            <input className="field__input" value={v.title} onChange={(e) => update({ title: e.target.value })} required />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Date (optional)</span>
              <input type="date" className="field__input" value={v.date || ''} onChange={(e) => update({ date: e.target.value })} />
            </label>
            <label className="field">
              <span className="field__label">Start (optional)</span>
              <input type="time" className="field__input" value={v.startTime || ''} onChange={(e) => update({ startTime: e.target.value })} />
            </label>
            <label className="field">
              <span className="field__label">End (optional)</span>
              <input type="time" className="field__input" value={v.endTime || ''} onChange={(e) => update({ endTime: e.target.value })} />
            </label>
          </div>

          <label className="field">
            <span className="field__label">Location</span>
            <input className="field__input" value={v.location} onChange={(e) => update({ location: e.target.value })} />
          </label>

          <label className="field">
            <span className="field__label">Description</span>
            <textarea className="field__textarea" rows={4} value={v.description} onChange={(e) => update({ description: e.target.value })} />
          </label>

          <label className="field">
            <span className="field__label">Status</span>
            <select className="field__select" value={v.status} onChange={(e) => update({ status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <footer className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;
