import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Download, RefreshCw } from 'lucide-react';

const AppIconGenerator: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateIcon = async () => {
    setLoading(true);
    try {
      // Try high-quality model first
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // We don't force it here, just try with what we have first
      }

      const apiKey = process.env.GEMINI_API_KEY || (process.env as any).API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: {
            parts: [{ text: "A vibrant and modern app icon for 'Doa Harian Modern'. Minimalist, elegant, crescent moon, Islamic pattern, emerald green and gold. 1K resolution." }],
          },
          config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } },
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setImage(`data:image/png;base64,${part.inlineData.data}`);
            return;
          }
        }
      } catch (innerError: any) {
        console.warn("High-quality model failed, falling back to standard model:", innerError);
        // Fallback to standard model which usually works with environment key
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: "A vibrant and modern app icon for 'Doa Harian Modern'. Minimalist, elegant, crescent moon, Islamic pattern, emerald green and gold." }],
          },
        });

        for (const part of fallbackResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            setImage(`data:image/png;base64,${part.inlineData.data}`);
            return;
          }
        }
      }
    } catch (error: any) {
      console.error("Error generating icon:", error);
      const errorMessage = error?.message || "";
      
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("403")) {
        alert("Akses ditolak untuk model kualitas tinggi. Silakan pilih API Key dari project Google Cloud dengan penagihan aktif, atau coba lagi.");
        await (window as any).aistudio.openSelectKey();
      } else {
        alert("Terjadi kesalahan saat membuat ikon. Silakan coba lagi nanti.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">App Icon Generator</h2>
        <p className="text-sm text-gray-500 italic">Generate a modern identity for your app</p>
      </div>

      <div className="aspect-square w-full bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
        {image ? (
          <img src={image} alt="Generated App Icon" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-6">
            <Sparkles className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Click generate to create your icon</p>
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Generating...</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-3">
        <p className="text-[10px] text-center text-gray-400 mb-2">
          Memerlukan API Key dengan penagihan aktif. 
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-emerald-600 ml-1 underline">Info Billing</a>
        </p>
        <button
          onClick={generateIcon}
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-100"
        >
          {image ? <RefreshCw size={20} /> : <Sparkles size={20} />}
          {image ? 'Regenerate Icon' : 'Generate Icon'}
        </button>
        
        {image && (
          <a
            href={image}
            download="doa-harian-modern-icon.png"
            className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95"
          >
            <Download size={20} />
            Download Icon
          </a>
        )}
      </div>
    </div>
  );
};

export default AppIconGenerator;
