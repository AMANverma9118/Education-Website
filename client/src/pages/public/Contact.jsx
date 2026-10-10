import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import FormDone from '../../components/ui/FormDone.jsx';
import Input from '../../components/ui/Input.jsx';
import './SimplePage.css';

const empty = { name: '', email: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    setForm(empty);
    setDone(true);
    setBusy(false);
  }

  return (
    <div className="simple-page">
      <div className="simple-page__hero">
        <div className="container">
          <p className="eyebrow">Contact</p>
          <h1>Reach the front office.</h1>
        </div>
      </div>
      <div className="container simple-page__body contact-grid">
        <div>
          <p>
            <strong>Main office</strong>
            <br />
            Mon–Fri, 7:45 AM – 4:00 PM
          </p>
          <p>
            482 Maple Ridge Road
            <br />
            Brookhaven, OR 97302
          </p>
          <p>
            (541) 555-0142
            <br />
            office@greenfield.edu
          </p>
        </div>

        {done ? (
          <FormDone
            title="Message sent"
            message="The office will follow up shortly."
            actionLabel="Send another message"
            onContinue={() => setDone(false)}
          />
        ) : (
          <form className="panel form-grid" onSubmit={onSubmit}>
            <Input
              id="name"
              label="Your name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              id="email"
              type="email"
              label="Email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Input
              id="message"
              as="textarea"
              label="Message"
              required
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
            <Button type="submit" variant="primary" loading={busy} loadingText="Sending…">
              Send message
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
