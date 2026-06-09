import { useState, useRef, useCallback } from "react";

const FRAME_OPTIONS = {
  colors: [
    { value: "#1a1a1a", name: "Ebony" },
    { value: "#4a3728", name: "Walnut" },
    { value: "#8b4513", name: "Mahogany" },
    { value: "#d2b48c", name: "Birch" },
    { value: "#c0c0c0", name: "Silver" },
    { value: "#d4af37", name: "Gold" },
    { value: "#ffffff", name: "White" },
    { value: "#2c2c2c", name: "Matte Black" },
  ],
  matteColors: [
    { value: "#faf9f7", name: "Warm White" },
    { value: "#ffffff", name: "Bright White" },
    { value: "#f0ede8", name: "Cream" },
    { value: "#e8e4df", name: "Linen" },
    { value: "#d0cdc8", name: "Warm Gray" },
    { value: "#1a1a1a", name: "Black" },
  ],
};

const DEFAULT_FRAME = {
  frameColor: "#1a1a1a",
  frameColorName: "Ebony",
  frameWidth: 1,
  hasMatte: true,
  matteColor: "#faf9f7",
  matteColorName: "Warm White",
  matteWidth: 1.5,
};

function ColorSwatch({ color, selected, onClick, label }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: 28, height: 28, borderRadius: "50%", background: color,
        border: selected ? "3px solid #8b7355" : "2px solid rgba(0,0,0,0.12)",
        cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease",
        boxShadow: selected ? "0 0 0 2px white, 0 0 0 4px #8b7355" : "0 1px 3px rgba(0,0,0,0.2)",
        transform: selected ? "scale(1.15)" : "scale(1)", flexShrink: 0,
      }}
    />
  );
}

function ArtworkPreview({ imageSrc, frame }) {
  const { frameColor, frameWidth, hasMatte, matteColor, matteWidth } = frame;
  const framePx = frameWidth * 18;
  const mattePx = hasMatte ? matteWidth * 18 : 0;
  return (
    <div style={{
      display: "inline-flex", background: frameColor, padding: framePx,
      boxShadow: "0 20px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)", position: "relative",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)",
        pointerEvents: "none",
      }} />
      <div style={{ background: hasMatte ? matteColor : "transparent", padding: mattePx, transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        <img src={imageSrc} alt="Artwork" style={{ display: "block", maxWidth: 320, maxHeight: 320, objectFit: "contain" }} />
      </div>
    </div>
  );
}

export default function FrameSuggester() {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMime, setImageMime] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReasoning, setAiReasoning] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);
  const [frame, setFrame] = useState(DEFAULT_FRAME);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const img = new Image();
    img.onload = () => {
      const MAX = 800;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      const resized = canvas.toDataURL("image/jpeg", 0.8);
      const base64 = resized.split(",")[1];
      setImageSrc(resized);
      setImageBase64(base64);
      setImageMime("image/jpeg");
      setAiReasoning(null);
      setErrorDetail(null);
      analyzeArtwork(base64, "image/jpeg");
    };
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.readAsDataURL(file);
  }, []);

  async function analyzeArtwork(base64, mime) {
    setIsAnalyzing(true);
    setErrorDetail(null);
    setAiReasoning(null);

    try {
      const payload = {
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mime, data: base64 } },
              {
                type: "text",
                text: `You are an expert art framer. Analyze this artwork and recommend a frame and matte.

Reply with ONLY a JSON object, nothing else:
{
  "frameColor": "<hex>",
  "frameColorName": "<name>",
  "frameWidth": <0.5 to 3>,
  "hasMatte": <true or false>,
  "matteColor": "<hex>",
  "matteColorName": "<name>",
  "matteWidth": <0.5 to 2.5>,
  "reasoning": "<one sentence>"
}

Frame options: #1a1a1a=Ebony, #4a3728=Walnut, #8b4513=Mahogany, #d2b48c=Birch, #c0c0c0=Silver, #d4af37=Gold, #ffffff=White, #2c2c2c=Matte Black
Matte options: #faf9f7=Warm White, #ffffff=Bright White, #f0ede8=Cream, #e8e4df=Linen, #d0cdc8=Warm Gray, #1a1a1a=Black`,
              },
            ],
          },
        ],
      };

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const msg = data.error?.message || data.error || `HTTP ${response.status}`;
        throw new Error(`API: ${msg}`);
      }

      const textBlock = data.content?.find((b) => b.type === "text");
      if (!textBlock?.text) throw new Error(`No text in response: ${JSON.stringify(data).slice(0, 200)}`);

      const raw = textBlock.text.trim().replace(/^```json\s*/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();

      let suggestion;
      try {
        suggestion = JSON.parse(raw);
      } catch {
        throw new Error(`JSON parse failed. Got: "${raw.slice(0, 150)}"`);
      }

      setFrame({
        frameColor: suggestion.frameColor || DEFAULT_FRAME.frameColor,
        frameColorName: suggestion.frameColorName || "Custom",
        frameWidth: suggestion.frameWidth || DEFAULT_FRAME.frameWidth,
        hasMatte: suggestion.hasMatte ?? DEFAULT_FRAME.hasMatte,
        matteColor: suggestion.matteColor || DEFAULT_FRAME.matteColor,
        matteColorName: suggestion.matteColorName || "Custom",
        matteWidth: suggestion.matteWidth || DEFAULT_FRAME.matteWidth,
      });
      setAiReasoning(suggestion.reasoning || "Frame applied.");

    } catch (err) {
      console.error("Frame error:", err);
      setErrorDetail(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f4f0eb", fontFamily: "'Georgia', serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px" }}>
      
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.25em", color: "#8b7355", textTransform: "uppercase", marginBottom: 12, fontStyle: "italic" }}>Wallspace</div>
        <h1 style={{ fontSize: 32, fontWeight: "normal", color: "#2c2418", margin: 0 }}>AI Frame Advisor</h1>
        <p style={{ color: "#7a6e62", marginTop: 10, fontSize: 15, lineHeight: 1.6, maxWidth: 400 }}>
          Upload your artwork and Claude will recommend the perfect frame and matte.
        </p>
      </div>

      <div style={{ display: "flex", gap: 48, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 900 }}>

        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
          {!imageSrc ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              style={{
                width: 340, height: 340, border: `2px dashed ${isDragging ? "#8b7355" : "#c8b89a"}`,
                borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", cursor: "pointer",
                background: isDragging ? "rgba(139,115,85,0.06)" : "#faf8f5",
                transition: "all 0.2s ease", gap: 12,
              }}
            >
              <div style={{ fontSize: 36, opacity: 0.4 }}>🖼</div>
              <div style={{ color: "#8b7355", fontSize: 14, textAlign: "center", lineHeight: 1.5 }}>
                Drop artwork here<br /><span style={{ fontSize: 12, color: "#b0a090" }}>or click to browse</span>
              </div>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              {isAnalyzing && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(244,240,235,0.85)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  zIndex: 10, gap: 12, backdropFilter: "blur(2px)",
                }}>
                  <div style={{ width: 28, height: 28, border: "2px solid #d4c4a8", borderTopColor: "#8b7355", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <div style={{ color: "#8b7355", fontSize: 13, fontStyle: "italic" }}>Analyzing artwork…</div>
                </div>
              )}
              <ArtworkPreview imageSrc={imageSrc} frame={frame} />
            </div>
          )}

          {imageSrc && (
            <button onClick={() => fileRef.current?.click()} style={{
              background: "none", border: "1px solid #c8b89a", color: "#8b7355",
              padding: "8px 20px", borderRadius: 2, cursor: "pointer",
              fontSize: 13, fontFamily: "Georgia, serif", letterSpacing: "0.05em",
            }}>
              Upload different artwork
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
        </div>

        {/* Right */}
        {imageSrc && (
          <div style={{ width: 280, display: "flex", flexDirection: "column", gap: 28 }}>

            {aiReasoning && (
              <div style={{ background: "#fffef9", border: "1px solid #e8dfd0", borderLeft: "3px solid #8b7355", padding: "14px 16px", borderRadius: 2 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#8b7355", textTransform: "uppercase", marginBottom: 8 }}>AI Recommendation</div>
                <p style={{ fontSize: 13, color: "#4a3f35", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>{aiReasoning}</p>
              </div>
            )}

            {errorDetail && (
              <div style={{ background: "#fff8f8", border: "1px solid #e8d0d0", borderLeft: "3px solid #c0392b", padding: "14px 16px", borderRadius: 2 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#c0392b", textTransform: "uppercase", marginBottom: 8 }}>Error — adjust manually</div>
                <p style={{ fontSize: 11, color: "#7a3030", lineHeight: 1.6, margin: 0, fontFamily: "monospace", wordBreak: "break-all" }}>{errorDetail}</p>
              </div>
            )}

            {/* Frame */}
            <div>
              <label style={{ fontSize: 11, letterSpacing: "0.2em", color: "#8b7355", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                Frame — {frame.frameColorName}
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {FRAME_OPTIONS.colors.map((c) => (
                  <ColorSwatch key={c.value} color={c.value} label={c.name} selected={frame.frameColor === c.value}
                    onClick={() => setFrame((f) => ({ ...f, frameColor: c.value, frameColorName: c.name }))} />
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: "#7a6e62", marginBottom: 6 }}>Width: {frame.frameWidth.toFixed(1)}"</div>
                <input type="range" min="0.5" max="3" step="0.25" value={frame.frameWidth}
                  onChange={(e) => setFrame((f) => ({ ...f, frameWidth: parseFloat(e.target.value) }))}
                  style={{ width: "100%", accentColor: "#8b7355" }} />
              </div>
            </div>

            {/* Matte */}
            <div>
              <label style={{ fontSize: 11, letterSpacing: "0.2em", color: "#8b7355", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                Matte
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 14 }}>
                <input type="checkbox" checked={frame.hasMatte} onChange={(e) => setFrame((f) => ({ ...f, hasMatte: e.target.checked }))}
                  style={{ accentColor: "#8b7355", width: 14, height: 14 }} />
                <span style={{ fontSize: 13, color: "#4a3f35" }}>{frame.hasMatte ? frame.matteColorName : "No matte"}</span>
              </label>
              {frame.hasMatte && (
                <>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                    {FRAME_OPTIONS.matteColors.map((c) => (
                      <ColorSwatch key={c.value} color={c.value} label={c.name} selected={frame.matteColor === c.value}
                        onClick={() => setFrame((f) => ({ ...f, matteColor: c.value, matteColorName: c.name }))} />
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#7a6e62", marginBottom: 6 }}>Width: {frame.matteWidth.toFixed(1)}"</div>
                    <input type="range" min="0.5" max="2.5" step="0.25" value={frame.matteWidth}
                      onChange={(e) => setFrame((f) => ({ ...f, matteWidth: parseFloat(e.target.value) }))}
                      style={{ width: "100%", accentColor: "#8b7355" }} />
                  </div>
                </>
              )}
            </div>

            {imageBase64 && (
              <button onClick={() => analyzeArtwork(imageBase64, imageMime)} disabled={isAnalyzing}
                style={{
                  background: isAnalyzing ? "#d4c4a8" : "#8b7355", color: "white",
                  border: "none", padding: "11px 20px", borderRadius: 2,
                  cursor: isAnalyzing ? "default" : "pointer",
                  fontSize: 12, letterSpacing: "0.1em", fontFamily: "Georgia, serif",
                }}>
                {isAnalyzing ? "Analyzing…" : "Re-analyze artwork"}
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=range] { -webkit-appearance: none; height: 3px; background: #d4c4a8; border-radius: 2px; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #8b7355; cursor: pointer; }
      `}</style>
    </div>
  );
}
