import React, { useState, useEffect } from 'react';
import { 
  MapPinIcon, 
  ShieldCheckIcon, 
  ArrowRightCircleIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { ClassInfo } from '../types';
import { jsPDF } from 'jspdf';
import * as mgrs from 'mgrs';
import { APP_LOGO_SVG } from '../constants';
import { svgToPng } from '../utils/imageUtils';

interface ReportWizardProps {
  data: ClassInfo;
  confidence: number;
  sourceImage: string;
  onCancel: () => void;
}

export const ReportWizard: React.FC<ReportWizardProps> = ({ data, confidence, sourceImage, onCancel }) => {
  const [includeLocation, setIncludeLocation] = useState(true);
  const [useMGRS, setUseMGRS] = useState(true);
  const [renderSafe, setRenderSafe] = useState('');
  const [furtherActions, setFurtherActions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    if (includeLocation && !location) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setLocError(null);
        },
        (err) => {
          console.error("Location error:", err);
          setLocError("Location access denied or unavailable.");
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [includeLocation, location]);

  const getMGRSDisplay = () => {
    if (!location) return "Searching...";
    try {
      return mgrs.forward([location.lon, location.lat]);
    } catch (e) {
      console.error("MGRS conversion error:", e);
      return "Conversion Error";
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const margin = 20;
      let y = margin;

      // 1. Minimized Header Banner (30mm)
      const headerHeight = 30;
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, headerHeight, 'F');
      
      const whiteLogoSvg = APP_LOGO_SVG.replace(/currentColor/g, '#FFFFFF');
      const logoPng = await svgToPng(whiteLogoSvg, 150, 340); 
      doc.addImage(logoPng, 'PNG', margin, 5, 7, 18);

      doc.setTextColor(99, 102, 241); 
      doc.setFontSize(16); 
      doc.setFont('helvetica', 'bold');
      doc.text("EXPLODEX", margin + 10, 15);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9); 
      doc.text("ORDNANCE FIELD REPORT", margin + 10, 21);
      
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text(`REPORT ID: EXP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 190, 8, { align: 'right' });

      y = headerHeight + 12;
      doc.setTextColor(30, 41, 59);
      
      // 2. Classification Data (Minimized Text)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("1. TARGET CLASSIFICATION", margin, y);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 2, 190, y + 2);
      
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Ordnance Type:`, margin, y);
      doc.setFont('helvetica', 'bold');
      doc.text(data.title, margin + 40, y);
      
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`Confidence:`, margin, y);
      if (confidence > 0.8) {
        doc.setTextColor(22, 163, 74);
      }
      doc.text(`${(confidence * 100).toFixed(2)}%`, margin + 40, y);
      doc.setTextColor(30, 41, 59);
      
      y += 6;
      doc.text(`Timestamp:`, margin, y);
      doc.text(new Date().toLocaleString(), margin + 40, y);
      
      if (includeLocation && location) {
        y += 6;
        doc.text(`Location:`, margin, y);
        const locString = useMGRS 
          ? `MGRS: ${getMGRSDisplay()}` 
          : `WGS84: ${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}`;
        doc.text(locString, margin + 40, y);
      }

      // 3. Minimized Visual Evidence with Aspect Ratio Lock
      y += 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("2. VISUAL EVIDENCE", margin, y);
      doc.line(margin, y + 2, 190, y + 2);
      y += 8;
      
      try {
        const img = new Image();
        img.src = sourceImage;
        await new Promise((resolve) => { img.onload = resolve; });
        
        // Minimize the image footprint to avoid massive PDF sizes while keeping aspect ratio
        const maxDisplayWidth = 100; // Smaller maximized width
        const maxDisplayHeight = 60; // Smaller maximized height
        let finalWidth = maxDisplayWidth;
        let finalHeight = (img.height * maxDisplayWidth) / img.width;
        
        if (finalHeight > maxDisplayHeight) {
            finalHeight = maxDisplayHeight;
            finalWidth = (img.width * maxDisplayHeight) / img.height;
        }

        doc.addImage(sourceImage, 'JPEG', margin, y, finalWidth, finalHeight, undefined, 'FAST');
        y += finalHeight + 10;
      } catch (e) {
        doc.setFont('helvetica', 'italic');
        doc.text("[Visual Attachment Fault]", margin, y + 8);
        y += 15;
      }

      // 4. Narrative & Actions (Minimized)
      if (y > 230) { doc.addPage(); y = 20; }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("3. DISPOSAL & OPERATIONAL NOTES", margin, y);
      doc.line(margin, y + 2, 190, y + 2);
      y += 8;
      
      doc.setFontSize(8);
      doc.text("Render-Safe Procedure / Neutralization:", margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      const rsLines = doc.splitTextToSize(renderSafe || "Standard protocols pending field assessment.", 170);
      doc.text(rsLines, margin, y);
      y += (rsLines.length * 4) + 6;

      doc.setFont('helvetica', 'bold');
      doc.text("Follow-up Requirements / Disposal:", margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      const faLines = doc.splitTextToSize(furtherActions || "Cordon established. Awaiting EOD disposal team.", 170);
      doc.text(faLines, margin, y);
      
      // Footer
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text("OFFLINE GENERATED FIELD REPORT - CLASSIFICATION SENSITIVE", 105, 290, { align: 'center' });

      const filename = `EXPLODEX_REPORT_${data.title.toUpperCase()}_${new Date().getTime()}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("PDF Generation failed:", err);
      alert("Error generating PDF document.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-dark overflow-hidden">
      {/* Header - Fixed */}
      <div className="p-4 border-b border-white/5 bg-slate-900/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">Field Reporter</h2>
            <p className="text-[10px] text-primary font-mono uppercase tracking-widest leading-none">Operational Sync</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
          <DocumentTextIcon className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Report Draft</span>
        </div>
      </div>

      {/* Main Content - Scrollable area constrained correctly */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Geospatial Setup</h3>
            {locError && <span className="text-[10px] text-red-400 font-medium animate-pulse">{locError}</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button 
              onClick={() => setIncludeLocation(!includeLocation)}
              className={`p-3 rounded-xl border text-left transition-all ${includeLocation ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20' : 'bg-slate-800/30 border-white/5 hover:border-white/10'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <MapPinIcon className={`w-4 h-4 ${includeLocation ? 'text-primary' : 'text-slate-500'}`} />
                <span className={`text-xs font-bold ${includeLocation ? 'text-white' : 'text-slate-400'}`}>GPS Capture</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-tight">Attach device coordinates to header.</p>
            </button>
            <button 
              onClick={() => setUseMGRS(!useMGRS)}
              disabled={!includeLocation}
              className={`p-3 rounded-xl border text-left transition-all ${!includeLocation ? 'opacity-40 cursor-not-allowed' : ''} ${useMGRS && includeLocation ? 'bg-secondary/5 border-secondary/40 ring-1 ring-secondary/20' : 'bg-slate-800/30 border-white/5 hover:border-white/10'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <GlobeAltIcon className={`w-4 h-4 ${useMGRS && includeLocation ? 'text-secondary' : 'text-slate-500'}`} />
                <span className={`text-xs font-bold ${useMGRS && includeLocation ? 'text-white' : 'text-slate-400'}`}>MGRS Grid</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-tight">Military Grid Reference conversion.</p>
            </button>
          </div>
          {includeLocation && location && (
            <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 font-mono text-[10px] flex justify-between items-center animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-slate-500">Live:</span>
                <span className="text-white font-bold">{useMGRS ? 'MGRS' : 'WGS84'}</span>
              </div>
              <div className="text-primary-400 font-bold tracking-wider">
                 {useMGRS ? getMGRSDisplay() : `${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}`}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              Render-Safe Procedure
            </label>
            <textarea 
              value={renderSafe}
              onChange={(e) => setRenderSafe(e.target.value)}
              placeholder="Neutralization steps taken..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-sm text-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[100px] transition-all resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <ArrowRightCircleIcon className="w-3.5 h-3.5" />
              Follow-on Disposal
            </label>
            <textarea 
              value={furtherActions}
              onChange={(e) => setFurtherActions(e.target.value)}
              placeholder="Requirements for EOD disposal..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-sm text-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[100px] transition-all resize-none"
            />
          </div>
        </section>
      </div>

      {/* Footer - Fixed */}
      <div className="p-4 border-t border-white/5 bg-slate-900/80 shrink-0">
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className={`
            w-full py-3 px-6 rounded-xl font-bold text-base shadow-xl flex items-center justify-center gap-3 transition-all
            ${isGenerating 
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-primary/30 active:scale-[0.98]'}
          `}
        >
          {isGenerating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
          ) : (
            <>
              <DocumentArrowDownIcon className="w-5 h-5" />
              Generate Field Report
            </>
          )}
        </button>
      </div>
    </div>
  );
};