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

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    
    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      console.error("Razorpay SDK failed to load.");
      resolve(false);
    };

    document.body.appendChild(script);
  });
};
