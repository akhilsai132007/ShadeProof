import React, { useState } from "react";
import {
  Camera,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Layers,
  Check
} from "lucide-react";
import type { MatchCandidate, NormalizedVtoResult } from "../../services/api";

interface TryOnStepProps {
  originalPhotoUrl: string;
  activeShade: MatchCandidate;
  candidates: MatchCandidate[];
  vtoResult: NormalizedVtoResult;
  onSwitchCandidate: (shade: MatchCandidate) => void;
  onReRenderWithSettings: (colorIntensity: number, coverageIntensity: number, glowIntensity: number) => void;
  onRestart: () => void;
  isLoadingVto: boolean;
}

export const TryOnStep: React.FC<TryOnStepProps> = ({
  originalPhotoUrl,
  activeShade,
  candidates,
  vtoResult,
  onSwitchCandidate,
  onReRenderWithSettings,
  onRestart,
  isLoadingVto,
}) => {
  // View mode: 'side-by-side' or 'split-slider'
  const [viewMode, setViewMode] = useState<"side-by-side" | "single">("side-by-side");
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [cartSuccess, setCartSuccess] = useState<boolean>(false);

  // Settings
  const [coverageIntensity, setCoverageIntensity] = useState<number>(50);
  const [glowIntensity, setGlowIntensity] = useState<number>(10);
  const [colorIntensity, setColorIntensity] = useState<number>(50);

  const handleApplySettings = () => {
    onReRenderWithSettings(colorIntensity, coverageIntensity, glowIntensity);
  };

  const handleAddToCart = () => {
    setCartSuccess(true);
    setTimeout(() => setCartSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7F3EC] border border-[#E8E2D9] text-xs font-semibold text-[#8C827A] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>Step 4 of 4: Virtual Try-On</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#23201E]">
          See It On Your Face Before You Buy
        </h1>
        <p className="text-sm text-[#59524B] max-w-xl mx-auto font-light">
          Hyper-realistic foundation application rendered via Perfect Corp YouCam Makeup VTO.
        </p>
      </div>

      {/* Mode Banner */}
      {vtoResult.is_sandbox_mode ? (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Demo Mode:</strong> Virtual try-on preview rendered using verified YouCam S2S fixtures.
            </span>
          </div>
          <span className="font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px]">
            Demo Active
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong>Live YouCam AR Render:</strong> Successfully rendered via <code>/s2s/v2.0/task/makeup-vto</code>.
          </span>
        </div>
      )}

      {/* Active Shade Selector Bar */}
      <div className="bg-white p-4 rounded-3xl border border-[#EFE8DC] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl border border-black/10 shadow-inner shrink-0"
            style={{ backgroundColor: activeShade.hex_color }}
          />
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-[#8C827A]">
              Currently Trying On:
            </div>
            <div className="text-sm font-bold text-[#23201E]">
              {activeShade.shade_name} ({activeShade.shade_code})
            </div>
          </div>
        </div>

        {/* Quick candidate switcher buttons */}
        <div className="flex items-center gap-2">
          {candidates.map((cand) => {
            const isSelected = cand.shade_code === activeShade.shade_code;
            return (
              <button
                key={cand.shade_code}
                type="button"
                onClick={() => onSwitchCandidate(cand)}
                disabled={isLoadingVto}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#23201E] text-white shadow-xs"
                    : "bg-[#F7F3EC] text-[#59524B] hover:bg-[#EFE8DC]"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/20"
                  style={{ backgroundColor: cand.hex_color }}
                />
                <span>Rank #{cand.rank}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Try-On Comparison Viewer */}
      <div className="bg-white rounded-3xl border border-[#EFE8DC] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DC]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8C827A]">
            Visual Face Comparison
          </span>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("side-by-side")}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                viewMode === "side-by-side"
                  ? "bg-[#23201E] text-white"
                  : "bg-[#F7F3EC] text-[#59524B]"
              }`}
            >
              Side-by-Side
            </button>
            <button
              type="button"
              onClick={() => setViewMode("single")}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                viewMode === "single"
                  ? "bg-[#23201E] text-white"
                  : "bg-[#F7F3EC] text-[#59524B]"
              }`}
            >
              Split View
            </button>
          </div>
        </div>

        {/* Images Display */}
        {isLoadingVto ? (
          <div className="py-20 text-center space-y-3">
            <Camera className="w-8 h-8 animate-pulse text-[#C5A880] mx-auto" />
            <div className="text-sm font-semibold text-[#23201E]">
              Rendering {activeShade.shade_name} with YouCam VTO...
            </div>
            <div className="text-xs text-[#8C827A]">
              Applying pigment opacity, skin texture blending, and dewy finish.
            </div>
          </div>
        ) : viewMode === "side-by-side" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Original Selfie */}
            <div className="space-y-2">
              <div className="relative aspect-4/5 rounded-2xl overflow-hidden shadow-sm border border-[#EFE8DC] bg-stone-100">
                <img
                  src={originalPhotoUrl}
                  alt="Original Selfie"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 text-white text-[11px] font-medium backdrop-blur-sm">
                  Original Selfie
                </span>
              </div>
              <div className="text-center text-xs text-[#8C827A]">Natural un-makeup base</div>
            </div>

            {/* VTO Rendered Image */}
            <div className="space-y-2">
              <div className="relative aspect-4/5 rounded-2xl overflow-hidden shadow-sm border-2 border-[#23201E] bg-stone-100">
                <img
                  src={vtoResult.result_image_url}
                  alt="YouCam VTO Render"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#23201E] text-[#C5A880] text-[11px] font-bold flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3 text-[#C5A880]" />
                  <span>{activeShade.shade_name}</span>
                </span>
                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/60 text-white font-mono text-[10px]">
                  ΔE₀₀ = {activeShade.delta_e00.toFixed(2)}
                </span>
              </div>
              <div className="text-center text-xs font-semibold text-[#23201E]">
                Rendered with YouCam Makeup VTO
              </div>
            </div>
          </div>
        ) : (
          /* Interactive Split View */
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="relative aspect-4/5 rounded-2xl overflow-hidden shadow-md border-2 border-[#23201E]">
              {/* Rendered image as background */}
              <img
                src={vtoResult.result_image_url}
                alt="Rendered Shade"
                className="w-full h-full object-cover absolute inset-0"
              />
              {/* Original image clipped on the left */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={originalPhotoUrl}
                  alt="Original"
                  className="w-full h-full object-cover max-w-none"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>

              {/* Split Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              />

              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] backdrop-blur-sm pointer-events-none">
                Original
              </span>
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#23201E] text-[#C5A880] text-[10px] font-bold shadow-sm pointer-events-none">
                {activeShade.shade_code}
              </span>
            </div>

            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="w-full accent-[#23201E]"
              />
              <div className="flex justify-between text-[11px] text-[#8C827A]">
                <span>← Original Skin</span>
                <span>Drag to Compare</span>
                <span>Applied Foundation →</span>
              </div>
            </div>
          </div>
        )}

        {/* Customizable Makeup VTO Parameters Accordion */}
        <div className="pt-6 border-t border-[#EFE8DC] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#23201E]">
              <Sliders className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Fine-Tune Foundation VTO Parameters</span>
            </div>
            <button
              type="button"
              onClick={handleApplySettings}
              disabled={isLoadingVto}
              className="text-xs font-bold text-[#23201E] hover:underline decoration-[#C5A880]"
            >
              Re-Render
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5 p-3 rounded-2xl bg-[#FDFBF7] border border-[#EFE8DC]">
              <div className="flex justify-between">
                <span className="text-[#59524B]">Pigment Strength</span>
                <span className="font-mono font-bold text-[#23201E]">{colorIntensity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={colorIntensity}
                onChange={(e) => setColorIntensity(Number(e.target.value))}
                className="w-full accent-[#23201E]"
              />
              <div className="flex justify-between text-[10px] text-[#8C827A]">
                <span>Natural</span>
                <span>Vibrant</span>
              </div>
            </div>

            <div className="space-y-1.5 p-3 rounded-2xl bg-[#FDFBF7] border border-[#EFE8DC]">
              <div className="flex justify-between">
                <span className="text-[#59524B]">Coverage Opacity</span>
                <span className="font-mono font-bold text-[#23201E]">{coverageIntensity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={coverageIntensity}
                onChange={(e) => setCoverageIntensity(Number(e.target.value))}
                className="w-full accent-[#23201E]"
              />
              <div className="flex justify-between text-[10px] text-[#8C827A]">
                <span>Sheer</span>
                <span>Full Coverage</span>
              </div>
            </div>

            <div className="space-y-1.5 p-3 rounded-2xl bg-[#FDFBF7] border border-[#EFE8DC]">
              <div className="flex justify-between">
                <span className="text-[#59524B]">Glow / Radiant Finish</span>
                <span className="font-mono font-bold text-[#23201E]">{glowIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={glowIntensity}
                onChange={(e) => setGlowIntensity(Number(e.target.value))}
                className="w-full accent-[#23201E]"
              />
              <div className="flex justify-between text-[10px] text-[#8C827A]">
                <span>Matte Finish</span>
                <span>Dewy / Luminous</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* eCommerce Conversion Card */}
      <div className="bg-[#23201E] text-white p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-[11px] uppercase tracking-wider text-[#C5A880] font-semibold">
            Ready to checkout?
          </div>
          <div className="text-xl font-serif font-bold text-white">
            {activeShade.brand} — {activeShade.shade_name}
          </div>
          <div className="text-xs text-[#A69C93]">
            {activeShade.depth_group} Tone • {activeShade.undertone} Undertone • Free Express Shipping
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#C5A880] text-[#23201E] font-bold text-sm hover:bg-[#E5D4BE] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {cartSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-900" />
                <span>Added to Bag!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag — $42.00</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Reset & Restart Button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onRestart}
          className="px-6 py-2.5 rounded-full bg-white border border-[#E8E2D9] text-[#59524B] text-xs font-semibold hover:bg-[#F7F3EC] hover:text-[#23201E] transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>Start Over with a New Selfie</span>
        </button>
      </div>
    </div>
  );
};
