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
      setCurrentUser(user);
      if (user) {
        try {
          // Sync with backend using Firebase ID Token
          const idToken = await user.getIdToken();
          const response = await fetch('/api/public/sync-user', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ phone: user.phoneNumber })
          });
          const result = await response.json();
          if (result.success) {
            setUserData(result.data);
            if (result.data.isNewUser) {
              toast.success("Welcome New Customer! Congratulations 🌟", { icon: '🎁', duration: 4000 });
            } else {
              toast.success("Welcome Back! ✋", { duration: 3000 });
            }
          }
        } catch (error) {
          console.error("Error syncing user with backend:", error);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const setupRecaptcha = async (phoneNumber) => {
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
      
      const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: (response) => {
          console.log("Recaptcha verified");
        }
      });
      window.recaptchaVerifier = recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      return result;
    } catch (error) {
      console.error("Recaptcha/Phone Sign-in Error:", error);
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

export function useAuth() {
  return useContext(AuthContext);
}

