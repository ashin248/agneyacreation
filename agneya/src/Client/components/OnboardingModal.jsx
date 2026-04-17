import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
    User, Mail, MapPin, 
    ArrowRight, Loader2, 
    ShieldCheck, Smartphone, 
    Home, Globe, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';

const OnboardingModal = ({ isOpen, onComplete }) => {
    const { currentUser, userData, setUserData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [pincodeLoading, setPincodeLoading] = useState(false);
    const [pincodeError, setPincodeError] = useState("");
    
    // Form State
    const [formData, setFormData] = useState({
        name: userData?.name || '',
        email: userData?.email || '',
        houseNo: '',
        area: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        type: 'Home'
    });

    const autoFillPincode = async (pincode) => {
        setPincodeLoading(true);
        setPincodeError("");
        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await response.json();
            if (data[0].Status === "Success" && data[0].PostOffice.length > 0) {
                const postOffice = data[0].PostOffice[0];
                setFormData((prev) => ({
                    ...prev,
                    city: postOffice.District || postOffice.Block || postOffice.Name,
                    state: postOffice.State
                }));
                toast.success(`Region Detected: ${postOffice.District}, ${postOffice.State}`);
            } else {
                setPincodeError("Invalid Pincode provided.");
            }
        } catch (err) {
            console.error("Pincode Sync Error:", err);
            setPincodeError("Logistics API Sync Failure.");
        } finally {
            setPincodeLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'pincode' && value.length === 6) {
            autoFillPincode(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic Validation
        if (!formData.name || !formData.email || !formData.houseNo || !formData.area || !formData.city || !formData.state || !formData.pincode) {
            toast.error("Please provide all required deployment details.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            toast.error("Invalid communication node (email address).");
            return;
        }

        setLoading(true);
        try {
            const onboardingData = {
                phone: currentUser.phoneNumber,
                name: formData.name,
                email: formData.email,
                addresses: [
                    {
                        name: formData.name,
                        email: formData.email,
                        mobile: currentUser.phoneNumber,
                        houseNo: formData.houseNo,
                        area: formData.area,
                        city: formData.city,
                        state: formData.state,
                        country: formData.country,
                        pincode: formData.pincode,
                        type: formData.type,
                        isDefault: true
                    }
                ]
            };

            const token = await currentUser.getIdToken();
            const response = await axios.post('/api/public/update-user', onboardingData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setUserData(response.data.data);
                toast.success("Profile Synchronized Successfully.");
                onComplete();
            } else {
                throw new Error("Failed to sync records.");
            }
        } catch (error) {
            console.error("Onboarding Error:", error);
            const serverMessage = error.response?.data?.message || "System sync failed. Please attempt again.";
            toast.error(serverMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 backdrop-blur-3xl p-4 md:p-10 animate-in fade-in duration-500 overflow-y-auto">
            {/* Soft Background Light Effects */}
            <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-indigo-600/20 blur-[150px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-emerald-600/20 blur-[150px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-4xl bg-white/90 backdrop-blur-2xl rounded-[48px] shadow-2xl border border-white/50 overflow-hidden relative flex flex-col md:flex-row min-h-[600px]">
                
                {/* Visual Sidebar */}
                <div className="hidden md:flex md:w-1/3 bg-slate-950 p-12 flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                            <ShieldCheck className="text-white w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Security<br/>Onboarding</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Protocol Version 1.0.4</p>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <Smartphone size={18} />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Authenticated</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase">{currentUser?.phoneNumber}</p>
                            </div>
                        </div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-relaxed">
                            Complete your professional profile to unlock the full commercial suite, integrated fulfillment, and real-time logistics tracking.
                        </p>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 p-8 md:p-14 overflow-y-auto custom-scrollbar">
                    <header className="mb-10 space-y-2 text-center md:text-left">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Complete Your Profile</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Capture critical B2B deployment data</p>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Primary Identity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <User size={12}/> Legal Name
                                </label>
                                <input 
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g., John Doe / ABC Corp"
                                    className="w-full h-14 bg-gray-50/50 border border-slate-100 rounded-2xl px-6 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Mail size={12}/> Communication Node
                                </label>
                                <input 
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="primary@domain.com"
                                    className="w-full h-14 bg-gray-50/50 border border-slate-100 rounded-2xl px-6 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="h-[1px] bg-slate-50 w-full"></div>

                        {/* Deployment Vectors (Address) */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Logistics HQ (Primary Address)</h4>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input name="houseNo" value={formData.houseNo} onChange={handleChange} placeholder="House / Flat / Office No" className="h-12 bg-gray-50 border border-slate-100 rounded-xl px-5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-50 outline-none" required />
                                    <input name="area" value={formData.area} onChange={handleChange} placeholder="Area / Street / Colony" className="h-12 bg-gray-50 border border-slate-100 rounded-xl px-5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-50 outline-none" required />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="relative flex-1">
                                        <input name="city" value={formData.city} onChange={handleChange} placeholder="City" className="w-full h-12 bg-gray-50 border border-slate-100 rounded-xl px-5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-50 outline-none" required />
                                    </div>
                                    <div className="relative flex-1">
                                        <input name="state" value={formData.state} onChange={handleChange} placeholder="State" className="w-full h-12 bg-gray-50 border border-slate-100 rounded-xl px-5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-50 outline-none" required />
                                    </div>
                                    <div className="relative flex-1">
                                        <input name="country" value={formData.country} onChange={handleChange} placeholder="Country" className="w-full h-12 bg-gray-100 border border-slate-100 rounded-xl px-5 text-xs font-bold text-slate-400 cursor-not-allowed" readOnly />
                                    </div>
                                    <div className="relative flex-1">
                                        <input name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Pincode" className={`w-full h-12 bg-gray-50 border rounded-xl px-5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-50 outline-none transition-all ${pincodeError ? 'border-red-500 bg-red-50' : 'border-slate-100'}`} required maxLength={6} />
                                        {pincodeLoading && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                            </div>
                                        )}
                                        {pincodeError && <p className="absolute -bottom-4 left-1 text-[8px] text-red-500 font-black uppercase tracking-widest">{pincodeError}</p>}
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    {['Home', 'Office', 'Factory'].map(type => (
                                        <button 
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({...formData, type})}
                                            className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.type === type ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white h-16 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-slate-950 transition-all flex items-center justify-center gap-3 group active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Initialize Dashboard
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
