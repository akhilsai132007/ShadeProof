import React, { useState, useEffect } from "react";
import { Camera, Sparkles, CheckCircle2, ArrowRight, Palette, RefreshCw } from "lucide-react";

interface ShadeFinderProps {
  onGoToAbout: () => void;
}

interface DemoShade {
  id: number;
  brand: string;
  product_name: string;
  shade_name: string;
  shade_code: string;
  hex_color: string;
  undertone: string;
  depth_group: string;
  price: number;
  stock_status: string;
}

export const ShadeFinderPlaceholder: React.FC<ShadeFinderProps> = ({ onGoToAbout }) => {
  const [shades, setShades] = useState<DemoShade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShades();
  }, []);

  const fetchShades = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/shades");
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const data = await response.json();
      setShades(data);
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F7F3EC] border border-[#E8E2D9] text-xs font-semibold text-[#8C827A] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>YouCam API Hackathon 2026 Core Workflow</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif text-[#23201E] tracking-tight leading-[1.15]">
            Find your closest foundation match.{" "}
            <span className="italic font-normal text-[#9F8259]">
              See it before you buy it.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#59524B] max-w-2xl mx-auto font-light leading-relaxed">
            Eliminate online beauty uncertainty. ShadeProof analyzes your natural skin tone
            using verified YouCam Skin AI, ranks catalogue shades with CIEDE2000 color science,
            and lets you test candidates directly on your face.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => alert("Selfie upload and YouCam analysis integration will activate in Phase 3.")}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#23201E] text-white font-medium text-base hover:bg-[#383330] transition-all shadow-md flex items-center justify-center gap-3 group"
            >
              <Camera className="w-5 h-5 text-[#C5A880] group-hover:scale-110 transition-transform" />
              <span>Find My Shade (Phase 3)</span>
              <ArrowRight className="w-4 h-4 text-[#C5A880]" />
            </button>

            <button
              onClick={onGoToAbout}
              className="w-full sm:w-auto px-6 py-4 rounded-full bg-white border border-[#E8E2D9] text-[#23201E] font-medium text-base hover:bg-[#F7F3EC] transition-all"
            >
              How It Works
            </button>
          </div>
        </div>
      </section>

      {/* 4-Step Technical Workflow Pipeline */}
      <section className="bg-white border border-[#EFE8DC] rounded-3xl p-8 sm:p-12 shadow-sm">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-2xl font-serif font-bold text-[#23201E]">
            The ShadeProof Architectural Journey
          </h2>
          <p className="text-sm text-[#8C827A] mt-2">
            A transparent pipeline connecting computer vision, perceptual colorimetry, and AR rendering.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#EFE8DC] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#23201E] text-[#C5A880] flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-semibold text-[#23201E] text-base">Selfie Intake</h3>
            <p className="text-xs text-[#59524B] leading-relaxed">
              Upload or snap a natural selfie. Validated for lighting, resolution, and face angle strictness.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#EFE8DC] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#23201E] text-[#C5A880] flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-semibold text-[#23201E] text-base">YouCam Skin AI</h3>
            <p className="text-xs text-[#59524B] leading-relaxed">
              <code>POST /task/skin-tone-analysis</code> extracts ground-truth L*a*b* coordinates and undertone.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#EFE8DC] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#23201E] text-[#C5A880] flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-semibold text-[#23201E] text-base">Matching Engine</h3>
            <p className="text-xs text-[#59524B] leading-relaxed">
              Custom CIEDE2000 algorithm ranks catalogue candidates with undertone penalty matrix.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#EFE8DC] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#23201E] text-[#C5A880] flex items-center justify-center font-bold">
              4
            </div>
            <h3 className="font-semibold text-[#23201E] text-base">YouCam VTO</h3>
            <p className="text-xs text-[#59524B] leading-relaxed">
              <code>POST /task/makeup-vto</code> renders top 3 shades side-by-side on your actual face.
            </p>
          </div>
        </div>
      </section>

      {/* Live Backend & Seed Catalogue Verification */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#9F8259]" />
              <h2 className="text-xl font-bold font-serif text-[#23201E]">
                Active Foundation Catalogue (SQLAlchemy SQLite)
              </h2>
            </div>
            <p className="text-xs text-[#8C827A] mt-1">
              Sample calibrated shade inventory seeded in the local backend database.
            </p>
          </div>

          <button
            onClick={fetchShades}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E8E2D9] bg-white text-xs font-medium text-[#59524B] hover:bg-[#F7F3EC] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Reload Catalogue</span>
          </button>
        </div>

        {error ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            <div className="font-semibold">Backend Connection Notice:</div>
            <p className="mt-1 text-xs">
              {error}. Ensure the FastAPI server is running on <code>http://127.0.0.1:8000</code>.
            </p>
          </div>
        ) : loading ? (
          <div className="py-12 text-center text-sm text-[#8C827A]">
            Loading database shades...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {shades.map((shade) => (
              <div
                key={shade.id}
                className="bg-white rounded-2xl border border-[#EFE8DC] p-3.5 space-y-2.5 shadow-sm hover:shadow transition-shadow"
              >
                <div
                  className="w-full h-16 rounded-xl border border-black/10 shadow-inner relative"
                  style={{ backgroundColor: shade.hex_color }}
                >
                  <span className="absolute bottom-1 right-2 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-black/40 text-white backdrop-blur-sm">
                    {shade.hex_color}
                  </span>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-[#23201E] truncate">
                    {shade.shade_name}
                  </div>
                  <div className="text-[10px] text-[#8C827A] flex items-center justify-between mt-1">
                    <span>{shade.depth_group}</span>
                    <span className="font-semibold text-[#59524B]">{shade.undertone}</span>
                  </div>
                  <div className="text-[10px] text-[#8C827A] flex items-center justify-between mt-0.5">
                    <span>${shade.price.toFixed(2)}</span>
                    <span
                      className={`text-[9px] font-medium px-1.5 py-0.2 rounded-full ${
                        shade.stock_status === "in_stock"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {shade.stock_status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-[#8C827A] pt-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            {shades.length} shades loaded from <code>foundation_shades</code> SQLite database table.
          </span>
        </div>
      </section>
    </div>
  );
};
