import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Phone, MessageSquare, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import OnboardingModal from "./OnboardingModal";

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const { userData, setupRecaptcha, verifyOtp } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setPhoneNumber("");
      setOtp("");
      setError("");
    }
  }, [isOpen]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
      if (!/^\+91\d{10}$/.test(formattedPhone)) {
        throw new Error("Please enter a valid 10-digit mobile number.");
      }
      await setupRecaptcha(formattedPhone);
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (otp.length !== 6) {
        throw new Error("Please enter a valid 6-digit OTP.");
      }
      await verifyOtp(otp);
      // Wait a bit for AuthContext to sync userData or check directly if possible
      // However, we can check userData after next render or use the response from verifyOtp
      // We'll rely on a tiny delay or a status check
    } catch (err) {
      setError(err.message || "Invalid OTP. Please check and try again.");
      setLoading(false);
    }
  };

  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (userData && !loading && step === 2 && !isSuccess) {
        setIsSuccess(true);
        const isIncomplete = !userData.name || !userData.email || !userData.addresses || userData.addresses.length === 0;
        
        const timer = setTimeout(() => {
            if (isIncomplete) {
                setShowOnboarding(true);
            } else {
                if (onLoginSuccess) onLoginSuccess();
                else if (onClose) onClose();
            }
        }, 3000);
        
        return () => clearTimeout(timer);
    }
  }, [userData, loading, step, isSuccess]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    if (onLoginSuccess) onLoginSuccess();
    else if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="p-6 md:p-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            {step === 1 ? (
              <Phone className="w-8 h-8 text-indigo-600" />
            ) : (
              <MessageSquare className="w-8 h-8 text-indigo-600" />
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-center text-gray-900 mb-2">
            {step === 1 ? "Login / Sign Up" : "Verification"}
          </h2>
          <p className="text-gray-500 text-center mb-8">
            {step === 1
              ? "Enter your mobile number to get started"
              : `Enter the 6-digit code sent to +91${phoneNumber}`}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl animate-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium border-r pr-3">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(String(e.target.value || '').replace(/\D/g, "").slice(0, 10))}
                  className="w-full pl-16 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-lg font-medium tracking-wide"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || phoneNumber.length < 10 || isSuccess}
                className={`w-full ${isSuccess ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-slate-900'} disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Success!
                  </>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(String(e.target.value || '').replace(/\D/g, "").slice(0, 6))}
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-center text-2xl font-bold tracking-[0.5em]"
                required
              />

              <button
                type="submit"
                disabled={loading || otp.length < 6 || isSuccess}
                className={`w-full ${isSuccess ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-slate-900'} disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSuccess ? (
                   <>
                    <CheckCircle className="w-5 h-5" />
                    Verified Successfully!
                  </>
                ) : (
                  "Verify & Login"
                )}
              </button>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-gray-500 text-sm font-medium hover:text-indigo-600 transition-colors"
                  disabled={loading}
                >
                  Change Mobile Number
                </button>
              </div>
            </form>
          )}

          {/* Invisible Recaptcha Container */}
          <div id="recaptcha-container" className="mt-4"></div>

          <p className="mt-8 text-xs text-gray-400 text-center">
            By continuing, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>

      <OnboardingModal 
        isOpen={showOnboarding} 
        onComplete={handleOnboardingComplete} 
      />
    </div>
  );
};

export default LoginModal;

