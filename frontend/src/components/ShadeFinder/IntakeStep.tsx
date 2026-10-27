import React, { useState, useRef } from "react";
import {
  Camera,
  Upload,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Check,
  RefreshCw,
  SunMedium,
  Image as ImageIcon
} from "lucide-react";

interface IntakeStepProps {
  onAnalyze: (file: File, previewUrl: string, isDemoPortrait: boolean) => void;
  isLoading: boolean;
}

// Preset verified portrait fixtures for instant 1-click hackathon evaluation
const DEMO_PORTRAITS = [
  {
    id: "medium-warm",
    label: "Medium Warm",
    depth: "Medium",
    undertone: "Warm",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    description: "Even natural daylight, neutral expression",
  },
  {
    id: "fair-cool",
    label: "Fair Cool",
    depth: "Fair",
    undertone: "Cool",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
    description: "Diffused front lighting, rosy undertone",
  },
  {
    id: "deep-warm",
    label: "Deep Warm",
    depth: "Deep",
    undertone: "Warm",
    url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80",
    description: "Warm golden lighting, rich complexion",
  },
];

export const IntakeStep: React.FC<IntakeStepProps> = ({ onAnalyze, isLoading }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDemoPortrait, setIsDemoPortrait] = useState<boolean>(false);
  const [hasConsent, setHasConsent] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Camera capture state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrorMsg("Please upload a valid image file (JPG, PNG, or WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File size exceeds 10 MB. Please upload a smaller image.");
      return;
    }

    setSelectedFile(file);
    setIsDemoPortrait(false);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectDemoPortrait = async (demo: typeof DEMO_PORTRAITS[0]) => {
    setErrorMsg(null);
    setPreviewUrl(demo.url);
    setIsDemoPortrait(true);

    try {
      // Create a mock File object from the remote image URL
      const resp = await fetch(demo.url);
      const blob = await resp.blob();
      const file = new File([blob], `${demo.id}.jpg`, { type: "image/jpeg" });
      setSelectedFile(file);
    } catch {
      // Fallback dummy file
      const dummyFile = new File([new Uint8Array([0xff, 0xd8, 0xff])], `${demo.id}.jpg`, { type: "image/jpeg" });
      setSelectedFile(dummyFile);
    }
  };

  const startCamera = async () => {
    setErrorMsg(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setCameraActive(false);
      setErrorMsg("Could not access webcam. Please upload an image file instead.");
    }
  };

  const captureCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera_selfie.jpg", { type: "image/jpeg" });
          validateAndSetFile(file);
        }
      }, "image/jpeg", 0.95);
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleSubmit = () => {
    if (!selectedFile || !previewUrl) {
      setErrorMsg("Please select or capture a selfie first.");
      return;
    }
    if (!hasConsent) {
      setErrorMsg("Please acknowledge the data consent terms to proceed.");
      return;
    }
    onAnalyze(selectedFile, previewUrl, isDemoPortrait);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7F3EC] border border-[#E8E2D9] text-xs font-semibold text-[#8C827A] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>Step 1 of 4: Selfie Intake</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#23201E]">
          Upload or Capture Your Selfie
        </h1>
        <p className="text-sm text-[#59524B] max-w-xl mx-auto font-light">
          We evaluate skin tone, undertones, and lightness across thousands of calibrated color
          coordinates to recommend your exact foundation match.
        </p>
      </div>

      {/* Lighting Guidance Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#59524B]">
        <div className="p-3.5 rounded-2xl bg-white border border-[#EFE8DC] flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-[#F7F3EC] flex items-center justify-center shrink-0">
            <SunMedium className="w-4 h-4 text-[#C5A880]" />
          </div>
          <span>Natural, diffused daylight gives the most accurate undertone.</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-[#EFE8DC] flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-[#F7F3EC] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#C5A880]" />
          </div>
          <span>Look directly into the camera with a neutral face.</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-[#EFE8DC] flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-[#F7F3EC] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
          </div>
          <span>Avoid beauty filters, flash, or heavy colored backlights.</span>
        </div>
      </div>

      {/* Main Upload / Camera Box */}
      <div className="bg-white rounded-3xl border border-[#EFE8DC] p-6 sm:p-8 shadow-sm space-y-6">
        {cameraActive ? (
          <div className="space-y-4">
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-black max-w-md mx-auto">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={captureCamera}
                className="px-6 py-2.5 rounded-full bg-[#23201E] text-white font-medium text-sm flex items-center gap-2 hover:bg-[#383330]"
              >
                <Camera className="w-4 h-4 text-[#C5A880]" />
                <span>Take Snapshot</span>
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-5 py-2.5 rounded-full bg-[#F7F3EC] text-[#59524B] font-medium text-sm hover:bg-[#EFE8DC]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : previewUrl ? (
          <div className="space-y-6 text-center">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-3xl overflow-hidden shadow-md border-4 border-[#FDFBF7]">
              <img src={previewUrl} alt="Selfie Preview" className="w-full h-full object-cover" />
              {isDemoPortrait && (
                <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-sm">
                  Demo Portrait
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }}
                className="text-xs font-semibold text-[#8C827A] hover:text-[#23201E] underline decoration-[#C5A880] underline-offset-4 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace / Choose Another Photo</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-[#E8E2D9] rounded-2xl p-8 sm:p-12 text-center hover:border-[#C5A880] transition-colors bg-[#FDFBF7]/50"
          >
            <div className="w-14 h-14 rounded-full bg-[#F7F3EC] text-[#9F8259] flex items-center justify-center mx-auto mb-4">
              <Upload className="w-7 h-7" />
            </div>

            <h3 className="text-base font-semibold text-[#23201E]">
              Drag and drop your selfie here
            </h3>
            <p className="text-xs text-[#8C827A] mt-1 mb-6">
              Supports JPG, PNG, or WebP up to 10 MB.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#23201E] text-white text-xs font-medium hover:bg-[#383330] transition-all flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-4 h-4 text-[#C5A880]" />
                <span>Browse Photo</span>
              </button>

              <button
                type="button"
                onClick={startCamera}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-white border border-[#E8E2D9] text-[#23201E] text-xs font-medium hover:bg-[#F7F3EC] transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-[#8C827A]" />
                <span>Use Webcam</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Quick Demo Portraits Selector */}
        {!cameraActive && (
          <div className="pt-4 border-t border-[#EFE8DC]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8C827A]">
                Quick Test with Demo Portraits
              </span>
              <span className="text-[11px] text-[#A69C93]">1-Click Evaluation</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {DEMO_PORTRAITS.map((p) => {
                const isSelected = previewUrl === p.url;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectDemoPortrait(p)}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "border-[#23201E] bg-[#F7F3EC] ring-1 ring-[#23201E]"
                        : "border-[#EFE8DC] bg-white hover:border-[#C5A880]"
                    }`}
                  >
                    <div className="aspect-square rounded-xl overflow-hidden mb-2 relative">
                      <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#23201E]/20 flex items-center justify-center text-white">
                          <Check className="w-5 h-5 bg-[#23201E] rounded-full p-0.5" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-bold text-[#23201E]">{p.label}</div>
                    <div className="text-[10px] text-[#8C827A]">{p.undertone} undertone</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Error Message if any */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Data Privacy & Explicit Consent */}
      <div className="p-5 rounded-3xl bg-[#F7F3EC] border border-[#E8E2D9] space-y-3">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasConsent}
            onChange={(e) => setHasConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[#C5A880] text-[#23201E] focus:ring-[#C5A880]"
          />
          <div className="text-xs text-[#59524B] leading-relaxed">
            <span className="font-semibold text-[#23201E]">
              Participant Consent for Skin Analysis & Virtual Try-On
            </span>
            <p className="mt-1 text-[#8C827A]">
              I acknowledge that this image will be processed exclusively to calculate colorimetric
              coordinates and render foundation candidates via Perfect Corp’s YouCam S2S API.
              Images are retained for 24 hours on temporary cache and are never sold or used for model training.
            </p>
          </div>
        </label>
      </div>

      {/* Action Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!previewUrl || !hasConsent || isLoading}
          className={`w-full sm:w-auto px-10 py-4 rounded-full text-base font-semibold tracking-wide transition-all shadow-md flex items-center justify-center gap-3 mx-auto ${
            previewUrl && hasConsent && !isLoading
              ? "bg-[#23201E] text-white hover:bg-[#383330] hover:scale-[1.02]"
              : "bg-[#EFE8DC] text-[#A69C93] cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin text-[#C5A880]" />
              <span>Analyzing Complexion...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-[#C5A880]" />
              <span>Analyze Skin Tone & Undertone</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
