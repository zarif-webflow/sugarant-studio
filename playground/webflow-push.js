/* eslint-disable */

// Mimic Webflow's callback system
window.Webflow = window.Webflow || [];

// Store original push method
const originalPush = window.Webflow.push;

// Override push to execute callbacks immediately
window.Webflow.push = function (callback) {
  if (typeof callback === "function") {
    try {
      callback();
    } catch (error) {
      console.error("Webflow callback error:", error);
    }
  }
  // Also store in array for compatibility
  return originalPush.call(this, callback);
};

// Execute any existing callbacks in the array
window.Webflow.forEach((callback) => {
  if (typeof callback === "function") {
    try {
      callback();
    } catch (error) {
      console.error("Webflow callback error:", error);
    }
  }
});
