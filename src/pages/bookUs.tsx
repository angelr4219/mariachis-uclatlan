import { useState } from 'react';
import './FormPages.css';

const BookUs: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    eventLocation: '',
    eventDetails: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Booking request submitted:', formData);
    alert('Thank you for your inquiry! We will get back to you soon.');
  };

  return (
    <section className="form-page">
      <h1>Book Us</h1>
      <p>Please fill out this form to request a performance booking.</p>

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Your Name" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Your Email" onChange={handleChange} required />
        <input name="phone" placeholder="Phone Number" onChange={handleChange} required />
        <input name="eventDate" type="date" onChange={handleChange} required />
        <input name="eventLocation" placeholder="Event Location" onChange={handleChange} required />
        <textarea name="eventDetails" placeholder="Tell us about your event..." onChange={handleChange} required />

        <button type="submit">Submit Request</button>
      </form>
    </section>
  );
};

export default BookUs;
