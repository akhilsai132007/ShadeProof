import React, { useState, useEffect, useCallback } from "react";
import { Navbar, type NavTab } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ShadeFinderView } from "./components/ShadeFinder/ShadeFinderView";
import { MerchantDashboardView } from "./components/Merchant/MerchantDashboardView";
import { AboutView } from "./components/AboutView";
import { DiagnosticsModal } from "./components/DiagnosticsModal";
import { fetchDiagnostics, type DiagnosticsResponse } from "./services/api";

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>("finder");
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState<boolean>(true);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [isRefreshingConnectivity, setIsRefreshingConnectivity] = useState<boolean>(false);

  const loadStatus = useCallback(async (checkConnectivity = false) => {
    try {
      // 1. Health check
      const healthRes = await fetch("http://127.0.0.1:8000/health");
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setBackendHealthy(healthData.status === "healthy");
      } else {
        setBackendHealthy(false);
      }

      // 2. Diagnostics check
      const diagData = await fetchDiagnostics(checkConnectivity);
      setDiagnostics(diagData);
      setDiagnosticsError(null);
    } catch (err: any) {
      setBackendHealthy(false);
      setDiagnosticsError(err.message || "Failed to reach backend diagnostics");
    } finally {
      setDiagnosticsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus(false);
    // Periodically poll backend health & diagnostics every 20 seconds
    const interval = setInterval(() => loadStatus(false), 20000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  const handleRefreshConnectivity = async () => {
    setIsRefreshingConnectivity(true);
    try {
      const updatedDiag = await fetchDiagnostics(true);
      setDiagnostics(updatedDiag);
      setDiagnosticsError(null);
    } catch (err: any) {
      setDiagnosticsError(err.message || "Connectivity check failed");
    } finally {
      setIsRefreshingConnectivity(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#23201E]">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        backendHealthy={backendHealthy}
        diagnostics={diagnostics}
        diagnosticsLoading={diagnosticsLoading}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === "finder" && <ShadeFinderView />}
        {currentTab === "merchant" && <MerchantDashboardView />}
        {currentTab === "about" && <AboutView />}
      </main>

      <Footer />

      {/* Persistent Diagnostics Drawer / Modal */}
      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        diagnostics={diagnostics}
        loading={diagnosticsLoading}
        error={diagnosticsError}
        onRefreshConnectivity={handleRefreshConnectivity}
        isRefreshingConnectivity={isRefreshingConnectivity}
      />
    </div>
  );
};

export default App;
