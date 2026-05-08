import React, { useState, useEffect } from "react";
import { Search, MapPin, User, Home, Briefcase, Plus, Loader2 } from "lucide-react";

const AddressForm = ({ onSave, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    pincode: "",
    houseNo: "",
    area: "",
    landmark: "",
    city: "",
    state: "",
    country: "India",
    type: "home" // home, work, other
  });

  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Pincode auto-fill
    if (name === "pincode" && value.length === 6) {
      autoFillPincode(value);
    }
  };

  const autoFillPincode = async (pincode) => {
    setPincodeLoading(true);
    setError("");
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
      } else {
        setError("Invalid pincode. Please check and try again.");
      }
    } catch (err) {
      setError("Failed to fetch address from pincode.");
    } finally {
      setPincodeLoading(false);
    }
  };

  const useCurrentLocation = () => {
    setLoading(true);
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Current coordinates:", latitude, longitude);
        // Saving coordinates silently in the state
        setFormData((prev) => ({ ...prev, coords: { latitude, longitude } }));
        setLoading(false);
        // Optional: Could reverse geocode here if desired, but user only asked to fetch and save.
      },
      (err) => {
        setError("Failed to access location. Please check permissions.");
        setLoading(false);
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="neu-flat p-8 max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 neu-pressed rounded-2xl flex items-center justify-center">
          <MapPin className="w-6 h-6" style={{ color: 'var(--color-neu-accent)' }} />
        </div>
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter" style={{ color: 'var(--color-neu-text)' }}>Add New Address</h2>
          <p className="text-sm font-medium opacity-50" style={{ color: 'var(--color-neu-text)' }}>Where should we deliver your order?</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 neu-pressed border-rose-500/20 text-rose-500 text-xs font-bold uppercase tracking-widest rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1" style={{ color: 'var(--color-neu-text)' }}>Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" style={{ color: 'var(--color-neu-text)' }} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Receiver's name"
                className="w-full pl-12 pr-4 py-3.5 neu-input rounded-2xl text-sm font-bold outline-none"
                style={{ color: 'var(--color-neu-text)' }}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1" style={{ color: 'var(--color-neu-text)' }}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              placeholder="For order tracking"
              className="w-full px-4 py-3.5 neu-input rounded-2xl text-sm font-bold outline-none"
              style={{ color: 'var(--color-neu-text)' }}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1" style={{ color: 'var(--color-neu-text)' }}>Mobile Number</label>
          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="10-digit number"
            className="w-full px-4 py-3.5 neu-input rounded-2xl text-sm font-bold outline-none"
            style={{ color: 'var(--color-neu-text)' }}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1" style={{ color: 'var(--color-neu-text)' }}>Pincode</label>
            <div className="relative">
              {pincodeLoading ? (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin" style={{ color: 'var(--color-neu-accent)' }} />
              ) : (
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" style={{ color: 'var(--color-neu-text)' }} />
              )}
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="6-digit Pincode"
                className="w-full pl-12 pr-4 py-3.5 neu-input rounded-2xl text-sm font-bold outline-none"
                style={{ color: 'var(--color-neu-text)' }}
                required
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={loading}
              className="w-full h-[54px] neu-button font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
              style={{ color: 'var(--color-neu-text)' }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-neu-accent)' }} />
              ) : (
                <>
                  <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: 'var(--color-neu-accent)' }} />
                  Use My Location
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1" style={{ color: 'var(--color-neu-text)' }}>House No / Flat / Building Name</label>
          <input
            type="text"
            name="houseNo"
            value={formData.houseNo}
            onChange={handleChange}
            placeholder="e.g., Flat 101, Skyline Apartments"
            className="w-full px-4 py-3.5 neu-input rounded-2xl text-sm font-bold outline-none"
            style={{ color: 'var(--color-neu-text)' }}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1" style={{ color: 'var(--color-neu-text)' }}>Area / Street / Sector</label>
          <input
            type="text"
            name="area"
            value={formData.area}
            onChange={handleChange}
            placeholder="e.g., MG Road, Sector 4"
            className="w-full px-4 py-3.5 neu-input rounded-2xl text-sm font-bold outline-none"
            style={{ color: 'var(--color-neu-text)' }}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1" style={{ color: 'var(--color-neu-text)' }}>City / District</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Auto-filled"
              className="w-full px-4 py-3.5 neu-input rounded-2xl text-sm font-bold outline-none"
              style={{ color: 'var(--color-neu-text)' }}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1" style={{ color: 'var(--color-neu-text)' }}>State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="State"
              className="w-full px-4 py-3.5 neu-input rounded-2xl text-sm font-bold outline-none"
              style={{ color: 'var(--color-neu-text)' }}
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1" style={{ color: 'var(--color-neu-text)' }}>Address Label</label>
          <div className="flex gap-3">
            {["home", "work", "other"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, type })}
                className={`flex-1 py-4 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  formData.type === type
                    ? "neu-button-accent"
                    : "neu-button opacity-60 hover:opacity-100"
                }`}
                style={formData.type === type ? {} : { color: 'var(--color-neu-text)' }}
              >
                {type === "home" && <Home size={14} />}
                {type === "work" && <Briefcase size={14} />}
                {type === "other" && <Plus size={14} />}
                {type}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-5 neu-button-accent font-black text-xs uppercase tracking-[0.2em] rounded-3xl transition-all flex items-center justify-center gap-3 mt-6"
        >
          Save & Use Address
        </button>
      </form>
    </div>
  );
};

export default AddressForm;

