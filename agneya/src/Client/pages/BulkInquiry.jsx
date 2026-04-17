import React, { useState } from 'react';
import axios from 'axios';
import { Send, Building2, User, Phone, Mail, Package, MessageSquare, CheckCircle } from 'lucide-react';

const BulkInquiry = () => {
  const [formData, setFormData] = useState({
    contactName: '',
    companyName: '',
    email: '',
    phone: '',
    productOfInterest: '',
    estimatedQuantity: '',
    message: ''
  });

  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await axios.post('/api/public/bulk-inquiry', formData);
      if (response.data.success) {
        setStatus('success');
        setFormData({
          contactName: '',
          companyName: '',
          email: '',
          phone: '',
          productOfInterest: '',
          estimatedQuantity: '',
          message: ''
        });
      } else {
        setStatus('error');
        setErrorMessage(response.data.message || 'Something went wrong.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.response?.data?.message || 'Network error. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFCFE] font-sans selection:bg-indigo-600 selection:text-white relative overflow-hidden pb-32">
      {/* HIGH-FIDELITY BACKGROUND ARCHITECTURE */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -right-[5%] w-[70%] h-[70%] bg-indigo-50/50 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-[10%] -left-[5%] w-[60%] h-[60%] bg-slate-100/80 rounded-full blur-[100px]"></div>
        <div className="absolute top-[20%] left-[10%] w-[1px] h-[60%] bg-gradient-to-b from-transparent via-indigo-100 to-transparent"></div>
        <div className="absolute top-[30%] right-[15%] w-[1px] h-[40%] bg-gradient-to-b from-transparent via-slate-200 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto py-24 px-6 relative z-10">
        
        {/* PREMIUM INDUSTRIAL HEADER */}
        <div className="text-center mb-24 space-y-8">
          <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-md px-8 py-3 rounded-full border border-indigo-100 shadow-xl shadow-indigo-500/5 animate-in fade-in slide-in-from-top duration-700">
             <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></div>
             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em]">Logistics Intelligence Matrix</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-none uppercase animate-in fade-in slide-in-from-bottom duration-700 delay-100">
            Volume <span className="text-indigo-600 italic">Procurement</span>
          </h1>
          <p className="text-xl text-slate-400 font-bold max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom duration-700 delay-200 uppercase tracking-tight">
            Deploying high-fidelity manufacturing sequences for corporate entities & global industrial events.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-16 items-start">
          
          {/* STATS & IDENTITY (Left Side) */}
          <div className="lg:col-span-4 space-y-10 animate-in fade-in slide-in-from-left duration-1000">
            <div className="bg-slate-950 rounded-[56px] p-12 text-white shadow-2xl relative overflow-hidden group border border-white/5">
               <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
               <h3 className="text-2xl font-black mb-10 uppercase tracking-tighter">Enterprise Protocol</h3>
               <div className="space-y-10">
                 <div className="flex items-start gap-6 group/item">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover/item:bg-indigo-600 group-hover/item:border-indigo-600 transition-all duration-500 shadow-xl">
                       <CheckCircle className="w-6 h-6 text-indigo-400 group-hover/item:text-white" />
                    </div>
                    <div>
                      <p className="font-black text-[13px] uppercase tracking-tight">Priority Node Access</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 leading-relaxed">Direct synchronization with industrial batch cycles.</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-6 group/item">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover/item:bg-indigo-600 group-hover/item:border-indigo-600 transition-all duration-500 shadow-xl">
                       <MessageSquare className="w-6 h-6 text-indigo-400 group-hover/item:text-white" />
                    </div>
                    <div>
                      <p className="font-black text-[13px] uppercase tracking-tight">Strategist Liaison</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 leading-relaxed">Dedicated procurement lead for identity management.</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-6 group/item">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover/item:bg-indigo-600 group-hover/item:border-indigo-600 transition-all duration-500 shadow-xl">
                       <Package className="w-6 h-6 text-indigo-400 group-hover/item:text-white" />
                    </div>
                    <div>
                      <p className="font-black text-[13px] uppercase tracking-tight">Global Logistics Bind</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 leading-relaxed">Optimized freight forwarding and neural routing.</p>
                    </div>
                 </div>
               </div>
            </div>

            <div className="bg-white/60 backdrop-blur-2xl border border-white p-12 rounded-[56px] shadow-[0_30px_60px_rgba(0,0,0,0.04)] hover:shadow-indigo-500/5 transition-all duration-700">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Direct Communications</span>
               </div>
               <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2 lowercase italic">corporate concierge</p>
               <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mb-10">Latency: ~12-24 Hours</p>
               <div className="h-px w-full bg-gradient-to-r from-slate-100 to-transparent mb-10"></div>
               <div className="space-y-6">
                  <div className="flex items-center gap-4 group cursor-pointer">
                     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Mail size={16} />
                     </div>
                     <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] group-hover:text-indigo-600 transition-colors">corporate@agneya.com</span>
                  </div>
                  <div className="flex items-center gap-4 group cursor-pointer">
                     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Phone size={16} />
                     </div>
                     <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] group-hover:text-indigo-600 transition-colors">+91 99999 99999</span>
                  </div>
               </div>
            </div>
          </div>

          {/* FORM (Right Side) */}
          <div className="lg:col-span-8 animate-in fade-in slide-in-from-right duration-1000">
            <div className="bg-white/70 backdrop-blur-3xl border border-white p-12 md:p-20 rounded-[64px] shadow-[0_50px_120px_rgba(0,0,0,0.08)] relative overflow-hidden group/form">
              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover/form:bg-indigo-600/10 transition-colors"></div>
              
              {status === 'success' ? (
                <div className="py-20 text-center space-y-10 animate-in fade-in zoom-in duration-700">
                  <div className="w-32 h-32 bg-emerald-500 text-white rounded-[40px] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 rotate-[15deg] animate-bounce">
                    <CheckCircle className="w-16 h-16" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Transmission Confirmed</h2>
                    <p className="text-slate-400 text-lg font-bold max-w-md mx-auto leading-relaxed uppercase tracking-tight">
                      Your identity and intent matrix have been synced with our enterprise lead neural network.
                    </p>
                  </div>
                  <button 
                    onClick={() => setStatus('idle')}
                    className="bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.4em] py-6 px-16 rounded-[24px] hover:bg-indigo-600 transition-all shadow-2xl hover:-translate-y-2 active:scale-95"
                  >
                    Initialize New Session
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-12">
                  
                  {status === 'error' && (
                    <div className="bg-red-500 text-white px-8 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-widest border border-white/10 shadow-2xl shadow-red-500/20 flex items-center gap-4 animate-shake">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-black">!</div>
                      Operational Error: {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                    {/* Contact Name */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Lead Identity *</label>
                      <div className="relative group/input">
                        <User className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-indigo-500 transition-colors" />
                        <input 
                          type="text" 
                          name="contactName"
                          value={formData.contactName}
                          onChange={handleChange}
                          required
                          className="w-full pl-16 pr-8 py-6 bg-slate-50/50 border border-slate-100 rounded-[28px] text-[13px] font-black uppercase tracking-tight text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-sm"
                          placeholder="FULL NAME"
                        />
                      </div>
                    </div>

                    {/* Company Name */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Enterprise Organization</label>
                      <div className="relative group/input">
                        <Building2 className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-indigo-500 transition-colors" />
                        <input 
                          type="text" 
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          className="w-full pl-16 pr-8 py-6 bg-slate-50/50 border border-slate-100 rounded-[28px] text-[13px] font-black uppercase tracking-tight text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-sm"
                          placeholder="COMPANY NAME"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Secure Correspondence Line *</label>
                      <div className="relative group/input">
                        <Phone className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-indigo-500 transition-colors" />
                        <input 
                          type="tel" 
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="w-full pl-16 pr-8 py-6 bg-slate-50/50 border border-slate-100 rounded-[28px] text-[13px] font-black uppercase tracking-tight text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-sm"
                          placeholder="PHONE NUMBER"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Digital Address Node *</label>
                      <div className="relative group/input">
                        <Mail className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-indigo-500 transition-colors" />
                        <input 
                          type="email" 
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full pl-16 pr-8 py-6 bg-slate-50/50 border border-slate-100 rounded-[28px] text-[13px] font-black lowercase tracking-tight text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-sm"
                          placeholder="EMAIL@CORPORATION.COM"
                        />
                      </div>
                    </div>

                    {/* Product of Interest */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Asset Spectrum *</label>
                      <div className="relative group/input">
                        <Package className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-indigo-500 transition-colors" />
                        <input 
                          type="text" 
                          name="productOfInterest"
                          value={formData.productOfInterest}
                          onChange={handleChange}
                          required
                          className="w-full pl-16 pr-8 py-6 bg-slate-50/50 border border-slate-100 rounded-[28px] text-[13px] font-black uppercase tracking-tight text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-sm"
                          placeholder="SPECIFY ASSET TYPES"
                        />
                      </div>
                    </div>

                    {/* Estimated Quantity */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Initial Volume Matrix *</label>
                      <div className="relative group/input">
                        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 group-focus-within/input:text-indigo-500 transition-colors uppercase">qty</div>
                        <input 
                          type="number" 
                          name="estimatedQuantity"
                          value={formData.estimatedQuantity}
                          onChange={handleChange}
                          required
                          min="10"
                          className="w-full pl-20 pr-8 py-6 bg-slate-50/50 border border-slate-100 rounded-[28px] text-[13px] font-black uppercase tracking-tight text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-sm"
                          placeholder="EST. QUANTITY"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Technical Specifications & Context *</label>
                    <div className="relative group/input">
                      <MessageSquare className="absolute left-8 top-8 w-4 h-4 text-slate-300 group-focus-within/input:text-indigo-500 transition-colors" />
                      <textarea 
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows="5"
                        className="w-full pl-16 pr-8 py-8 bg-slate-50/50 border border-slate-100 rounded-[40px] text-[13px] font-black uppercase tracking-tight text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-sm resize-none leading-relaxed"
                        placeholder="SPECIFY FABRICATION DETAILS, TIMELINES, AND DISTRIBUTION NODES..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="pt-8 space-y-8">
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className={`w-full py-8 text-xs font-black uppercase tracking-[0.5em] text-white rounded-[32px] transition-all duration-700 shadow-2xl relative overflow-hidden group/btn flex items-center justify-center gap-6 ${
                        status === 'submitting' ? 'bg-slate-400' : 'bg-slate-950 hover:bg-indigo-600 hover:-translate-y-2 active:scale-95'
                      }`}
                    >
                      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-700"></div>
                      {status === 'submitting' ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> SYNCING PROTOCOL...</>
                      ) : (
                        <><Send className="w-5 h-5 group-hover/btn:translate-x-3 group-hover/btn:-translate-y-3 transition-transform duration-500" /> Transmit Encryption</>
                      )}
                    </button>
                    <div className="flex flex-col items-center gap-4 py-8 bg-slate-50 rounded-[32px] border border-slate-100">
                        <Scale size={18} className="text-slate-300" />
                        <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-sm px-10 leading-relaxed">
                          By executing this transmission, you authorize Agneya to synchronize industrial manufacturing assets with your organization. 
                        </p>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkInquiry;

