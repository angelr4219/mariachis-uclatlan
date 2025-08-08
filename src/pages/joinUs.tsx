import { useState } from 'react';
import './FormPages.css';

const Join: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    instrument: '',
    experience: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Join request submitted:', formData);
    alert('Thank you for your interest! We will contact you soon.');
  };

  return (
    <section className="form-page">
      <h1>Join Mariachi de Uclatlán</h1>
      <p>Interested in joining our group? Fill out the form below.</p>

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Your Name" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Your Email" onChange={handleChange} required />
        <input name="phone" placeholder="Phone Number" onChange={handleChange} required />
        <input name="instrument" placeholder="Instrument" onChange={handleChange} required />
        <textarea name="experience" placeholder="Tell us about your experience..." onChange={handleChange} required />

        <button type="submit">Submit Application</button>
      </form>
    </section>
  );
};

export default Join;
