import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // We set loading to false immediately so the app can render
        // userData will sync in the background
        setLoading(false);
        
        try {
          const idToken = await user.getIdToken();
          const response = await fetch('/api/public/sync-user', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ phone: user.phoneNumber })
          });
          
          if (!response.ok) throw new Error(`Server responded with ${response.status}`);
          
          const result = await response.json();
          if (result.success) {
            setUserData(result.data);
            if (result.data.isNewUser) {
              toast.success("Welcome New Customer! Congratulations 🌟", { icon: '🎁', duration: 4000 });
            } else {
              toast.success("Welcome Back! ✋", { duration: 3000 });
            }
          } else {
            console.error("Backend sync failed:", result.message);
          }
        } catch (error) {
          console.error("Error syncing user with backend:", error);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const setupRecaptcha = async (phoneNumber) => {
    try {
      // Clean up any existing verifier to prevent "reCAPTCHA container already has a verifier" errors
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn("Error clearing old recaptcha:", e);
        }
      }
      
      const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: (response) => {
          console.log("Recaptcha verified successfully");
        },
        'expired-callback': () => {
          toast.error("Recaptcha expired. Please try again.");
        }
      });

      window.recaptchaVerifier = recaptchaVerifier;
      
      // Explicitly render to catch initialization/network errors early
      await recaptchaVerifier.render();
      
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      return result;
    } catch (error) {
      console.error("Detailed Recaptcha/Phone Sign-in Error:", error);
      console.log("Diagnostic Info - Domain:", window.location.hostname);
      console.log("Diagnostic Info - Online Status:", window.navigator.onLine);
      
      if (!window.navigator.onLine) {
        toast.error("You appear to be offline. Please check your internet connection.");
      } else if (error.code === 'auth/network-request-failed') {
        toast.error(`Network Error: Ensure '${window.location.hostname}' is added to Authorized Domains in Firebase Console.`);
      } else if (error.code === 'auth/too-many-requests') {
        toast.error("Too many attempts. Please try again later.");
      } else {
        toast.error(`Authentication Error: ${error.message}`);
      }
      throw error;
    }
  };

  const verifyOtp = async (otpCode) => {
    if (!confirmationResult) throw new Error("No confirmation result found. Try sending OTP again.");
    try {
      const result = await confirmationResult.confirm(otpCode);
      return result.user;
    } catch (error) {
      console.error("OTP Verification Error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUserData(null);
    return signOut(auth);
  };

  const value = {
    currentUser,
    userData,
    setUserData,
    setupRecaptcha,
    verifyOtp,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

