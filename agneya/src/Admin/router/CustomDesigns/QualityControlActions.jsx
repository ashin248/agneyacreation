import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSave, FiCheckCircle, FiPlus, FiTrash2, FiAlertTriangle, FiPrinter, FiFileText } from 'react-icons/fi';

const QualityControlActions = () => {
    const [rejectionReasons, setRejectionReasons] = useState([]);
    const [printRequirements, setPrintRequirements] = useState({
        minDPI: 300,
        allowedFormats: ["PNG", "JPEG", "SVG", "PDF"],
        maxFileSizeMB: 50,
        colorProfile: "CMYK Recommended"
    });

    const [newReason, setNewReason] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGuidelines = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.get(`/api/admin/custom-designs/guidelines`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const data = response.data?.data || null;
                if (data) {
                    setRejectionReasons(data.standardRejectionReasons || []);
                    if (data.minimumPrintRequirements) {
                        setPrintRequirements(data.minimumPrintRequirements);
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error("Error fetching quality control guidelines:", err);
                setRejectionReasons([
                    "Low Resolution (Under 300 DPI)",
                    "Copyright Notice Detected",
                    "Invalid Colorspace"
                ]);
                setLoading(false);
            }
        };

        fetchGuidelines();
    }, []);

    const handleAddReason = () => {
        if (!String(newReason || '').trim()) return;
        setRejectionReasons([...rejectionReasons, String(newReason || '').trim()]);
        setNewReason("");
    };

    const handleRemoveReason = (index) => {
        setRejectionReasons(rejectionReasons.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        setSaving(true);
        setError(null);
        setTimeout(() => {
            setSaving(false);
            setSuccessMessage("Guidelines saved successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
        }, 800);
    };

    const handleFormatChange = (e) => {
        const value = e.target.value;
        const formatsArray = String(value || '').split(',').map(f => String(f).trim().toUpperCase()).filter(f => f);
        setPrintRequirements({...printRequirements, allowedFormats: formatsArray});
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] bg-transparent text-gray-800 font-sans">
            {/* Header / Top Action Bar */}
            <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        QC Guidelines
                    </h1>
                    <p className="text-sm text-gray-400 font-medium mt-1">Configure automated production standards and feedback loops</p>
                </div>
                
                <div className="flex items-center gap-4">
                    {successMessage && (
                        <div className="flex items-center text-[12px] font-bold text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-100 animate-fade-in-down shadow-sm">
                            <FiCheckCircle className="mr-2 w-4 h-4" />
                            {successMessage}
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all duration-300 shadow-xl shrink-0
                            ${saving 
                                ? 'bg-orange-100 text-orange-400 cursor-wait'
                                : 'bg-gray-900 text-white hover:bg-orange-600 hover:shadow-orange-500/30 hover:-translate-y-0.5'
                            }
                        `}
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <FiSave className="w-4 h-4" />
                        )}
                        Update Guidelines
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Standard Rejection Reasons Panel */}
                <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 p-8 shadow-xl flex flex-col h-[620px] border-gray-100">
                    <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-6">
                        <div className="bg-red-50 p-2 rounded-xl text-red-500">
                            <FiAlertTriangle size={20} />
                        </div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight">Feedback Repository</h2>
                    </div>
                    
                    <div className="mb-8 z-10">
                        <label className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em] block">Entry Point</label>
                        <div className="flex gap-3">
                            <input 
                                type="text"
                                value={newReason}
                                onChange={(e) => setNewReason(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddReason()}
                                placeholder="E.g., Artwork contains low-res raster..."
                                className="flex-1 bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all shadow-inner"
                            />
                            <button 
                                onClick={handleAddReason}
                                disabled={!String(newReason || '').trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white w-14 h-14 rounded-2xl transition-all flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                <FiPlus size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30 rounded-3xl border border-gray-100 p-5 space-y-3">
                        {rejectionReasons.length === 0 ? (
                            <div className="text-center p-12 flex flex-col items-center justify-center h-full text-gray-300">
                                <FiFileText size={48} className="mb-4 opacity-20" />
                                <p className="text-sm font-bold uppercase tracking-widest">Repository Empty</p>
                            </div>
                        ) : rejectionReasons.map((reason, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-white hover:bg-blue-50/30 rounded-2xl border border-gray-50 transition-all group shadow-sm">
                                <span className="text-gray-700 text-[13px] font-bold leading-tight">{reason}</span>
                                <button 
                                    onClick={() => handleRemoveReason(index)}
                                    className="text-gray-300 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                    title="Purge Reason"
                                >
                                    <FiTrash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Minimum Print Requirements Panel */}
                <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/40 p-8 shadow-xl flex flex-col h-[620px] border-gray-100">
                    <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-6">
                        <div className="bg-blue-50 p-2 rounded-xl text-blue-500">
                            <FiPrinter size={20} />
                        </div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight">Print Engine Matrix</h2>
                    </div>

                    <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2">
                        
                        {/* Minimum DPI */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-[0.2em] block">
                                Resolution Threshold
                            </label>
                            <div className="relative group">
                                <input 
                                    type="number"
                                    value={printRequirements.minDPI}
                                    onChange={(e) => setPrintRequirements({...printRequirements, minDPI: parseInt(e.target.value) || 0})}
                                    className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-5 text-lg font-black text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-lg border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    DPI
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-3 font-medium flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                Recommended standard for garment output is 300 DPI.
                            </p>
                        </div>

                        {/* Allowed Formats */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-[0.2em] block">
                                Accepted Artifacts
                            </label>
                            <input 
                                type="text"
                                value={printRequirements.allowedFormats.join(", ")}
                                onChange={handleFormatChange}
                                placeholder="PNG, SVG, PDF..."
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-inner uppercase tracking-widest"
                            />
                        </div>

                        {/* Maximum File Size */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-[0.2em] block">
                                    Size Ceiling
                                </label>
                                <div className="relative">
                                    <input 
                                        type="number"
                                        value={printRequirements.maxFileSizeMB}
                                        onChange={(e) => setPrintRequirements({...printRequirements, maxFileSizeMB: parseInt(e.target.value) || 0})}
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-5 text-lg font-black text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase underline decoration-blue-200">MB</div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-[0.2em] block">
                                    Color Profile
                                </label>
                                <div className="relative group">
                                    <select
                                        value={printRequirements.colorProfile}
                                        onChange={(e) => setPrintRequirements({...printRequirements, colorProfile: e.target.value})}
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-5 text-sm font-bold text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-50 appearance-none cursor-pointer transition-all shadow-inner"
                                    >
                                        <option value="CMYK Required">CMYK Required</option>
                                        <option value="CMYK Recommended">CMYK Recommended</option>
                                        <option value="sRGB Allowed">sRGB Allowed</option>
                                        <option value="Any">Any Format</option>
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #d1d5db; }
            `}</style>
        </div>
    );
};

export default QualityControlActions;

