import React, { useState } from 'react';
import axios from 'axios';
import { Send, Building2, User, Phone, Mail, Package, MessageSquare, CheckCircle, Shield, Clock, Users } from 'lucide-react';

const BENEFITS = [
  { icon: CheckCircle, title: 'Priority Processing', desc: 'Your bulk orders skip the queue and go directly into production scheduling.' },
  { icon: Users, title: 'Dedicated Manager', desc: 'A dedicated account manager guides you through every step of the process.' },
  { icon: Package, title: 'Flexible Shipping', desc: 'Customised delivery timelines and logistics tailored to your requirements.' },
];

const FIELDS = [
  { name: 'contactName',       label: 'Contact Name',       type: 'text',   icon: User,          placeholder: 'Your full name',        required: true },
  { name: 'companyName',       label: 'Company Name',       type: 'text',   icon: Building2,     placeholder: 'Your organisation',     required: false },
  { name: 'phone',             label: 'Phone Number',       type: 'tel',    icon: Phone,         placeholder: '+91 XXXXX XXXXX',       required: true },
  { name: 'email',             label: 'Email Address',      type: 'email',  icon: Mail,          placeholder: 'you@company.com',       required: true },
  { name: 'productOfInterest', label: 'Product of Interest',type: 'text',   icon: Package,       placeholder: 'e.g. Custom Phone Cases', required: true },
  { name: 'estimatedQuantity', label: 'Estimated Quantity', type: 'number', icon: null,          placeholder: 'Min. 10 units',         required: true, min: 10 },
];

const BulkInquiry = () => {
  const [formData, setFormData] = useState({
    contactName: '', companyName: '', email: '', phone: '',
    productOfInterest: '', estimatedQuantity: '', message: ''
  });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await axios.post('/api/public/bulk-inquiry', formData);
      if (res.data.success) {
        setStatus('success');
        setFormData({ contactName: '', companyName: '', email: '', phone: '', productOfInterest: '', estimatedQuantity: '', message: '' });
      } else {
        setStatus('error');
        setErrorMsg(res.data.message || 'Something went wrong.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.message || 'Network error. Please try again later.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-neu-bg)' }}>
        <div className="neu-flat p-10 md:p-14 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-10 shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4" style={{ color: 'var(--color-neu-text)' }}>Inquiry Received</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest leading-loose mb-10 opacity-50" style={{ color: 'var(--color-neu-text)' }}>
            Thank you for your interest. Our enterprise team will review your requirements and reach out within 12–24 hours.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="w-full py-5 neu-button-accent font-black uppercase text-xs tracking-[0.2em] active:scale-[0.98]"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: 'var(--color-neu-bg)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── HEADER ── */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-3 neu-pressed text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full mb-6" style={{ color: 'var(--color-neu-accent)' }}>
            <span className="w-2 h-2 bg-[var(--color-neu-accent)] rounded-full animate-pulse shadow-[0_0_8px_var(--color-neu-accent)]" />
            Enterprise Solutions
          </span>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4" style={{ color: 'var(--color-neu-text)' }}>Bulk Procurement</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] max-w-xl mx-auto opacity-40 leading-relaxed" style={{ color: 'var(--color-neu-text)' }}>
            Ordering 10+ units for your team or event? Fill out the brief and we'll engineer a tailored quote for you.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT SIDEBAR ── */}
          <div className="lg:col-span-4 space-y-5">
            {/* Benefits Card */}
            <div className="neu-flat p-8 space-y-8">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--color-neu-text)' }}>Why choose us?</h3>
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-5">
                  <div className="w-10 h-10 rounded-xl neu-button flex items-center justify-center flex-shrink-0" style={{ color: 'var(--color-neu-accent)' }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight" style={{ color: 'var(--color-neu-text)' }}>{title}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5 opacity-40 leading-relaxed" style={{ color: 'var(--color-neu-text)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Card */}
            <div className="neu-flat p-8 bg-[var(--color-neu-dark)] border-none">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} style={{ color: 'var(--color-neu-accent)' }} />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--color-neu-text)' }}>Direct Line</span>
              </div>
              <p className="text-xl font-black uppercase tracking-tighter mb-6" style={{ color: 'var(--color-neu-text)' }}>12–24h Support</p>
              <div className="space-y-4 pt-6 border-t border-[var(--color-neu-dark)]" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                <a href="mailto:corporate@agneya.com" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl neu-button flex items-center justify-center group-hover:neu-pressed transition-all">
                    <Mail size={16} style={{ color: 'var(--color-neu-text)' }} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-neu-text)' }}>corporate@agneya.com</span>
                </a>
                <a href="tel:+919999999999" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl neu-button flex items-center justify-center group-hover:neu-pressed transition-all">
                    <Phone size={16} style={{ color: 'var(--color-neu-text)' }} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-neu-text)' }}>+91 99999 99999</span>
                </a>
              </div>
            </div>
          </div>

          {/* ── FORM ── */}
          <div className="lg:col-span-8">
            <div className="neu-flat p-8 md:p-10">
              {status === 'error' && (
                <div className="mb-8 flex items-center gap-4 neu-pressed p-5 text-rose-500 text-xs font-black uppercase tracking-widest">
                  <Shield size={18} className="flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FIELDS.map(({ name, label, type, icon: Icon, placeholder, required, min }) => (
                    <div key={name}>
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 block" style={{ color: 'var(--color-neu-text)' }}>
                        {label}{required && <span className="text-[var(--color-neu-accent)] ml-1">*</span>}
                      </label>
                      <div className="relative">
                        {Icon && <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" style={{ color: 'var(--color-neu-text)' }} />}
                        <input
                          type={type}
                          name={name}
                          value={formData[name]}
                          onChange={handleChange}
                          required={required}
                          min={min}
                          placeholder={placeholder}
                          className={`w-full ${Icon ? 'pl-12' : 'pl-5'} pr-5 py-4 neu-input rounded-xl text-xs font-black outline-none transition-all`}
                          style={{ color: 'var(--color-neu-text)' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 block" style={{ color: 'var(--color-neu-text)' }}>
                    Message / Requirements<span className="text-[var(--color-neu-accent)] ml-1">*</span>
                  </label>
                  <div className="relative">
                    <MessageSquare size={16} className="absolute left-4 top-5 opacity-30" style={{ color: 'var(--color-neu-text)' }} />
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder="Describe your project, delivery timelines, and customisation needs…"
                      className="w-full pl-12 pr-5 py-4 neu-input rounded-xl text-xs font-black outline-none transition-all resize-none"
                      style={{ color: 'var(--color-neu-text)' }}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="flex-1 py-5 neu-button-accent font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-60"
                  >
                    {status === 'submitting' ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                    ) : (
                      <><Send size={18} /> Submit Inquiry</>
                    )}
                  </button>
                </div>

                <p className="text-[9px] font-black uppercase tracking-widest opacity-20 text-center">
                  Protected by secure enterprise encryption
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkInquiry;
