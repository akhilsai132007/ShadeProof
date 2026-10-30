import React, { useEffect, useState } from "react";
import {
  X,
  Zap,
  FlaskConical,
  ShieldCheck,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCode,
  Terminal,
  Lock,
} from "lucide-react";
import type { DiagnosticsResponse } from "../services/api";

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostics: DiagnosticsResponse | null;
  loading: boolean;
  error: string | null;
  onRefreshConnectivity: () => Promise<void>;
  isRefreshingConnectivity: boolean;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  diagnostics,
  loading,
  error,
  onRefreshConnectivity,
  isRefreshingConnectivity,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "setup" | "endpoints">("overview");

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isLive = diagnostics?.mode === "live";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23201E]/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="diagnostics-modal-title"
    >
      <div
        className="relative w-full max-w-2xl bg-[#FDFBF7] rounded-2xl shadow-2xl border border-[#EFE8DC] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFE8DC] bg-white">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                isLive
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-900"
              }`}
            >
              {isLive ? (
                <Zap className="w-5 h-5 text-emerald-600 fill-emerald-100" />
              ) : (
                <FlaskConical className="w-5 h-5 text-amber-700" />
              )}
            </div>
            <div>
              <h2
                id="diagnostics-modal-title"
                className="text-lg font-serif font-bold text-[#23201E]"
              >
                System & API Diagnostics
              </h2>
              <p className="text-xs text-[#8C827A]">
                Hackathon judge transparency & execution verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8C827A] hover:text-[#23201E] hover:bg-[#F2ECE1] rounded-full transition-colors"
            aria-label="Close diagnostics dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#EFE8DC] bg-[#FAF7F2] px-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "overview"
                ? "border-[#C5A880] text-[#23201E] font-semibold"
                : "border-transparent text-[#8C827A] hover:text-[#23201E]"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Execution Mode & Status
          </button>
          <button
            onClick={() => setActiveTab("setup")}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "setup"
                ? "border-[#C5A880] text-[#23201E] font-semibold"
                : "border-transparent text-[#8C827A] hover:text-[#23201E]"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Live Mode Configuration
          </button>
          <button
            onClick={() => setActiveTab("endpoints")}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "endpoints"
                ? "border-[#C5A880] text-[#23201E] font-semibold"
                : "border-transparent text-[#8C827A] hover:text-[#23201E]"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Documented Endpoints
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[#59524B]">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw className="w-8 h-8 text-[#C5A880] animate-spin" />
              <p className="text-sm font-medium text-[#23201E]">
                Querying backend diagnostics...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Backend Connection Error
              </div>
              <p className="text-xs text-rose-700">
                Could not connect to the ShadeProof FastAPI backend (
                <code>http://127.0.0.1:8000</code>). Ensure the backend server
                is running:
              </p>
              <pre className="p-2.5 rounded-lg bg-white border border-rose-200 font-mono text-[11px] text-rose-900 overflow-x-auto">
                uvicorn app.main:app --reload --port 8000
              </pre>
            </div>
          )}

          {!loading && !error && diagnostics && (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  {/* Active Execution Mode Card */}
                  <div
                    className={`p-5 rounded-2xl border ${
                      isLive
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                        : "bg-amber-50/80 border-amber-300/80 text-amber-950"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              isLive
                                ? "bg-emerald-500 animate-pulse"
                                : "bg-amber-500"
                            }`}
                          />
                          <span className="text-xs uppercase tracking-wider font-bold">
                            {isLive ? "Live Production Mode" : "Evaluation Mode"}
                          </span>
                        </div>
                        <h3 className="text-lg font-serif font-bold mt-1 text-[#23201E]">
                          {diagnostics.mode_label}
                        </h3>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isLive
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100 text-amber-900 border border-amber-200"
                        }`}
                      >
                        {isLive ? "Credentials Active" : "Demo Fixtures Active"}
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-[#59524B]">
                      {isLive
                        ? "Selfie images are uploaded to YouCam S2S storage, skin tone analysis executes on Perfect Corp's AI cloud, and foundation VTO is rendered by the official API."
                        : "Analysis and try-on outputs use verified, deterministic demo fixtures calibrated for judging and testing. No API credits or external network latency are incurred."}
                    </p>
                  </div>

                  {/* Sandbox Disclaimers & Guarantees (When in sandbox mode) */}
                  {!isLive && (
                    <div className="p-4 rounded-xl bg-white border border-[#E8E2D9] space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#23201E]">
                        <FlaskConical className="w-4 h-4 text-[#C5A880]" />
                        <span>What Sandbox Demo Mode Means for Judges:</span>
                      </div>
                      <ul className="text-xs text-[#59524B] space-y-1.5 pl-5 list-disc marker:text-[#C5A880]">
                        <li>
                          <strong>Skin Tone Analysis:</strong> Returns real
                          dermatological CIELAB and Individual Typology Angle
                          (ITA) coordinates calibrated across diverse demo
                          portraits.
                        </li>
                        <li>
                          <strong>Matching Engine:</strong> The mathematical
                          CIEDE2000 algorithm and undertone compatibility
                          scoring run <strong>for real</strong> against our
                          24-shade SQLite catalogue.
                        </li>
                        <li>
                          <strong>Virtual Try-On:</strong> Displays sample
                          photorealistic foundation simulations without
                          consuming YouCam API credits.
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* API Gateway & Connectivity Card */}
                  <div className="p-4 rounded-xl bg-white border border-[#E8E2D9] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-[#8C827A]" />
                        <span className="text-xs font-semibold text-[#23201E]">
                          YouCam API Gateway Host
                        </span>
                      </div>
                      <button
                        onClick={onRefreshConnectivity}
                        disabled={isRefreshingConnectivity}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[#59524B] hover:text-[#23201E] hover:bg-[#F2ECE1] border border-[#E8E2D9] transition-colors disabled:opacity-50"
                        title="Probe gateway reachability"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            isRefreshingConnectivity ? "animate-spin text-[#C5A880]" : ""
                          }`}
                        />
                        <span>
                          {isRefreshingConnectivity ? "Checking..." : "Test Connection"}
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#EFE8DC]">
                        <span className="text-[10px] uppercase tracking-wider text-[#8C827A] font-semibold block">
                          Base Endpoint
                        </span>
                        <code className="text-[#23201E] font-mono break-all text-[11px]">
                          {diagnostics.base_url}
                        </code>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#EFE8DC]">
                        <span className="text-[10px] uppercase tracking-wider text-[#8C827A] font-semibold block">
                          Credential Status
                        </span>
                        <span className="font-medium text-[#23201E] flex items-center gap-1 mt-0.5">
                          {diagnostics.has_api_key ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Configured Server-Side</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Not Configured (Demo Mode)</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Connectivity probe message */}
                    <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#EFE8DC] text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[#23201E]">
                          Gateway Response:
                        </span>
                        {diagnostics.connectivity.latency_ms && (
                          <span className="text-[11px] text-[#8C827A] font-mono">
                            {diagnostics.connectivity.latency_ms} ms
                          </span>
                        )}
                      </div>
                      <p className="text-[#59524B] leading-relaxed">
                        {diagnostics.connectivity.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SETUP GUIDE */}
              {activeTab === "setup" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-xs">
                      <Terminal className="w-4 h-4 text-amber-700" />
                      <span>How to Enable Live YouCam S2S Mode</span>
                    </div>
                    <p className="text-xs leading-relaxed text-[#59524B]">
                      ShadeProof is architected to seamlessly transition between
                      sandbox evaluation fixtures and live YouCam API calls by
                      adding your hackathon API credentials into the backend
                      environment file.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#23201E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </span>
                      <div className="space-y-1">
                        <p className="font-semibold text-[#23201E]">
                          Open <code>backend/.env</code> in your editor
                        </p>
                        <p className="text-[#8C827A]">
                          Located in <code>{diagnostics.setup_guide.target_file}</code>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#23201E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </span>
                      <div className="space-y-1">
                        <p className="font-semibold text-[#23201E]">
                          Set your Perfect Corp YouCam API key
                        </p>
                        <pre className="p-2.5 rounded-lg bg-[#23201E] text-[#FDFBF7] font-mono text-[11px] overflow-x-auto">
                          YOUCAM_API_KEY=your_api_key_here
                        </pre>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#23201E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        3
                      </span>
                      <div className="space-y-1">
                        <p className="font-semibold text-[#23201E]">
                          Restart the backend service
                        </p>
                        <pre className="p-2.5 rounded-lg bg-[#23201E] text-[#FDFBF7] font-mono text-[11px] overflow-x-auto">
                          python -m uvicorn app.main:app --reload --port 8000
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#E8E2D9] flex items-start gap-2.5 text-xs">
                    <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-semibold text-[#23201E] block">
                        Strict Zero-Exposure Security Policy
                      </span>
                      <p className="text-[#59524B] leading-relaxed">
                        {diagnostics.setup_guide.security_guarantee}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ENDPOINTS */}
              {activeTab === "endpoints" && (
                <div className="space-y-3">
                  <p className="text-xs text-[#8C827A]">
                    ShadeProof integrates with the verified Perfect Corp YouCam
                    S2S v2.0 REST API suite:
                  </p>

                  <div className="space-y-2">
                    {diagnostics.supported_endpoints.map((ep, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white border border-[#E8E2D9] space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#23201E]">
                            {ep.name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FAF7F2] text-[#8C827A] border border-[#EFE8DC]">
                            {ep.method}
                          </span>
                        </div>
                        <code className="text-[11px] font-mono text-[#9F8259] block">
                          {ep.path}
                        </code>
                        <p className="text-[#8C827A] text-[11px]">{ep.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#EFE8DC] bg-white flex items-center justify-between text-xs text-[#8C827A]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
            <span>YouCam Skin AI Hackathon 2026</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#23201E] text-white font-medium hover:bg-[#3A3532] transition-colors"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
