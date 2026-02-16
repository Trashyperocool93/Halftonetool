import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Upload, Download, RefreshCw, Layers, Move, Palette, Image as ImageIcon, Share2, FolderInput, CheckCircle2, ChevronDown, ChevronUp, MoveHorizontal, MoveVertical, Box, Play, Pause, RotateCw, Globe, Video, Volume2, VolumeX, Loader2, Sparkles, X, FileVideo, Save, Type } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// --- Error Boundary ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-black text-white font-sans">
          <div className="text-center p-8 border border-white/20 rounded-xl bg-white/5 backdrop-blur-xl">
            <h1 className="text-xl font-bold mb-2">Something went wrong.</h1>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Custom Icon ---
const DotterIcon = memo(() => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-black">
    <circle cx="5" cy="5" r="3" />
    <circle cx="10" cy="11" r="4" />
    <circle cx="16" cy="17" r="4.5" />
    <circle cx="21" cy="22" r="2" />
  </svg>
));

// --- Glass UI Components (Memoized for Performance) ---

const GlassCard = memo(({ children, className = "" }) => (
  <div className={`bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)] font-sans ${className}`}>
    {children}
  </div>
));

const Slider = memo(({ label, value, min, max, step, onChange, unit = "", compact = false, className = "mb-6" }) => (
  <div className={`${compact ? 'w-40' : className} group font-sans`}>
    {label && (
      <div className="flex justify-between mb-2">
        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] group-hover:text-neutral-300 transition-colors truncate">{label}</label>
        <span className="text-[10px] font-mono text-white/40">{typeof value === 'number' ? value.toFixed(step < 0.1 ? 2 : 0) : value}{unit}</span>
      </div>
    )}
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
));

const ColorPicker = memo(({ label, value, onChange }) => (
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
));

const Toggle = memo(({ label, checked, onChange }) => (
  <div className="flex items-center justify-between mb-6 bg-white/[0.02] p-3 rounded-xl border border-white/5 font-sans">
    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{label}</span>
    <button
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full relative transition-all duration-500 ${checked ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/10'}`}
    >
      <span className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-all duration-500 ${checked ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white/40'}`} />
    </button>
  </div>
));

const Select = memo(({ label, value, options, onChange, compact = false }) => (
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
));

const Section = memo(({ title, children, defaultOpen = true }) => {
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
});

// --- Main App Logic ---

const MainContent = () => {
  const canvasRef = useRef(null);
  const mountRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null); 
  
  // Core State
  const [mode, setMode] = useState('2D'); 
  const [image, setImage] = useState(null); 
  const [modelFile, setModelFile] = useState(null); 
  const [videoUrl, setVideoUrl] = useState(null); 
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [savedPalettes, setSavedPalettes] = useState([]);

  // Configuration
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
    textMode: false,
    textCharacters: " .:-#@",
    textFont: "monospace",
    textWeightMapping: true,
  });

  // 3D Specific Config
  const [config3D, setConfig3D] = useState({
    speed: 0.2,
    offset: 0,
    axis: 'y',
    paused: false,
  });
  const config3DRef = useRef(config3D);
  useEffect(() => { config3DRef.current = config3D; }, [config3D]);

  // Video Config
  const [configVideo, setConfigVideo] = useState({
    playing: true,
    muted: true,
  });

  // Load Palettes on Mount
  useEffect(() => {
    const stored = localStorage.getItem("dotter_palettes");
    if (stored) setSavedPalettes(JSON.parse(stored));
  }, []);

  const saveCurrentPalette = useCallback(() => {
    const newPalette = {
      id: Date.now().toString(),
      name: `Palette ${savedPalettes.length + 1}`,
      quadColors: [...config.quadColors],
      quadSizes: [...config.quadSizes],
      quadShapes: [...config.quadShapes]
    };
  
    const updated = [...savedPalettes, newPalette];
    setSavedPalettes(updated);
    localStorage.setItem("dotter_palettes", JSON.stringify(updated));
    showToast("Palette Saved");
  }, [config, savedPalettes]);
  
  const loadPalette = useCallback((palette) => {
    setConfig(prev => ({
      ...prev,
      quadColors: [...palette.quadColors],
      quadSizes: [...palette.quadSizes],
      quadShapes: [...palette.quadShapes]
    }));
    showToast("Palette Loaded");
  }, []);
  
  const deletePalette = useCallback((e, id) => {
    e.stopPropagation();
    const updated = savedPalettes.filter(p => p.id !== id);
    setSavedPalettes(updated);
    localStorage.setItem("dotter_palettes", JSON.stringify(updated));
  }, [savedPalettes]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleFile = (file) => {
    if (!file) return;

    // Clean up old URLs
    if (image && typeof image.src === 'string' && image.src.startsWith('blob:')) URL.revokeObjectURL(image.src);
    if (modelFile && typeof modelFile === 'string') URL.revokeObjectURL(modelFile); // if we stored url separately
    if (videoUrl) URL.revokeObjectURL(videoUrl);

    setImage(null);
    setModelFile(null);
    setVideoUrl(null);
    setLoading(true);

    const url = URL.createObjectURL(file);

    if (file.name.match(/\.(obj|glb|gltf)$/i)) {
      setModelFile(file);
      setMode('3D');
      showToast("3D Model Loaded");
    } else if (file.type.startsWith('video/')) {
      setVideoUrl(url);
      setMode('VIDEO');
      setConfigVideo(p => ({ ...p, playing: true }));
      showToast("Video Loaded");
    } else if (file.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setMode('2D');
        const maxDim = 1200;
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
           const ratio = w / h;
           if (w > h) { w = maxDim; h = maxDim / ratio; } 
           else { h = maxDim; w = maxDim * ratio; }
        }
        setDimensions({ width: w, height: h });
        setLoading(false);
        showToast("Image Loaded");
      };
      img.src = url;
    } else {
      showToast("Unsupported Format");
      setLoading(false);
    }
  };

  const handleVideoMetadata = () => {
    if (videoRef.current) {
      const v = videoRef.current;
      const maxDim = 600; 
      let w = v.videoWidth;
      let h = v.videoHeight;
      if (w > maxDim || h > maxDim) {
         const ratio = w / h;
         if (w > h) { w = maxDim; h = maxDim / ratio; } 
         else { h = maxDim; w = maxDim * ratio; }
      }
      setDimensions({ width: Math.floor(w), height: Math.floor(h) });
      setLoading(false);
    }
  };

  const toggleVideoPlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setConfigVideo(p => ({ ...p, playing: true }));
      } else {
        videoRef.current.pause();
        setConfigVideo(p => ({ ...p, playing: false }));
      }
    }
  }, []);

  const handleDownload = () => {
    if (canvasRef.current && (image || modelFile || videoUrl)) {
      const link = document.createElement('a');
      link.download = 'dotter-v2-export.png';
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  const handleVideoExport = async (durationSeconds) => {
    if (!canvasRef.current) return;
    setIsRecording(true);
    setIsExportMenuOpen(false);
    showToast(`Recording ${durationSeconds}s Video...`);
    
    const wasPaused = config3D.paused;
    if (mode === '3D' && wasPaused) {
        setConfig3D(prev => ({ ...prev, paused: false }));
    }

    const stream = canvasRef.current.captureStream(60);
    let options = {};
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) { options.mimeType = "video/webm;codecs=vp9"; } 
    else if (MediaRecorder.isTypeSupported("video/webm")) { options.mimeType = "video/webm"; } 
    else if (MediaRecorder.isTypeSupported("video/mp4")) { options.mimeType = "video/mp4"; }
    else { options = {}; }

    let recorder;
    try {
      recorder = new MediaRecorder(stream, options);
    } catch (e) {
      console.error("MediaRecorder init failed:", e);
      showToast("Recorder Error");
      setIsRecording(false);
      return;
    }

    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
        const type = options.mimeType || "video/webm";
        const ext = type.includes("mp4") ? "mp4" : "webm";
        const blob = new Blob(chunks, { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dotter-3d-${durationSeconds}s.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        if (mode === '3D' && wasPaused) {
            setConfig3D(prev => ({ ...prev, paused: true }));
        }
        setIsRecording(false);
        showToast("Video Export Complete");
    };

    recorder.start();
    setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, durationSeconds * 1000);
  };

  const updateQuadConfig = useCallback((index, field, value) => {
    setConfig(prev => {
      const newArr = [...prev[field]];
      newArr[index] = value;
      return { ...prev, [field]: newArr };
    });
  }, []);

  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  // --- Unified Halftone Engine ---
  const drawHalftone = (data, width, height) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const cfg = configRef.current;
    
    if (cfg.textMode) {
       ctx.fillStyle = "#0000FF";
       ctx.fillRect(0, 0, width, height);
    } else if (cfg.transparentBackground) {
       ctx.clearRect(0, 0, width, height);
    } else {
        ctx.fillStyle = (cfg.backgroundColor && (cfg.backgroundColor.length === 7 || cfg.backgroundColor.length === 4)) 
        ? cfg.backgroundColor 
        : '#ffffff';
        ctx.fillRect(0, 0, width, height);
    }
    
    const spacing = Math.max(2, cfg.dotSpacing);
    const centerX = width / 2; 
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
    const PI2 = Math.PI * 2;

    // Optimization: Pre-calculate reusable values
    const isSingle = cfg.colorMode === 'single';
    const singleColor = cfg.dotColor;
    const isPlanar = cfg.explodeDirection === 'planar';
    const isRadial = cfg.explodeDirection === 'radial';
    const isHorizontal = cfg.explodeDirection === 'horizontal';
    const isVertical = cfg.explodeDirection === 'vertical';
    const hasExplode = cfg.explodeStrength !== 0 || cfg.noiseVariation > 0;
    
    // Set fill style once if single mode and not text
    if (isSingle && !cfg.textMode) {
      ctx.fillStyle = singleColor;
      ctx.strokeStyle = singleColor;
    }

    for (let y = 0; y < height; y += spacing) {
      for (let x = 0; x < width; x += spacing) {
        const i = (Math.floor(y) * width + Math.floor(x)) * 4;

        // Skip transparent pixels
        if (data[i + 3] < 50) continue;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (cfg.invert) brightness = 1.0 - brightness;
        brightness = (brightness - 0.5) * cfg.contrastBoost + 0.5;
        if (brightness < cfg.thresholdClamp) brightness = 0;
        if (brightness > (1 - cfg.thresholdClamp)) brightness = 1;
        brightness = Math.max(0, Math.min(1, brightness));

        let radius = 0, shapeFactor = 0, color = '#000000';
        
        if (!isSingle) {
            const band = brightness > 0.75 ? 3 : brightness > 0.5 ? 2 : brightness > 0.25 ? 1 : 0;
            const qColor = cfg.quadColors[band];
            color = (qColor && (qColor.length === 7 || qColor.length === 4)) ? qColor : '#000000';
            radius = cfg.quadSizes[band] / 2;
            shapeFactor = cfg.quadShapes[band];
        } else {
            color = singleColor;
            radius = (cfg.dotSizeMin + brightness * (cfg.dotSizeMax - cfg.dotSizeMin)) / 2;
            shapeFactor = cfg.dotShape;
        }

        if (radius <= 0.5) continue; 

        // Explode / Physics
        let dX = x;
        let dY = y;

        if (hasExplode) {
          const dx = x - centerX;
          const dy = y - centerY;
          const shift = cfg.explodeStrength * 5;
          const nX = (Math.random() - 0.5) * cfg.noiseVariation;
          const nY = (Math.random() - 0.5) * cfg.noiseVariation;

          if (isRadial) {
             const dist = Math.sqrt(dx * dx + dy * dy);
             const normDist = dist / maxDist;
             const fac = shift * (normDist * normDist);
             dX += (dx / (dist || 1)) * fac + nX;
             dY += (dy / (dist || 1)) * fac + nY;
          } else if (isHorizontal) {
             dX += shift * (1 - brightness) + nX;
             dY += nY;
          } else if (isVertical) {
             dY += shift * (1 - brightness) + nY;
             dX += nX;
          } else if (isPlanar) {
             const compressionFactor = cfg.explodeStrength / 100;
             dX = x - (dx * compressionFactor) + nX;
             dY = y - (dy * compressionFactor) + nY;
          }
        }

        if (cfg.textMode) {
          const chars = cfg.textCharacters;
          let index = 0;
          if (cfg.textWeightMapping) {
            index = Math.floor((1 - brightness) * (chars.length - 1));
          } else {
             const gridX = Math.floor(x / spacing);
             const gridY = Math.floor(y / spacing);
             index = (gridX + gridY) % chars.length;
          }
          index = Math.max(0, Math.min(chars.length - 1, index));
          
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `${spacing * 1.2}px ${cfg.textFont}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(chars[index], dX, dY);

        } else {
          // Optimize color setting: Only set if quad mode (changes per dot)
          if (!isSingle) {
             ctx.fillStyle = color;
             ctx.strokeStyle = color;
          }

          const ext = (spacing * 1.1) * shapeFactor;
          ctx.beginPath();
          if (ext <= 1) {
            ctx.arc(dX, dY, radius, 0, PI2);
            ctx.fill();
          } else {
            ctx.lineWidth = radius * 2;
            ctx.lineCap = 'round';
            ctx.moveTo(dX, dY);
            if (cfg.lineDirection === 'vertical') { ctx.moveTo(dX, dY - ext/2); ctx.lineTo(dX, dY + ext/2); }
            else { ctx.moveTo(dX - ext/2, dY); ctx.lineTo(dX + ext/2, dY); }
            ctx.stroke();
          }
        }
      }
    }
  };

  // --- 2D Pipeline ---
  useEffect(() => {
    if (mode === '2D' && image && canvasRef.current) {
      const timeout = setTimeout(() => {
        const { width, height } = dimensions;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        const osCanvas = document.createElement('canvas');
        osCanvas.width = width; osCanvas.height = height;
        const osCtx = osCanvas.getContext('2d');
        osCtx.drawImage(image, 0, 0, width, height);
        const imageData = osCtx.getImageData(0, 0, width, height);
        drawHalftone(imageData.data, width, height);
      }, 10);
      return () => clearTimeout(timeout);
    }
  }, [image, config, dimensions, mode]);

  // --- Video Pipeline ---
  useEffect(() => {
    if (mode === 'VIDEO' && videoUrl && canvasRef.current) {
       let requestID;
       const { width, height } = dimensions;
       canvasRef.current.width = width;
       canvasRef.current.height = height;
       const osCanvas = document.createElement('canvas');
       osCanvas.width = width; osCanvas.height = height;
       const osCtx = osCanvas.getContext('2d');
       const renderLoop = () => {
         if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
            osCtx.drawImage(videoRef.current, 0, 0, width, height);
            const imageData = osCtx.getImageData(0, 0, width, height);
            drawHalftone(imageData.data, width, height);
         }
         requestID = requestAnimationFrame(renderLoop);
       };
       renderLoop();
       return () => cancelAnimationFrame(requestID);
    }
  }, [mode, videoUrl, config, dimensions]);

  // --- 3D Pipeline (Vanilla Three.js Integration) ---
  useEffect(() => {
    if (mode === '3D' && modelFile && mountRef.current && canvasRef.current) {
       let requestID;
       let mixer;
       let isDragging = false;

       const rect = canvasRef.current.getBoundingClientRect();
       const width = rect.width;
       const height = rect.height;
       canvasRef.current.width = width;
       canvasRef.current.height = height;

       const scene = new THREE.Scene();
       const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
       const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
       renderer.setSize(width, height);
       renderer.setPixelRatio(1); 
       renderer.setClearColor(0x000000, 0); 
       mountRef.current.appendChild(renderer.domElement);

       const renderTarget = new THREE.WebGLRenderTarget(width, height, { format: THREE.RGBAFormat });
       const pixelBuffer = new Uint8Array(width * height * 4);

       const pmremGenerator = new THREE.PMREMGenerator(renderer);
       scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
       const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
       scene.add(ambientLight);
       const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
       dirLight.position.set(5, 10, 7.5);
       scene.add(dirLight);

       const controls = new OrbitControls(camera, renderer.domElement);
       controls.enableDamping = true;
       controls.dampingFactor = 0.05;
       controls.enableZoom = true;  
       controls.enablePan = false;
       controls.minDistance = 0.01;
       controls.maxDistance = 1000;
       controls.addEventListener('start', () => { isDragging = true; });
       controls.addEventListener('end', () => { isDragging = false; });

       const loader = new GLTFLoader();
       const dracoLoader = new DRACOLoader();
       dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
       loader.setDRACOLoader(dracoLoader);

       const reader = new FileReader();
       reader.onload = (e) => {
         const buffer = e.target.result;
         loader.parse(buffer, '', (gltf) => {
            const object = gltf.scene;
            object.rotation.set(0, 0, 0);
            object.updateMatrixWorld(true);
            object.rotation.x = -Math.PI / 2;
            object.rotation.z = 0; 
            const pivot = new THREE.Group();
            scene.add(pivot);
            pivot.add(object);
            const box = new THREE.Box3().setFromObject(object);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            object.position.sub(center);
            const maxDim = Math.max(size.x, size.y, size.z);
            const camZ = maxDim * 2.5;
            camera.position.set(0, 0, camZ);
            camera.lookAt(0, 0, 0); 
            camera.near = 0.001;
            camera.far = maxDim * 100;
            camera.updateProjectionMatrix();
            controls.minDistance = 0.01;
            controls.maxDistance = maxDim * 50;
            controls.target.set(0, 0, 0);
            controls.update();
            if (gltf.animations?.length) {
              mixer = new THREE.AnimationMixer(object);
              mixer.clipAction(gltf.animations[0]).play();
            }
            setLoading(false);

            const animate = () => {
              requestID = requestAnimationFrame(animate);
              const delta = new THREE.Clock().getDelta();
              if (mixer) mixer.update(delta);
              const c3d = config3DRef.current;
              if (!isDragging && !c3d.paused) {
                 if (c3d.axis === 'x') pivot.rotation.x += c3d.speed * 0.05;
                 if (c3d.axis === 'y') pivot.rotation.y += c3d.speed * 0.05;
                 if (c3d.axis === 'z') pivot.rotation.z += c3d.speed * 0.05;
              }
              const offsetRad = THREE.MathUtils.degToRad(c3d.offset);
              if (c3d.axis !== 'x') pivot.rotation.x = offsetRad;
              if (c3d.axis !== 'y') pivot.rotation.y = offsetRad;
              if (c3d.axis !== 'z') pivot.rotation.z = offsetRad;

              controls.update();
              renderer.setRenderTarget(renderTarget);
              renderer.clear();
              renderer.render(scene, camera);
              renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, pixelBuffer);
              renderer.setRenderTarget(null);
              drawHalftone(pixelBuffer, width, height); 
            };
            animate();
         });
       };
       reader.readAsArrayBuffer(modelFile);

       return () => {
         if (requestID) cancelAnimationFrame(requestID);
         // Cleanup geometry and materials
         if (scene) {
             scene.traverse((object) => {
                 if (object.geometry) object.geometry.dispose();
                 if (object.material) {
                     if (Array.isArray(object.material)) {
                         object.material.forEach(material => material.dispose());
                     } else {
                         object.material.dispose();
                     }
                 }
             });
         }
         if (mountRef.current && renderer.domElement) mountRef.current.removeChild(renderer.domElement);
         renderer.dispose();
         pmremGenerator.dispose();
         renderTarget.dispose();
         dracoLoader.dispose();
       };
    }
  }, [mode, modelFile]);

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-neutral-200 font-sans overflow-hidden relative selection:bg-white selection:text-black">
      
      {/* Background Decor */}
      {!image && !modelFile && !videoUrl && (
        <>
          <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-neutral-800/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-neutral-900/30 rounded-full blur-[150px] pointer-events-none" />
        </>
      )}

      {/* Hidden Video Element */}
      <video 
        ref={videoRef}
        src={videoUrl || ""}
        className="fixed top-0 left-0 opacity-0 pointer-events-none w-1 h-1"
        playsInline
        loop
        muted={configVideo.muted}
        autoPlay
        onLoadedMetadata={handleVideoMetadata}
      />

      {/* Toast */}
      {toast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full shadow-2xl z-50 flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 border border-white/20 font-sans">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">{toast}</span>
        </div>
      )}

      <header className="h-20 bg-white/[0.02] backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-10 shrink-0 z-20 font-sans">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <DotterIcon />
          </div>
          <span className="text-sm font-bold tracking-[0.4em] uppercase text-white">Dotter V3</span>
        </div>
        
        <div className="flex items-center space-x-3">
           {/* NEW 3D MODE BUTTON */}
           <button 
             className={`px-4 py-2 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-[0.1em] transition-all group ${mode === '3D' ? 'bg-white text-black' : 'bg-white/[0.03] text-neutral-400 hover:text-white'}`}
             onClick={() => fileInputRef.current.click()} 
             title="Upload 3D Model"
           >
             <Box className="w-4 h-4 inline-block mr-2 mb-0.5" />
             3D Mode
           </button>

           <div className="w-[1px] h-6 bg-white/10 mx-2"></div>

           <button className="p-3 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl border border-white/5 text-neutral-400 hover:text-white transition-all group font-sans" title="Share Preset">
             <Share2 className="w-4 h-4" />
           </button>
           
           <button 
             onClick={() => { setImage(null); setModelFile(null); setVideoUrl(null); setMode('2D'); showToast("Session Reset"); }} 
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

           {/* Export Dropdown Area */}
           <div className="relative">
             {mode === '3D' ? (
                <>
                  <button 
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    disabled={isRecording}
                    className="px-8 py-3 bg-white hover:bg-neutral-200 text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95 font-sans flex items-center gap-2"
                  >
                    {isRecording ? (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Recording...
                        </>
                    ) : "Export"}
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {isExportMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 flex flex-col font-sans">
                        <button 
                            onClick={() => {
                                handleDownload();
                                setIsExportMenuOpen(false);
                            }}
                            className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white hover:bg-white/5 transition-colors font-sans"
                        >
                            PNG Image
                        </button>
                        <button 
                            onClick={() => handleVideoExport(5)}
                            className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5 font-sans"
                        >
                            5s Video (WEBM)
                        </button>
                        <button 
                            onClick={() => handleVideoExport(10)}
                            className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5 font-sans"
                        >
                            10s Video (WEBM)
                        </button>
                    </div>
                  )}
                </>
             ) : (
               <button 
                 onClick={handleDownload}
                 className="px-8 py-3 bg-white hover:bg-neutral-200 text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95 font-sans"
               >
                 Export Output
               </button>
             )}
           </div>
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
              
              <div className="flex items-center justify-between mb-6 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Text Mode</span>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, textMode: !prev.textMode }))}
                  className={`w-10 h-5 rounded-full relative transition-all duration-500 ${config.textMode ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-all duration-500 ${config.textMode ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white/40'}`} />
                </button>
              </div>

              {config.textMode && (
                <div className="space-y-4 mb-8 bg-white/[0.03] p-4 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-2">
                   <div className="space-y-2">
                     <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Character Set</label>
                     <input 
                       type="text" 
                       value={config.textCharacters}
                       onChange={(e) => setConfig(prev => ({ ...prev, textCharacters: e.target.value }))}
                       className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-white/30"
                     />
                   </div>

                   <Select 
                     label="Font Family" 
                     value={config.textFont} 
                     options={[{value:'monospace', label:'Monospace'}, {value:'sans-serif', label:'Sans Serif'}, {value:'serif', label:'Serif'}]} 
                     onChange={(v) => setConfig(prev => ({ ...prev, textFont: v }))}
                     compact
                   />

                   <div className="flex items-center justify-between">
                     <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Map Density</span>
                     <button
                        onClick={() => setConfig(prev => ({ ...prev, textWeightMapping: !prev.textWeightMapping }))}
                        className={`w-8 h-4 rounded-full relative transition-all ${config.textWeightMapping ? 'bg-white' : 'bg-white/10'}`}
                      >
                        <span className={`absolute top-1 left-1 w-2 h-2 rounded-full transition-all ${config.textWeightMapping ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`} />
                      </button>
                   </div>
                </div>
              )}
              
              {!config.textMode && (
                config.colorMode === 'single' ? (
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
                )
              )}
            </Section>

            <Section title="Displacement">
              <Select label="Flow" value={config.explodeDirection} options={[{ value: 'radial', label: 'Radial' }, { value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }, { value: 'planar', label: 'Planar' }]} onChange={(v) => setConfig(prev => ({ ...prev, explodeDirection: v }))} />
              <Slider label="Intensity" value={config.explodeStrength} min={-100} max={100} step={1} onChange={(v) => setConfig(prev => ({ ...prev, explodeStrength: v }))} />
              <Slider label="Jitter" value={config.noiseVariation} min={0} max={50} step={1} onChange={(v) => setConfig(prev => ({ ...prev, noiseVariation: v }))} />
            </Section>
          </div>
        </div>

        {/* Viewport Area */}
        <main 
          className="flex-1 flex flex-col items-stretch overflow-hidden relative transition-colors duration-500 font-sans"
          style={{ backgroundColor: (image || modelFile || videoUrl) ? config.backgroundColor : 'transparent' }}
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

              {config.colorMode === 'single' && !config.textMode && (
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
           <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500 font-sans">
              
              {!image && !modelFile && !videoUrl && (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
              )}

              <div className="w-full h-full flex flex-col items-center justify-center relative z-0 font-sans">
                {image || modelFile || videoUrl ? (
                  <>
                    <div className="w-full h-full shadow-2xl shadow-black/20">
                      {/* 3D Invisible Layer */}
                      <div ref={mountRef} className={`absolute inset-0 z-10 pointer-events-auto ${mode === '3D' ? '' : 'hidden'}`} />

                      {/* Visible Canvas - Full Size */}
                      <canvas 
                        ref={canvasRef} 
                        className="w-full h-full block object-contain" 
                        style={{ imageRendering: 'auto' }} 
                      />
                    </div>

                    {/* 3D Minimal Controls Strip */}
                    {mode === '3D' && (
                      <div 
                        className="absolute bottom-16 z-20 flex items-center gap-4 px-4 py-2 rounded-2xl bg-neutral-800/30 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.32)] transition-all animate-in fade-in slide-in-from-bottom-4 duration-500"
                        style={{
                          backdropFilter: 'blur(20px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(180%)'
                        }}
                      >
                        {/* Play/Pause */}
                        <button 
                          onClick={() => setConfig3D(prev => ({ ...prev, paused: !prev.paused }))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/30 text-white transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                        >
                          {config3D.paused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                        </button>

                        <div className="w-[1px] h-6 bg-white/10 mx-1" />

                        {/* Speed Slider */}
                        <div className="flex items-center gap-2 group">
                          <RotateCw className="w-3 h-3 text-neutral-500" />
                          <input 
                            type="range" min="0" max="1" step="0.05"
                            value={config3D.speed}
                            onChange={(e) => setConfig3D(p => ({ ...p, speed: parseFloat(e.target.value) }))}
                            className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                          />
                        </div>

                        {/* Angle Slider */}
                        <div className="flex items-center gap-2 group ml-2">
                          <Globe className="w-3 h-3 text-neutral-500" />
                          <input 
                            type="range" min="-45" max="45" step="1"
                            value={config3D.offset}
                            onChange={(e) => setConfig3D(p => ({ ...p, offset: parseFloat(e.target.value) }))}
                            className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                          />
                        </div>

                        <div className="w-[1px] h-6 bg-white/10 mx-1" />

                        {/* Axis Toggle */}
                        <div className="flex items-center bg-black/20 rounded-lg p-0.5 shadow-inner">
                          {['x', 'y', 'z'].map(axis => (
                            <button
                              key={axis}
                              onClick={() => setConfig3D(p => ({ ...p, axis }))}
                              className={`w-6 h-6 flex items-center justify-center text-[9px] font-black uppercase rounded-md transition-all ${config3D.axis === axis ? 'bg-white/80 text-black shadow-sm' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                            >
                              {axis}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Video Controls Strip */}
                    {mode === 'VIDEO' && (
                      <div className="absolute bottom-16 flex items-center gap-4 bg-white/[0.03] backdrop-blur-xl border border-white/10 p-2 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 z-20">
                        <button 
                          onClick={toggleVideoPlay}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/20 text-white transition-colors"
                        >
                          {!configVideo.playing ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                        </button>
                        
                        <div className="w-[1px] h-6 bg-white/10 mx-1" />
                        
                        <button 
                          onClick={() => setConfigVideo(p => ({ ...p, muted: !p.muted }))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/20 text-white transition-colors"
                        >
                          {configVideo.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div onClick={() => fileInputRef.current.click()} className="group cursor-pointer relative scale-75 xl:scale-100 font-sans">
                    <div className="absolute -inset-6 bg-white/5 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <GlassCard className="p-12 rounded-[1.75rem] flex flex-col items-center space-y-6 border-white/20 group-hover:border-white/40 transition-all duration-700">
                      <div className="w-16 h-16 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/[0.08] transition-all duration-700">
                        <ImageIcon className="w-7 h-7 text-neutral-500 group-hover:text-white transition-all duration-700" />
                      </div>
                      <div className="text-center space-y-2 font-sans">
                        <h2 className="text-white text-lg font-light tracking-[0.2em] uppercase font-sans">Dotter System V3</h2>
                        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-neutral-500 group-hover:text-neutral-300 transition-colors font-sans">
                          Upload or drag your image here
                        </p>
                      </div>
                    </GlassCard>
                  </div>
                )}
                
                {/* Unified File Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*,.obj,.glb,.gltf,video/*" 
                  className="hidden font-sans" 
                  onChange={(e) => handleFile(e.target.files[0])} 
                />
              </div>
           </div>

           {/* Powered By Footer */}
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 opacity-30 pointer-events-none z-20">
             Powered by TrashyPeroCool
           </div>
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <MainContent />
  </ErrorBoundary>
);

export default App;
