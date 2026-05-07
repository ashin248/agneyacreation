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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-10 md:p-14 text-center shadow-sm border border-slate-100 max-w-md w-full">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Inquiry Submitted!</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Thank you for your interest. Our team will review your inquiry and get back to you within 12–24 hours.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="w-full py-3.5 text-white rounded-2xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-orange-100"
            style={{ background: 'linear-gradient(135deg, #F7941D, #7B1760)' }}
          >
            Submit Another Inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── HEADER ── */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
            Enterprise & Bulk Orders
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Bulk Procurement</h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            Ordering 10+ units for your business, event, or team? Fill out the form and we'll tailor a quote for you.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT SIDEBAR ── */}
          <div className="lg:col-span-4 space-y-5">
            {/* Benefits Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <h3 className="text-sm font-bold text-slate-900">Why order in bulk?</h3>
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Card */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-orange-400" />
                <span className="text-xs font-semibold text-slate-400">Response time</span>
              </div>
              <p className="text-lg font-bold mb-4">12–24 Hours</p>
              <div className="space-y-3 pt-4 border-t border-white/10">
                <a href="mailto:corporate@agneya.com" className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                    <Mail size={14} />
                  </div>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">corporate@agneya.com</span>
                </a>
                <a href="tel:+919999999999" className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                    <Phone size={14} />
                  </div>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">+91 99999 99999</span>
                </a>
              </div>
            </div>
          </div>

          {/* ── FORM ── */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
              {status === 'error' && (
                <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                  <Shield size={16} className="flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FIELDS.map(({ name, label, type, icon: Icon, placeholder, required, min }) => (
                    <div key={name}>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                      </label>
                      <div className="relative">
                        {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />}
                        <input
                          type={type}
                          name={name}
                          value={formData[name]}
                          onChange={handleChange}
                          required={required}
                          min={min}
                          placeholder={placeholder}
                          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                    Message / Requirements<span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <MessageSquare size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={4}
                      placeholder="Describe your requirements, delivery timelines, customisation needs…"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="flex-1 py-4 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md shadow-orange-100 active:scale-[0.98] disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #F7941D, #7B1760)' }}
                  >
                    {status === 'submitting' ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                    ) : (
                      <><Send size={15} /> Submit Inquiry</>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  By submitting, you agree to be contacted by our team regarding your inquiry.
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
