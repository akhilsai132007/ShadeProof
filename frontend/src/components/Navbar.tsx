import React, { useState } from "react";
import {
  Sparkles,
  BarChart3,
  Info,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Zap,
  FlaskConical,
} from "lucide-react";
import type { DiagnosticsResponse } from "../services/api";

export type NavTab = "finder" | "merchant" | "about";

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  backendHealthy: boolean | null;
  diagnostics: DiagnosticsResponse | null;
  diagnosticsLoading: boolean;
  onOpenDiagnostics: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  backendHealthy,
  diagnostics,
  diagnosticsLoading,
  onOpenDiagnostics,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "finder" as NavTab, label: "Shade Finder", icon: Sparkles },
    { id: "merchant" as NavTab, label: "Merchant Insights", icon: BarChart3 },
    { id: "about" as NavTab, label: "About & Tech", icon: Info },
  ];

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const isLive = diagnostics?.mode === "live";

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#EFE8DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => handleSelect("finder")}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#9F8259] to-[#C5A880] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-[#23201E] font-serif">
                ShadeProof
              </div>
              <div className="text-[11px] uppercase tracking-wider text-[#8C827A] font-medium">
                YouCam AI Foundation Matcher
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#23201E] text-white shadow-sm"
                      : "text-[#59524B] hover:text-[#23201E] hover:bg-[#F2ECE1]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#C5A880]" : "text-[#8C827A]"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Diagnostic Status Indicator & Hackathon Badge */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Status Pill Button */}
            {diagnosticsLoading ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF7F2] border border-[#E8E2D9] text-xs text-[#8C827A]">
                <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />
                <span>Checking mode...</span>
              </div>
            ) : backendHealthy === false ? (
              <button
                onClick={onOpenDiagnostics}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer group shadow-xs"
                title="Backend offline. Click for diagnostics."
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Backend Offline</span>
                <ChevronRight className="w-3.5 h-3.5 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : isLive ? (
              <button
                onClick={onOpenDiagnostics}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 hover:border-emerald-400 transition-all shadow-xs cursor-pointer group"
                title="Live YouCam S2S API active. Click for diagnostics."
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live YouCam</span>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <button
                onClick={onOpenDiagnostics}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50/90 border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100/90 hover:border-amber-400 transition-all shadow-xs cursor-pointer group"
                title="Sandbox demo fixtures active. Click for diagnostics."
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <FlaskConical className="w-3.5 h-3.5 text-amber-700" />
                <span>Sandbox Demo</span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            <div className="flex items-center gap-1 text-xs text-[#8C827A] font-medium border-l border-[#E8E2D9] pl-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Hackathon 2026</span>
            </div>
          </div>

          {/* Mobile Right Controls: Status Pill + Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onOpenDiagnostics}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                backendHealthy === false
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : isLive
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-amber-50 border-amber-300 text-amber-900"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendHealthy === false
                    ? "bg-rose-500"
                    : isLive
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-amber-500"
                }`}
              />
              <span>{isLive ? "Live" : "Sandbox"}</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#59524B] hover:text-[#23201E] hover:bg-[#F7F3EC]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#EFE8DC] bg-[#FDFBF7] px-4 pt-3 pb-5 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  isActive
                    ? "bg-[#23201E] text-white"
                    : "text-[#59524B] hover:bg-[#F7F3EC]"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#C5A880]" : "text-[#8C827A]"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 border-t border-[#EFE8DC] space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDiagnostics();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#23201E]"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <span className="font-semibold">
                  Mode: {diagnostics?.mode_label || (isLive ? "Live YouCam" : "Sandbox Demo")}
                </span>
              </div>
              <span className="text-[#C5A880] font-medium flex items-center">
                Diagnostics
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </button>

            <div className="flex items-center justify-between text-xs text-[#8C827A] px-2">
              <span>FastAPI Backend:</span>
              <span className="font-semibold text-[#23201E]">
                {backendHealthy ? "Connected (Port 8000)" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
