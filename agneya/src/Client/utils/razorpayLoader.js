/**
 * Dynamically loads the Razorpay checkout script.
 * This prevents "resource preloaded but not used" warnings and improves initial page load.
 * @returns {Promise<boolean>} Resolves to true if script loads successfully, false otherwise.
 */
export const loadRazorpay = () => {
  return new Promise((resolve) => {
    // If already loaded, return true
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if script already exists in document
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      if (window.Razorpay) {
        resolve(true);
      } else {
        existingScript.onload = () => resolve(true);
        existingScript.onerror = () => resolve(false);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Razorpay SDK failed to load.");
      resolve(false);
    };

    document.head.appendChild(script);
  });
};
