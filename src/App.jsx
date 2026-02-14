import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, RefreshCw, Layers, Move, Palette, Image as ImageIcon, Share2, FolderInput, CheckCircle2, ChevronDown, ChevronUp, MoveHorizontal, MoveVertical } from 'lucide-react';

// --- Custom Icon ---
const DotterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-black">
    <circle cx="5" cy="5" r="3" />
    <circle cx="10" cy="11" r="4" />
    <circle cx="16" cy="17" r="4.5" />
    <circle cx="21" cy="22" r="2" />
  </svg>
);

// --- Glass UI Components ---

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)] font-sans ${className}`}>
    {children}
  </div>
);

const Slider = ({ label, value, min, max, step, onChange, unit = "", compact = false }) => (
  <div className={`${compact ? 'w-40' : 'mb-6'} group font-sans`}>
    <div className="flex justify-between mb-2">
      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] group-hover:text-neutral-300 transition-colors truncate">{label}</label>
      <span className="text-[10px] font-mono text-white/40">{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-[2px] bg-white/10 rounded-lg appearance-none cursor-pointer accent-white hover:accent-neutral-200 focus:outline-none"
    />
  </div>
);

const ColorPicker = ({ label, value, onChange }) => (
  <div className="mb-6 font-sans">
    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">{label}</label>
    <div className="flex items-center space-x-3 bg-white/[0.03] p-2 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0 p-0"
      />
      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest group-hover:text-neutral-300 transition-colors">{value}</span>
    </div>
  </div>
);

const Toggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between mb-6 bg-white/[0.02] p-3 rounded-xl border border-white/5 font-sans">
    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{label}</span>
    <button
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full relative transition-all duration-500 ${checked ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/10'}`}
    >
      <span className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-all duration-500 ${checked ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white/40'}`} />
    </button>
  </div>
);

const Select = ({ label, value, options, onChange, compact = false }) => (
  <div className={`${compact ? 'w-36' : 'mb-6'} relative group font-sans`}>
    {!compact && <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">{label}</label>}
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-white/[0.03] text-white text-[10px] font-black uppercase tracking-[0.1em] rounded-xl border border-white/5 ${compact ? 'py-2 px-3 pr-8' : 'p-3 pr-10'} focus:ring-1 focus:ring-white/20 outline-none hover:border-white/10 transition-all appearance-none cursor-pointer font-sans`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-neutral-900 text-white font-sans uppercase tracking-widest text-[10px]">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500 pointer-events-none group-hover:text-white transition-colors" />
    </div>
  </div>
);

// --- Sidebar Section Wrapper ---
const Section = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5 pb-8 last:border-0 font-sans">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between group py-2 font-sans"
      >
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center group-hover:text-neutral-300 transition-colors">
          <span className={`w-1 h-1 bg-white mr-3 transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-50 opacity-50'}`} /> 
          {title}
        </h4>
        {isOpen ? <ChevronUp className="w-3 h-3 text-neutral-600" /> : <ChevronDown className="w-3 h-3 text-neutral-600" />}
      </button>
      {isOpen && (
        <div className="mt-8 animate-in fade-in slide-in-from-top-2 duration-300 font-sans">
          {children}
        </div>
      )}
    </div>
  );
};

// --- Main App ---

const App = () => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [image, setImage] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [toast, setToast] = useState(null);

  const [config, setConfig] = useState({
    contrastBoost: 1.2,
    thresholdClamp: 0.1,
    invert: false,
    dotSpacing: 12,
    lineDirection: 'horizontal',
    colorMode: 'single',
    backgroundColor: '#ffffff', 
    transparentBackground: false,
    dotColor: '#000000',
    dotSizeMin: 2,
    dotSizeMax: 14,
    dotShape: 0, 
    quadColors: ['#000000', '#404040', '#737373', '#d4d4d4'], 
    quadSizes: [12, 8, 4, 2], 
    quadShapes: [0, 0, 0, 0], 
    explodeStrength: 0,
    explodeDirection: 'radial', 
    noiseVariation: 0,
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleImageFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          const maxDim = 1200;
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
             const ratio = w / h;
             if (w > h) { w = maxDim; h = maxDim / ratio; } 
             else { h = maxDim; w = maxDim * ratio; }
          }
          setDimensions({ width: w, height: h });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (canvasRef.current && image) {
      const link = document.createElement('a');
      link.download = 'dotter-v2-export.png';
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  const updateQuadConfig = (index, field, value) => {
    setConfig(prev => {
      const newArr = [...prev[field]];
      newArr[index] = value;
      return { ...prev, [field]: newArr };
    });
  };

  const processImage = useCallback(() => {
    if (!image || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const { width, height } = dimensions;
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    const osCanvas = document.createElement('canvas');
    osCanvas.width = width; osCanvas.height = height;
    const osCtx = osCanvas.getContext('2d');
    osCtx.drawImage(image, 0, 0, width, height);
    const data = osCtx.getImageData(0, 0, width, height).data;

    if (config.transparentBackground) ctx.clearRect(0, 0, width, height);
    else { 
      // Safe color parsing for editable hex
      ctx.fillStyle = (config.backgroundColor && (config.backgroundColor.length === 7 || config.backgroundColor.length === 4)) 
        ? config.backgroundColor 
        : '#ffffff'; 
      ctx.fillRect(0, 0, width, height); 
    }
    
    const spacing = Math.max(2, config.dotSpacing);
    const centerX = width / 2, centerY = height / 2;
    const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);

    for (let y = 0; y < height; y += spacing) {
      for (let x = 0; x < width; x += spacing) {
        const i = (Math.floor(y) * width + Math.floor(x)) * 4;
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        if (a < 50) continue;

        let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (config.invert) brightness = 1.0 - brightness;
        brightness = (brightness - 0.5) * config.contrastBoost + 0.5;
        if (brightness < config.thresholdClamp) brightness = 0;
        if (brightness > (1 - config.thresholdClamp)) brightness = 1;
        brightness = Math.max(0, Math.min(1, brightness));

        let radius = 0, shapeFactor = 0, color = '#000000';
        if (config.colorMode === 'quad') {
            const band = brightness > 0.75 ? 3 : brightness > 0.5 ? 2 : brightness > 0.25 ? 1 : 0;
            const qColor = config.quadColors[band];
            color = (qColor && (qColor.length === 7 || qColor.length === 4)) ? qColor : '#000000';
            radius = config.quadSizes[band] / 2;
            shapeFactor = config.quadShapes[band];
        } else {
            color = (config.dotColor && (config.dotColor.length === 7 || config.dotColor.length === 4)) ? config.dotColor : '#000000';
            radius = (config.dotSizeMin + brightness * (config.dotSizeMax - config.dotSizeMin)) / 2;
            shapeFactor = config.dotShape;
        }

        if (radius <= 0.5) continue; 
        let dX = x, dY = y;
        if (config.explodeStrength > 0 || config.noiseVariation > 0) {
          const dx = x - centerX, dy = y - centerY, dist = Math.sqrt(dx*dx + dy*dy);
          const shift = config.explodeStrength * 5;
          const nX = (Math.random() - 0.5) * config.noiseVariation, nY = (Math.random() - 0.5) * config.noiseVariation;
          if (config.explodeDirection === 'radial') {
             const fac = shift * (dist / maxDist) ** 2;
             dX += (dx / (dist || 1)) * fac + nX; dY += (dy / (dist || 1)) * fac + nY;
          } else if (config.explodeDirection === 'horizontal') { dX += shift * (1 - brightness) + nX; dY += nY; }
          else { dY += shift * (1 - brightness) + nY; dX += nX; }
        }

        const ext = (spacing * 1.1) * shapeFactor; 
        ctx.beginPath();
        if (ext <= 1) { ctx.fillStyle = color; ctx.arc(dX, dY, radius, 0, Math.PI * 2); ctx.fill(); }
        else {
          ctx.strokeStyle = color; ctx.lineWidth = radius * 2; ctx.lineCap = 'round';
          ctx.moveTo(dX, dY);
          if (config.lineDirection === 'vertical') { ctx.moveTo(dX, dY - ext/2); ctx.lineTo(dX, dY + ext/2); }
          else { ctx.moveTo(dX - ext/2, dY); ctx.lineTo(dX + ext/2, dY); }
          ctx.stroke();
        }
      }
    }
  }, [image, dimensions, config]);

  useEffect(() => { if (image) setTimeout(() => processImage(), 10); }, [processImage, image]);

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-neutral-200 font-sans overflow-hidden relative selection:bg-white selection:text-black">
      
      {/* Background Decor */}
      {!image && (
        <>
          <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-neutral-800/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-neutral-900/30 rounded-full blur-[150px] pointer-events-none" />
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full shadow-2xl z-50 flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 border border-white/20 font-sans">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className="h-20 bg-white/[0.02] backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-10 shrink-0 z-20 font-sans">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <DotterIcon />
          </div>
          <span className="text-sm font-bold tracking-[0.4em] uppercase text-white">Dotter V2</span>
        </div>
        
        <div className="flex items-center space-x-3">
           <button className="p-3 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl border border-white/5 text-neutral-400 hover:text-white transition-all group font-sans" title="Share Preset">
             <Share2 className="w-4 h-4" />
           </button>
           
           <button 
             onClick={() => { setImage(null); showToast("Session Reset"); }} 
             className="p-3 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl border border-white/5 text-neutral-400 hover:text-white transition-all group font-sans"
             title="Reset Session"
           >
             <RefreshCw className="w-4 h-4 group-active:rotate-180 transition-transform duration-500" />
           </button>

           <button 
             onClick={() => fileInputRef.current.click()}
             className="px-6 py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-white/80 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all font-sans"
           >
             Upload Image
           </button>

           <button 
             onClick={handleDownload}
             className="px-8 py-3 bg-white hover:bg-neutral-200 text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95 font-sans"
           >
             Export Output
           </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden z-10 relative font-sans">
        
        {/* Glass Sidebar */}
        <div className="w-80 bg-white/[0.01] backdrop-blur-3xl border-r border-white/5 flex flex-col overflow-y-auto custom-scrollbar shrink-0 scroll-smooth font-sans">
          <div className="p-8 space-y-8 pb-24">
            
            <Section title="Processing">
              <Slider label="Contrast" value={config.contrastBoost} min={0.5} max={3.0} step={0.1} onChange={(v) => setConfig(prev => ({ ...prev, contrastBoost: v }))} />
              <Toggle label="Invert Matrix" checked={config.invert} onChange={(v) => setConfig(prev => ({ ...prev, invert: v }))} />
            </Section>

            <Section title="Aesthetics">
              <ColorPicker label="Canvas Base" value={config.backgroundColor} onChange={(v) => setConfig(prev => ({ ...prev, backgroundColor: v }))} />
              <Select label="Palette Mode" value={config.colorMode} options={[{ value: 'single', label: 'Monochrome' }, { value: 'quad', label: 'Quad-Split' }]} onChange={(v) => setConfig(prev => ({ ...prev, colorMode: v }))} />
              
              {config.colorMode === 'single' ? (
                <ColorPicker label="Dot Pigment" value={config.dotColor} onChange={(v) => setConfig(prev => ({ ...prev, dotColor: v }))} />
              ) : (
                <div className="space-y-4 bg-white/[0.03] p-4 rounded-2xl border border-white/5 font-sans">
                  {['Dark', 'Mid-D', 'Mid-L', 'Lite'].map((label, idx) => (
                    <div key={idx} className="flex items-center space-x-4 pb-4 last:pb-0 border-b border-white/5 last:border-0 group">
                      <div className="relative w-7 h-7 shrink-0">
                        <input 
                          type="color" 
                          value={config.quadColors[idx]} 
                          onChange={(e) => updateQuadConfig(idx, 'quadColors', e.target.value)} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 font-sans" 
                        />
                        <div 
                          className="w-full h-full rounded-lg border border-white/10 shadow-inner group-hover:border-white/30 transition-all duration-300"
                          style={{ backgroundColor: config.quadColors[idx] }}
                        />
                      </div>
                      <div className="flex-1 space-y-2 font-sans">
                        <div className="flex justify-between items-center font-sans">
                           <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">{label}</span>
                           <input 
                             type="text"
                             value={config.quadColors[idx]}
                             onChange={(e) => updateQuadConfig(idx, 'quadColors', e.target.value)}
                             className="text-[8px] font-mono text-neutral-600 bg-transparent border-0 p-0 text-right uppercase focus:text-white outline-none w-16"
                             maxLength={7}
                           />
                        </div>
                        
                        <div className="space-y-2">
                          {/* Size Control */}
                          <div className="flex items-center space-x-2 font-sans">
                            <span className="text-[7px] text-neutral-500 uppercase font-black">Size</span>
                            <input 
                              type="range" 
                              min="0" max="40" 
                              value={config.quadSizes[idx]} 
                              onChange={(e) => updateQuadConfig(idx, 'quadSizes', parseFloat(e.target.value))} 
                              className="flex-1 h-[1px] bg-white/10 accent-white appearance-none cursor-pointer" 
                            />
                            <span className="text-[8px] font-mono text-neutral-400 w-3 text-right">{config.quadSizes[idx]}</span>
                          </div>

                          {/* Line Control (RESTORED) */}
                          <div className="flex items-center space-x-2 font-sans">
                            <span className="text-[7px] text-neutral-500 uppercase font-black">Line</span>
                            <input 
                              type="range" 
                              min="0" max="1" 
                              step="0.05"
                              value={config.quadShapes[idx]} 
                              onChange={(e) => updateQuadConfig(idx, 'quadShapes', parseFloat(e.target.value))} 
                              className="flex-1 h-[1px] bg-white/10 accent-white appearance-none cursor-pointer" 
                            />
                            <span className="text-[8px] font-mono text-neutral-400 w-3 text-right">{(config.quadShapes[idx] * 10).toFixed(0)}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Displacement">
              <Select label="Flow" value={config.explodeDirection} options={[{ value: 'radial', label: 'Radial' }, { value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }]} onChange={(v) => setConfig(prev => ({ ...prev, explodeDirection: v }))} />
              <Slider label="Intensity" value={config.explodeStrength} min={0} max={100} step={1} onChange={(v) => setConfig(prev => ({ ...prev, explodeStrength: v }))} />
              <Slider label="Jitter" value={config.noiseVariation} min={0} max={50} step={1} onChange={(v) => setConfig(prev => ({ ...prev, noiseVariation: v }))} />
            </Section>
          </div>
        </div>

        {/* Viewport Area */}
        <main 
          className="flex-1 flex flex-col items-stretch overflow-hidden relative transition-colors duration-500 font-sans"
          style={{ backgroundColor: image ? config.backgroundColor : 'transparent' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleImageFile(e.dataTransfer.files[0]); }}
        >
           {/* Hard Grid Controls Bar - Fixed to app background color (Black) */}
           <div className="w-full h-20 bg-[#050505] border-b border-white/5 flex items-center px-10 gap-10 shrink-0 z-20 font-sans">
              <Slider 
                label="Resolution" 
                value={config.dotSpacing} 
                min={4} max={60} step={1} unit="px" 
                onChange={(v) => setConfig(prev => ({ ...prev, dotSpacing: v }))} 
                className="flex-1 mb-0"
              />
              
              {/* Orientation Icon Buttons */}
              <div className="flex flex-col items-start justify-center gap-1.5 h-full pt-1">
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] self-start">Orientation</span>
                  <div className="flex items-center bg-white/[0.03] p-1 rounded-lg border border-white/5">
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, lineDirection: 'horizontal' }))}
                      className={`p-2 rounded-md transition-all ${config.lineDirection === 'horizontal' ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                      title="Horizontal"
                    >
                      <MoveHorizontal className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, lineDirection: 'vertical' }))}
                      className={`p-2 rounded-md transition-all ${config.lineDirection === 'vertical' ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                      title="Vertical"
                    >
                      <MoveVertical className="w-4 h-4" />
                    </button>
                  </div>
              </div>

              {config.colorMode === 'single' && (
                <Slider 
                  label="Stylization" 
                  value={config.dotShape} 
                  min={0} max={1} step={0.05} 
                  onChange={(v) => setConfig(prev => ({ ...prev, dotShape: v }))} 
                  className="flex-1 mb-0"
                />
              )}
           </div>

           {/* Infinite Canvas Background Area */}
           <div className="flex-1 flex items-center justify-center relative overflow-hidden transition-colors duration-500 font-sans">
              {!image && (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
              )}

              <div className="w-full h-full flex items-center justify-center relative z-0 font-sans">
                {image ? (
                  <div className="shadow-2xl shadow-black/20">
                    <canvas 
                      ref={canvasRef} 
                      className="max-w-full max-h-[70vh] block" 
                      style={{ imageRendering: 'auto' }} 
                    />
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current.click()} className="group cursor-pointer relative scale-75 xl:scale-100 font-sans">
                    <div className="absolute -inset-6 bg-white/5 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <GlassCard className="p-12 rounded-[1.75rem] flex flex-col items-center space-y-6 border-white/20 group-hover:border-white/40 transition-all duration-700">
                      <div className="w-16 h-16 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/[0.08] transition-all duration-700">
                        <ImageIcon className="w-7 h-7 text-neutral-500 group-hover:text-white transition-all duration-700" />
                      </div>
                      <div className="text-center space-y-2 font-sans">
                        <h2 className="text-white text-lg font-light tracking-[0.2em] uppercase font-sans">Dotter System V2</h2>
                        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-neutral-500 group-hover:text-neutral-300 transition-colors font-sans">
                          Upload or drag your image here
                        </p>
                      </div>
                    </GlassCard>
                  </div>
                )}
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden font-sans" onChange={(e) => handleImageFile(e.target.files[0])} />
              </div>
           </div>

           {/* Powered By Footer */}
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 opacity-30 pointer-events-none z-20">
             Powered by TrashyPeroCool
           </div>
        </main>
      </div>
      
      <style>{`
        /* Aggressive global font lock for browser widgets */
        * { 
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif !important; 
        }
        
        /* Exception for mono-font elements */
        .font-mono, .font-mono * {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px; width: 12px;
          border-radius: 50%; background: #fff;
          cursor: pointer; box-shadow: 0 0 10px rgba(255,255,255,0.4);
          border: 1px solid rgba(0,0,0,0.1);
        }

        /* Fix for native dropdown menus font */
        select, option {
          font-family: inherit !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
        }
      `}</style>
    </div>
  );
};

export default App;
