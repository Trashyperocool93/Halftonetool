import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, RefreshCw, Layers, Move, Palette, Image as ImageIcon, Share2, FolderInput, CheckCircle2 } from 'lucide-react';

// --- Custom Icon based on uploaded image ---
const DotterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-black">
    <circle cx="5" cy="5" r="3" />
    <circle cx="10" cy="11" r="4" />
    <circle cx="16" cy="17" r="4.5" />
    <circle cx="21" cy="22" r="2" />
  </svg>
);

// --- UI Components ---

const Slider = ({ label, value, min, max, step, onChange, unit = "" }) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{label}</label>
      <span className="text-xs font-mono text-neutral-200">{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white hover:accent-neutral-200 focus:outline-none focus:ring-2 focus:ring-white/20"
    />
  </div>
);

const ColorPicker = ({ label, value, onChange }) => (
  <div className="mb-4">
    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">{label}</label>
    <div className="flex items-center space-x-3 bg-neutral-900 p-2 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
      />
      <span className="text-xs font-mono text-neutral-400 uppercase">{value}</span>
    </div>
  </div>
);

const Toggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between mb-4 bg-neutral-900 p-3 rounded-lg border border-neutral-800">
    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{label}</span>
    <button
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full relative transition-colors duration-300 ease-in-out ${checked ? 'bg-white' : 'bg-neutral-700'}`}
    >
      <span className={`absolute top-1 left-1 bg-black w-3 h-3 rounded-full transition-transform duration-300 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

const Select = ({ label, value, options, onChange }) => (
  <div className="mb-4">
    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-neutral-900 text-neutral-200 text-sm rounded-lg border border-neutral-800 p-2.5 focus:ring-white focus:border-white outline-none hover:border-neutral-700 transition-colors"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// --- Main App Component ---

const App = () => {
  // State: Canvas & Image
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [toast, setToast] = useState(null);

  // State: Parameters
  const [config, setConfig] = useState({
    // Stage 1: Preprocessing
    contrastBoost: 1.2,
    thresholdClamp: 0.1,
    invert: false,
    
    // Stage 2: Grid
    dotSpacing: 12,
    lineDirection: 'horizontal', // 'horizontal' | 'vertical'
    
    // Stage 3: Color Modes
    colorMode: 'single', // 'single' | 'quad'
    backgroundColor: '#ffffff', 
    transparentBackground: false,

    // Single Mode Settings
    dotColor: '#000000',
    dotSizeMin: 2,
    dotSizeMax: 14,
    dotShape: 0, // 0 = Circle, 1 = Line
    
    // Quad Mode Settings (4 bands)
    // 0: Darkest, 3: Brightest
    quadColors: ['#000000', '#404040', '#737373', '#d4d4d4'], 
    quadSizes: [12, 8, 4, 2], 
    quadShapes: [0, 0, 0, 0], 

    // Stage 4: Explode/Physics
    explodeStrength: 0,
    explodeDirection: 'radial', 
    noiseVariation: 0,
  });

  // Load default image on mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "https://images.unsplash.com/photo-1517466787929-bc90951d6428?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
    img.onload = () => {
      setImage(img);
      setDimensions({ width: img.width, height: img.height });
    };
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          
          if (w > maxDim || h > maxDim) {
             const ratio = w / h;
             if (w > h) {
               w = maxDim;
               h = maxDim / ratio;
             } else {
               h = maxDim;
               w = maxDim * ratio;
             }
          }
          setDimensions({ width: w, height: h });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'dotter-export.png';
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleShareConfig = () => {
    try {
      const configStr = btoa(JSON.stringify(config));
      const textArea = document.createElement("textarea");
      textArea.value = configStr;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast("Config copied to clipboard!");
    } catch (err) {
      showToast("Failed to copy config.");
    }
  };

  const handleImportConfig = () => {
    const configStr = prompt("Paste your configuration code here:");
    if (configStr) {
      try {
        const newConfig = JSON.parse(atob(configStr));
        setConfig(prev => ({ ...prev, ...newConfig }));
        showToast("Config imported successfully!");
      } catch (e) {
        showToast("Invalid configuration code.");
      }
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
    osCanvas.width = width;
    osCanvas.height = height;
    const osCtx = osCanvas.getContext('2d');
    osCtx.drawImage(image, 0, 0, width, height);
    
    const imageData = osCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    if (config.transparentBackground) {
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }
    
    const centerX = width / 2;
    const centerY = height / 2;
    const spacing = Math.max(2, config.dotSpacing);
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

    for (let y = 0; y < height; y += spacing) {
      for (let x = 0; x < width; x += spacing) {
        
        const i = (Math.floor(y) * width + Math.floor(x)) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 50) continue;

        let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (config.invert) brightness = 1.0 - brightness;
        if (config.contrastBoost !== 1) brightness = (brightness - 0.5) * config.contrastBoost + 0.5;
        if (brightness < config.thresholdClamp) brightness = 0;
        if (brightness > (1 - config.thresholdClamp)) brightness = 1;
        brightness = Math.max(0, Math.min(1, brightness));

        let radius = 0;
        let shapeFactor = 0;
        let color = '#000000';
        
        if (config.colorMode === 'quad') {
            let bandIndex = 0;
            if (brightness > 0.75) bandIndex = 3;
            else if (brightness > 0.50) bandIndex = 2;
            else if (brightness > 0.25) bandIndex = 1;
            else bandIndex = 0;

            color = config.quadColors[bandIndex];
            radius = config.quadSizes[bandIndex] / 2;
            shapeFactor = config.quadShapes[bandIndex];
        } else {
            color = config.dotColor;
            radius = (config.dotSizeMin + brightness * (config.dotSizeMax - config.dotSizeMin)) / 2;
            shapeFactor = config.dotShape;
        }

        if (radius <= 0.5) continue; 

        let drawX = x;
        let drawY = y;

        if (config.explodeStrength > 0 || config.noiseVariation > 0) {
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const normDist = dist / maxDist;
          let shift = config.explodeStrength * 5;
          const noiseX = (Math.random() - 0.5) * config.noiseVariation;
          const noiseY = (Math.random() - 0.5) * config.noiseVariation;

          if (config.explodeDirection === 'radial') {
             const explodeFactor = shift * (normDist * normDist); 
             drawX += (dx / (dist || 1)) * explodeFactor + noiseX;
             drawY += (dy / (dist || 1)) * explodeFactor + noiseY;
          } else if (config.explodeDirection === 'horizontal') {
             drawX += shift * (1 - brightness) + noiseX;
             drawY += noiseY;
          } else if (config.explodeDirection === 'vertical') {
             drawY += shift * (1 - brightness) + noiseY;
             drawX += noiseX;
          }
        }

        const extension = (spacing * 1.1) * shapeFactor; 
        ctx.beginPath();
        
        if (extension <= 1) {
          ctx.fillStyle = color;
          ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = color;
          ctx.lineWidth = radius * 2;
          ctx.lineCap = 'round';
          ctx.moveTo(drawX, drawY);
          if (config.lineDirection === 'vertical') {
             ctx.moveTo(drawX, drawY - extension / 2);
             ctx.lineTo(drawX, drawY + extension / 2);
          } else {
             ctx.moveTo(drawX - extension / 2, drawY);
             ctx.lineTo(drawX + extension / 2, drawY);
          }
          ctx.stroke();
        }
      }
    }
  }, [image, dimensions, config]);

  useEffect(() => {
    let timeout = setTimeout(() => processImage(), 10);
    return () => clearTimeout(timeout);
  }, [processImage]);

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-200 font-sans overflow-hidden">
      {toast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full shadow-2xl z-50 flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 border border-neutral-200">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-bold tracking-tight">{toast}</span>
        </div>
      )}

      <header className="h-16 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center shadow-lg shadow-white/10">
            <DotterIcon />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">Dotter</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 mr-4 border-r border-neutral-800 pr-4">
             <button onClick={handleShareConfig} title="Copy Preset Code" className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
                <Share2 className="w-4 h-4" />
             </button>
             <button onClick={handleImportConfig} title="Import Preset Code" className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
                <FolderInput className="w-4 h-4" />
             </button>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-neutral-700 hover:border-neutral-600">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Load Image</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          <button onClick={handleDownload} className="flex items-center space-x-2 bg-white hover:bg-neutral-200 text-black px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-white/5 transition-all hover:scale-105">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export PNG</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 bg-neutral-950 border-r border-neutral-800 flex flex-col overflow-y-auto custom-scrollbar shrink-0">
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-white mb-4 border-b border-neutral-800 pb-2">
                <Layers className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Preprocessing</h3>
              </div>
              <Slider label="Contrast Boost" value={config.contrastBoost} min={0.5} max={3.0} step={0.1} onChange={(v) => setConfig(prev => ({ ...prev, contrastBoost: v }))} />
              <Slider label="Threshold Clamp" value={config.thresholdClamp} min={0} max={0.45} step={0.01} onChange={(v) => setConfig(prev => ({ ...prev, thresholdClamp: v }))} />
              <Toggle label="Invert Source" checked={config.invert} onChange={(v) => setConfig(prev => ({ ...prev, invert: v }))} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-white mb-4 border-b border-neutral-800 pb-2">
                <ImageIcon className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Grid Matrix</h3>
              </div>
              <Slider label="Grid Spacing" value={config.dotSpacing} min={4} max={60} step={1} unit="px" onChange={(v) => setConfig(prev => ({ ...prev, dotSpacing: v }))} />
              <Select label="Line Direction" value={config.lineDirection} options={[{ value: 'horizontal', label: 'Horizontal (—)' }, { value: 'vertical', label: 'Vertical (|)' }]} onChange={(v) => setConfig(prev => ({ ...prev, lineDirection: v }))} />
              {config.colorMode === 'single' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Slider label="Min Size" value={config.dotSizeMin} min={0} max={20} step={1} unit="px" onChange={(v) => setConfig(prev => ({ ...prev, dotSizeMin: v }))} />
                    <Slider label="Max Size" value={config.dotSizeMax} min={1} max={100} step={1} unit="px" onChange={(v) => setConfig(prev => ({ ...prev, dotSizeMax: v }))} />
                  </div>
                  <Slider label="Dot Shape" value={config.dotShape} min={0} max={1} step={0.05} onChange={(v) => setConfig(prev => ({ ...prev, dotShape: v }))} />
                </>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-white mb-4 border-b border-neutral-800 pb-2">
                <Palette className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Color Grade</h3>
              </div>
              <div className={config.transparentBackground ? "opacity-50 pointer-events-none grayscale mb-4" : "mb-4"}>
                <ColorPicker label="Background Paper" value={config.backgroundColor} onChange={(v) => setConfig(prev => ({ ...prev, backgroundColor: v }))} />
              </div>
              <Toggle label="Transparent Background" checked={config.transparentBackground} onChange={(v) => setConfig(prev => ({ ...prev, transparentBackground: v }))} />
              <div className="mt-4 pt-4 border-t border-neutral-800">
                <Select label="Dot Mode" value={config.colorMode} options={[{ value: 'single', label: 'Single Color' }, { value: 'quad', label: '4-Color Split' }]} onChange={(v) => setConfig(prev => ({ ...prev, colorMode: v }))} />
                {config.colorMode === 'single' ? (
                   <ColorPicker label="Dot Ink" value={config.dotColor} onChange={(v) => setConfig(prev => ({ ...prev, dotColor: v }))} />
                ) : (
                  <div className="space-y-3 bg-neutral-900 border border-neutral-800 p-3 rounded-lg">
                    {['Dark', 'Mid-D', 'Mid-L', 'Lite'].map((label, idx) => (
                      <div key={idx} className="flex items-start space-x-2 pt-1 border-t border-white/5 first:border-0 first:pt-0">
                         <input type="color" value={config.quadColors[idx]} onChange={(e) => updateQuadConfig(idx, 'quadColors', e.target.value)} className="w-6 h-6 rounded bg-transparent border-0 p-0 cursor-pointer mt-1" />
                         <div className="flex-1 flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                               <span className="text-[8px] uppercase text-neutral-500 w-6">Size</span>
                               <input type="range" min="0" max="40" value={config.quadSizes[idx]} onChange={(e) => updateQuadConfig(idx, 'quadSizes', parseFloat(e.target.value))} className="flex-1 h-1 bg-neutral-700 rounded-lg accent-white" />
                               <span className="text-[10px] font-mono w-5 text-right">{config.quadSizes[idx]}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                               <span className="text-[8px] uppercase text-neutral-500 w-6">Line</span>
                               <input type="range" min="0" max="1" step="0.05" value={config.quadShapes[idx]} onChange={(e) => updateQuadConfig(idx, 'quadShapes', parseFloat(e.target.value))} className="flex-1 h-1 bg-neutral-700 rounded-lg accent-neutral-300" />
                               <span className="text-[10px] font-mono w-5 text-right">{(config.quadShapes[idx] * 10).toFixed(0)}</span>
                            </div>
                         </div>
                         <span className="text-[9px] text-neutral-500 uppercase w-8 text-right font-medium self-center">{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-white mb-4 border-b border-neutral-800 pb-2">
                <Move className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Displacement</h3>
              </div>
              <Select label="Explode Direction" value={config.explodeDirection} options={[{ value: 'radial', label: 'Radial' }, { value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }]} onChange={(v) => setConfig(prev => ({ ...prev, explodeDirection: v }))} />
              <Slider label="Explode Strength" value={config.explodeStrength} min={0} max={100} step={1} onChange={(v) => setConfig(prev => ({ ...prev, explodeStrength: v }))} />
              <Slider label="Noise / Jitter" value={config.noiseVariation} min={0} max={50} step={1} onChange={(v) => setConfig(prev => ({ ...prev, noiseVariation: v }))} />
            </div>
          </div>
          <div className="p-4 border-t border-neutral-800 text-center">
            <button onClick={() => setConfig({ contrastBoost: 1.2, thresholdClamp: 0.1, dotSpacing: 12, lineDirection: 'horizontal', colorMode: 'single', dotColor: '#000000', dotSizeMin: 2, dotSizeMax: 14, dotShape: 0, backgroundColor: '#ffffff', transparentBackground: false, quadColors: ['#000000', '#404040', '#737373', '#d4d4d4'], quadSizes: [12, 8, 4, 2], quadShapes: [0, 0, 0, 0], invert: false, explodeStrength: 0, explodeDirection: 'radial', noiseVariation: 0 })} className="text-xs text-neutral-500 hover:text-white flex items-center justify-center space-x-2 mx-auto transition-colors">
              <RefreshCw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        <div className="flex-1 bg-neutral-950 p-8 flex items-center justify-center overflow-auto relative checkerboard-bg">
           <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #525252 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
           <div className="relative shadow-2xl shadow-black/50 border border-neutral-800">
              <canvas ref={canvasRef} className="max-w-full max-h-[85vh] block" style={{ imageRendering: 'pixelated' }} />
           </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #171717; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #404040; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #525252; }
        .checkerboard-bg {
          background-color: #020617;
          background-image: linear-gradient(45deg, #0f172a 25%, transparent 25%), linear-gradient(-45deg, #0f172a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #0f172a 75%), linear-gradient(-45deg, transparent 75%, #0f172a 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  );
};

export default App;
