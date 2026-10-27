import React from "react";
import {
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  ArrowLeft,
  CheckCircle2,
  Info
} from "lucide-react";
import type { NormalizedSkinAnalysis } from "../../services/api";

interface AnalysisResultsStepProps {
  analysis: NormalizedSkinAnalysis;
  previewUrl: string;
  onProceedToMatches: () => void;
  onRetake: () => void;
  isLoadingMatches: boolean;
}

export const AnalysisResultsStep: React.FC<AnalysisResultsStepProps> = ({
  analysis,
  previewUrl,
  onProceedToMatches,
  onRetake,
  isLoadingMatches,
}) => {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7F3EC] border border-[#E8E2D9] text-xs font-semibold text-[#8C827A] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>Step 2 of 4: Skin Diagnostics</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#23201E]">
          Your Skin Tone Profile
        </h1>
        <p className="text-sm text-[#59524B] max-w-xl mx-auto font-light">
          Extracted directly from YouCam’s deep-learning color calibration engine.
        </p>
      </div>

      {/* Mode Banner */}
      {analysis.is_sandbox_mode ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Sandbox Evaluation Mode:</strong> Running on verified YouCam response fixtures
              (API key unconfigured in .env).
            </span>
          </div>
          <span className="font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
            Demo Active
          </span>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong>Verified Live YouCam S2S API:</strong> Processed on Perfect Corp servers.
          </span>
        </div>
      )}

      {/* Main Analysis Card */}
      <div className="bg-white rounded-3xl border border-[#EFE8DC] p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* User Selfie with Localized Color Pipette */}
          <div className="space-y-4 text-center md:text-left">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-3xl overflow-hidden shadow-md border-4 border-[#FDFBF7]">
              <img src={previewUrl} alt="Analyzed Selfie" className="w-full h-full object-cover" />
              {/* Swatch Overlap Badge */}
              <div
                className="absolute bottom-3 right-3 w-12 h-12 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center"
                style={{ backgroundColor: analysis.hex_color }}
                title={`Detected Hex: ${analysis.hex_color}`}
              />
            </div>
            <div className="text-center text-xs text-[#8C827A]">
              Facial chromatic baseline: <span className="font-mono font-bold text-[#23201E]">{analysis.hex_color}</span>
            </div>
          </div>

          {/* Diagnostic Metrics Matrix */}
          <div className="space-y-4">
            {/* Tone Depth */}
            <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#EFE8DC] flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#8C827A] font-medium">
                  Depth Level
                </span>
                <div className="text-xl font-bold font-serif text-[#23201E]">
                  {analysis.skin_tone_level}
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#EFE8DC] font-semibold text-[#59524B]">
                ITA: {analysis.ita_angle}°
              </span>
            </div>

            {/* Undertone */}
            <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#EFE8DC] flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#8C827A] font-medium">
                  Undertone
                </span>
                <div className="text-xl font-bold font-serif text-[#23201E]">
                  {analysis.undertone}
                </div>
              </div>
              <div
                className="w-7 h-7 rounded-full border border-black/10 shadow-xs"
                style={{ backgroundColor: analysis.hex_color }}
              />
            </div>

            {/* Calibrated CIELAB Values */}
            <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#EFE8DC] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#8C827A]">
                <span className="font-semibold uppercase tracking-wider">CIE L*a*b* Coordinates</span>
                <span className="text-[10px]">CIE D65 Standard</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-white border border-[#EFE8DC]">
                  <div className="text-[10px] text-[#8C827A]">L* (Lightness)</div>
                  <div className="font-mono font-bold text-[#23201E]">{analysis.lab_l.toFixed(1)}</div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#EFE8DC]">
                  <div className="text-[10px] text-[#8C827A]">a* (Green-Red)</div>
                  <div className="font-mono font-bold text-[#23201E]">{analysis.lab_a.toFixed(1)}</div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#EFE8DC]">
                  <div className="text-[10px] text-[#8C827A]">b* (Blue-Yellow)</div>
                  <div className="font-mono font-bold text-[#23201E]">{analysis.lab_b.toFixed(1)}</div>
                </div>
              </div>
            </div>

            {/* Detection Quality */}
            <div className="flex items-center justify-between text-xs text-[#8C827A] px-1">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Face Detection: Verified</span>
              </div>
              <span>Confidence: {(analysis.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Clinical Transparency Footnote */}
        <div className="mt-8 pt-4 border-t border-[#EFE8DC] flex items-start gap-2 text-[11px] text-[#8C827A] leading-relaxed">
          <Info className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
          <span>
            <strong>Scientific Transparency:</strong> Tone depth is evaluated strictly on colorimetric
            lightness (L*). Fitzpatrick phototype is a clinical classification of UV burn/tan response and
            cannot be medically diagnosed from color alone.
          </span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onRetake}
          className="w-full sm:w-auto px-6 py-3 rounded-full bg-white border border-[#E8E2D9] text-[#23201E] text-sm font-medium hover:bg-[#F7F3EC] transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4 text-[#8C827A]" />
          <span>Retake / Choose Another</span>
        </button>

        <button
          type="button"
          onClick={onProceedToMatches}
          disabled={isLoadingMatches}
          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#23201E] text-white text-sm font-semibold hover:bg-[#383330] transition-all shadow-md flex items-center justify-center gap-2"
        >
          <span>Find Best Foundation Matches</span>
          <ArrowRight className="w-4 h-4 text-[#C5A880]" />
        </button>
      </div>
    </div>
  );
};
