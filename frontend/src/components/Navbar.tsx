import React, { useState } from "react";
import { Sparkles, BarChart3, Info, Menu, X, ShieldCheck } from "lucide-react";

export type NavTab = "finder" | "merchant" | "about";

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  backendHealthy: boolean | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  backendHealthy,
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

  return (
    <header className="sticky top-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#EFE8DC]">
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
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

          {/* Backend Status Indicator & CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F7F3EC] border border-[#E8E2D9] text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealthy === true
                    ? "bg-emerald-500 animate-pulse"
                    : backendHealthy === false
                    ? "bg-rose-500"
                    : "bg-amber-400"
                }`}
              />
              <span className="text-[#59524B] font-medium">
                {backendHealthy === true
                  ? "API Online"
                  : backendHealthy === false
                  ? "API Offline"
                  : "Connecting..."}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-[#8C827A] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Hackathon 2026</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
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
          <div className="pt-2 border-t border-[#EFE8DC] flex items-center justify-between text-xs text-[#8C827A] px-2">
            <span>FastAPI Backend:</span>
            <span className="font-semibold text-[#23201E]">
              {backendHealthy ? "Connected (Port 8000)" : "Offline"}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
