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
    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
          <MapPin className="text-indigo-600 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Add New Address</h2>
          <p className="text-gray-500 text-sm">Where should we deliver your order?</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Receiver's name"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              placeholder="For order tracking"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 ml-1">Mobile Number</label>
          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="10-digit number"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Pincode</label>
            <div className="relative">
              {pincodeLoading ? (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-600 animate-spin" />
              ) : (
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              )}
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="6-digit Pincode"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                required
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={loading}
              className="w-full h-[50px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 border border-gray-200 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              ) : (
                <>
                  <MapPin className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                  Use Current Location
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 ml-1">House No / Flat / Building Name</label>
          <input
            type="text"
            name="houseNo"
            value={formData.houseNo}
            onChange={handleChange}
            placeholder="e.g., Flat 101, Skyline Apartments"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 ml-1">Area / Street / Sector</label>
          <input
            type="text"
            name="area"
            value={formData.area}
            onChange={handleChange}
            placeholder="e.g., MG Road, Sector 4"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">City / District</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Auto-filled from pincode"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="State"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Country"
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-gray-400 cursor-not-allowed outline-none"
              readOnly
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Address Label</label>
          <div className="flex gap-3">
            {["home", "work", "other"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, type })}
                className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${
                  formData.type === type
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                    : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                }`}
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
          className="w-full py-5 bg-slate-900 border border-slate-900 hover:bg-white hover:text-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3 mt-6"
        >
          Save & Use Address
        </button>
      </form>
    </div>
  );
};

export default AddressForm;

