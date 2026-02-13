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
      // Use the namespace import for mgrs
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

      // Header Banner
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 50, 'F');
      
      // Process Logo for PDF (White version for dark background)
      const whiteLogoSvg = APP_LOGO_SVG.replace(/currentColor/g, '#FFFFFF');
      
      // High-res rendering of SVG to PNG for PDF compatibility
      const logoPng = await svgToPng(whiteLogoSvg, 240, 543); 
      doc.addImage(logoPng, 'PNG', margin, 10, 13, 30);

      doc.setTextColor(99, 102, 241); 
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text("EXPLODEX", margin + 18, 25);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text("ORDNANCE FIELD REPORT", margin + 18, 35);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`REPORT ID: EXP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 190, 15, { align: 'right' });

      y = 65;
      doc.setTextColor(30, 41, 59);
      
      // 1. Classification Data
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("1. TARGET CLASSIFICATION", margin, y);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 2, 190, y + 2);
      
      y += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Ordnance Type:`, margin, y);
      doc.setFont('helvetica', 'bold');
      doc.text(data.title, margin + 40, y);
      
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.text(`Confidence:`, margin, y);
      if (confidence > 0.8) {
        doc.setTextColor(22, 163, 74);
      } else {
        doc.setTextColor(30, 41, 59);
      }
      doc.text(`${(confidence * 100).toFixed(2)}%`, margin + 40, y);
      doc.setTextColor(30, 41, 59);
      
      y += 8;
      doc.text(`Timestamp:`, margin, y);
      doc.text(new Date().toLocaleString(), margin + 40, y);
      
      if (includeLocation && location) {
        y += 8;
        doc.text(`Location:`, margin, y);
        const locString = useMGRS 
          ? `MGRS: ${getMGRSDisplay()}` 
          : `WGS84: ${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}`;
        doc.text(locString, margin + 40, y);
      }

      // 2. Visual Evidence
      y += 20;
      doc.setFont('helvetica', 'bold');
      doc.text("2. VISUAL EVIDENCE", margin, y);
      doc.line(margin, y + 2, 190, y + 2);
      y += 10;
      
      try {
        doc.addImage(sourceImage, 'JPEG', margin, y, 90, 67.5);
        y += 80;
      } catch (e) {
        doc.setFont('helvetica', 'italic');
        doc.text("[Visual Attachment Fault]", margin, y + 10);
        y += 20;
      }

      // 3. Narrative & Actions
      if (y > 220) { doc.addPage(); y = 20; }
      
      doc.setFont('helvetica', 'bold');
      doc.text("3. DISPOSAL & OPERATIONAL NOTES", margin, y);
      doc.line(margin, y + 2, 190, y + 2);
      y += 12;
      
      doc.setFontSize(10);
      doc.text("Render-Safe Procedure / Neutralization:", margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      const rsLines = doc.splitTextToSize(renderSafe || "Standard protocols pending field assessment.", 170);
      doc.text(rsLines, margin, y);
      y += (rsLines.length * 5) + 10;

      doc.setFont('helvetica', 'bold');
      doc.text("Follow-up Requirements / Disposal:", margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      const faLines = doc.splitTextToSize(furtherActions || "Cordon established. Awaiting EOD disposal team.", 170);
      doc.text(faLines, margin, y);
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("OFFLINE GENERATED FIELD REPORT - CLASSIFICATION SENSITIVE", 105, 285, { align: 'center' });

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
    <div className="flex flex-col flex-1 min-h-0 bg-dark">
      {/* Header - Fixed height */}
      <div className="p-5 md:p-6 border-b border-white/5 bg-slate-900/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white leading-tight">Field Reporter</h2>
            <p className="text-[10px] text-primary font-mono uppercase tracking-widest">Mil-Coordination Sync</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
          <DocumentTextIcon className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Report Draft</span>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 space-y-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Geospatial Configuration</h3>
            {locError && <span className="text-[10px] text-red-400 font-medium animate-pulse">{locError}</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => setIncludeLocation(!includeLocation)}
              className={`p-4 rounded-xl border text-left transition-all ${includeLocation ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20' : 'bg-slate-800/30 border-white/5 hover:border-white/10'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <MapPinIcon className={`w-5 h-5 ${includeLocation ? 'text-primary' : 'text-slate-500'}`} />
                <span className={`text-sm font-bold ${includeLocation ? 'text-white' : 'text-slate-400'}`}>GPS Capture</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">Include device coordinates in the report header.</p>
            </button>
            <button 
              onClick={() => setUseMGRS(!useMGRS)}
              disabled={!includeLocation}
              className={`p-4 rounded-xl border text-left transition-all ${!includeLocation ? 'opacity-40 cursor-not-allowed' : ''} ${useMGRS && includeLocation ? 'bg-secondary/5 border-secondary/40 ring-1 ring-secondary/20' : 'bg-slate-800/30 border-white/5 hover:border-white/10'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <GlobeAltIcon className={`w-5 h-5 ${useMGRS && includeLocation ? 'text-secondary' : 'text-slate-500'}`} />
                <span className={`text-sm font-bold ${useMGRS && includeLocation ? 'text-white' : 'text-slate-400'}`}>MGRS Grid</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">Convert Lat/Lon to Military Grid Reference System.</p>
            </button>
          </div>
          {includeLocation && location && (
            <div className="p-4 bg-slate-900/80 rounded-xl border border-white/5 font-mono text-xs flex justify-between items-center animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-slate-500">Live Fix:</span>
                <span className="text-white font-bold">{useMGRS ? 'MGRS' : 'WGS84'}</span>
              </div>
              <div className="text-primary-400 font-bold tracking-wider">
                 {useMGRS ? getMGRSDisplay() : `${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}`}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4" />
              Neutralization & Render-Safe
            </label>
            <textarea 
              value={renderSafe}
              onChange={(e) => setRenderSafe(e.target.value)}
              placeholder="Describe actions taken to neutralize the hazard..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm text-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[120px] transition-all resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <ArrowRightCircleIcon className="w-4 h-4" />
              Next Steps / Disposal
            </label>
            <textarea 
              value={furtherActions}
              onChange={(e) => setFurtherActions(e.target.value)}
              placeholder="Requirements for follow-on disposal teams or cordons..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm text-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[120px] transition-all resize-none"
            />
          </div>
        </section>
      </div>

      {/* Footer - Fixed height */}
      <div className="p-5 md:p-6 border-t border-white/5 bg-slate-900/80 shrink-0">
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className={`
            w-full py-4 px-6 rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all
            ${isGenerating 
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-primary/30 active:scale-[0.98]'}
          `}
        >
          {isGenerating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
          ) : (
            <>
              <DocumentArrowDownIcon className="w-6 h-6" />
              Finalize Field Report
            </>
          )}
        </button>
      </div>
    </div>
  );
};