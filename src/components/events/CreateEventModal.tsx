// =============================================
// FILE: src/components/events/CreateEventModal.tsx
// Description: Reusable modal for creating a new Event (Admin only)
// Depends on your services/events.createEvent API and EventItem shape.
// =============================================
import React from 'react';
import './CreateEventModal.css';

export type EventDraft = {
  title: string;
  date: string;            // YYYY-MM-DD
  startTime?: string;      // HH:MM (24h)
  endTime?: string;        // HH:MM (24h)
  location?: string;
  description?: string;
  status?: 'draft' | 'published' | 'cancelled';
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (draft: EventDraft) => Promise<void> | void;
  defaultValues?: Partial<EventDraft>;
}

const CreateEventModal: React.FC<Props> = ({ open, onClose, onCreate, defaultValues }) => {
  const [draft, setDraft] = React.useState<EventDraft>(() => ({
    title: defaultValues?.title ?? '',
    date: defaultValues?.date ?? new Date().toISOString().slice(0, 10),
    startTime: defaultValues?.startTime ?? '',
    endTime: defaultValues?.endTime ?? '',
    location: defaultValues?.location ?? '',
    description: defaultValues?.description ?? '',
    status: defaultValues?.status ?? 'draft',
  }));
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setDraft((d) => ({
      ...d,
      title: defaultValues?.title ?? '',
      date: defaultValues?.date ?? new Date().toISOString().slice(0, 10),
      startTime: defaultValues?.startTime ?? '',
      endTime: defaultValues?.endTime ?? '',
      location: defaultValues?.location ?? '',
      description: defaultValues?.description ?? '',
      status: defaultValues?.status ?? 'draft',
    }));
    setError(null);
  }, [open]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setDraft((d) => ({ ...d, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!draft.title.trim()) return setError('Title is required.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return setError('Date must be YYYY-MM-DD.');

    try {
      setSubmitting(true);
      await onCreate(draft);
      setSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error('[CreateEventModal] create error', err);
      setSubmitting(false);
      setError(err?.message ?? 'Failed to create event.');
    }
  };

  return (
    <div className="cem-backdrop" role="dialog" aria-modal="true" aria-label="Create event">
      <div className="cem-modal">
        <header className="cem-header">
          <h2>Create Event</h2>
          <button className="cem-icon" onClick={onClose} aria-label="Close">×</button>
        </header>
        <form className="cem-form" onSubmit={handleSubmit}>
          {error && <div className="cem-error">{error}</div>}

          <label className="cem-field">
            <span>Title *</span>
            <input name="title" value={draft.title} onChange={handleChange} placeholder="e.g., Wedding at Royce Hall" />
          </label>

          <div className="cem-row">
            <label className="cem-field">
              <span>Date *</span>
              <input type="date" name="date" value={draft.date} onChange={handleChange} />
            </label>
            <label className="cem-field">
              <span>Start</span>
              <input type="time" name="startTime" value={draft.startTime} onChange={handleChange} />
            </label>
            <label className="cem-field">
              <span>End</span>
              <input type="time" name="endTime" value={draft.endTime} onChange={handleChange} />
            </label>
          </div>

          <label className="cem-field">
            <span>Location</span>
            <input name="location" value={draft.location} onChange={handleChange} placeholder="Address or venue" />
          </label>

          <label className="cem-field">
            <span>Description/Notes</span>
            <textarea name="description" value={draft.description} onChange={handleChange} placeholder="Any details for performers or client..." />
          </label>

          <label className="cem-field">
            <span>Status</span>
            <select name="status" value={draft.status} onChange={handleChange}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <footer className="cem-footer">
            <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn" disabled={submitting}>{submitting ? 'Saving…' : 'Create Event'}</button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;

