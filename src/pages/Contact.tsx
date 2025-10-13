// src/pages/Contact.tsx
import { Link } from 'react-router-dom';
import './Contact.css';

const Contact: React.FC = () => {
  return (
    <section className="contact-page">
      <h1>Contact Us</h1>
      <p className="contact-intro">
        Email us at{" "}
        <a href="mailto:uclatlan@ucla.edu" className="contact-link">
          uclatlan@ucla.edu
        </a>{" "}
        or choose an option below:
      </p>

      <div className="contact-actions">
        {/* TODO: set these routes/URLs to your real destinations */}
        <Link to="/hire-us" className="cta-button">Hiring</Link>

        <Link to="/join" className="cta-button">How to Join Our Group</Link>
        <Link to="/contact/form" className="cta-button">General Questions</Link>
      </div>
    </section>
  );
};

export default Contact;
