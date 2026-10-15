import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import ShopContextProvider from "./core/context/ShopContext";
import { UserProvider } from "./core/context/UserContext";
import { WishlistProvider } from "./core/context/WishlistContext";

// Clear any existing service workers that might be causing issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister().then(function(boolean) {
        console.log('Service Worker unregistered:', boolean);
      });
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}
  >
    <UserProvider>
      <ShopContextProvider>
        <WishlistProvider>
          <App />
        </WishlistProvider>
      </ShopContextProvider>
    </UserProvider>
  </BrowserRouter>
);
