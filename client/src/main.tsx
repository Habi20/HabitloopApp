import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

// Service worker temporarily disabled for demo recording
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then(() => {
//         console.log('✅ PWA: Service Worker registered successfully');
//       })
//       .catch((error) => {
//         console.error('❌ PWA: Service Worker registration failed:', error);
//       });
//   });
// }

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
