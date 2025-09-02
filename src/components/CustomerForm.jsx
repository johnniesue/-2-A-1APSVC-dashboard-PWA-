import { useState } from 'react';
import { db } from '../firebase'; // adjust path to your Firestore config

export default function CustomerForm() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await db.collection('customers').add(form);
    setForm({ name: '', phone: '', email: '', address: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />
      <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" />
      <input name="address" value={form.address} onChange={handleChange} placeholder="Address" />
      <button type="submit">Add Customer</button>
    </form>
  );
}
