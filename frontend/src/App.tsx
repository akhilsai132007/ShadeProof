import React, { useState, useEffect } from "react";
import { Navbar, type NavTab } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ShadeFinderView } from "./components/ShadeFinder/ShadeFinderView";
import { MerchantDashboardView } from "./components/Merchant/MerchantDashboardView";
import { AboutView } from "./components/AboutView";

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>("finder");
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth();
    // Periodically poll backend health every 15 seconds
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/health");
      if (res.ok) {
        const data = await res.json();
        setBackendHealthy(data.status === "healthy");
      } else {
        setBackendHealthy(false);
      }
    } catch {
      setBackendHealthy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#23201E]">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        backendHealthy={backendHealthy}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === "finder" && <ShadeFinderView />}
        {currentTab === "merchant" && <MerchantDashboardView />}
        {currentTab === "about" && <AboutView />}
      </main>

      <Footer />
    </div>
  );
};

export default App;
