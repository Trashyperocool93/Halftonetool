{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import React, \{ useState, useRef, useEffect, useCallback \} from 'react';\
import \{ Upload, Download, RefreshCw, Layers, Move, Palette, Zap, Image as ImageIcon, Share2, FolderInput, CheckCircle2 \} from 'lucide-react';\
\
// --- UI Components ---\
\
const Slider = (\{ label, value, min, max, step, onChange, unit = "" \}) => (\
  <div className="mb-4">\
    <div className="flex justify-between mb-1">\
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">\{label\}</label>\
      <span className="text-xs font-mono text-cyan-400">\{value\}\{unit\}</span>\
    </div>\
    <input\
      type="range"\
      min=\{min\}\
      max=\{max\}\
      step=\{step\}\
      value=\{value\}\
      onChange=\{(e) => onChange(parseFloat(e.target.value))\}\
      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"\
    />\
  </div>\
);\
\
const ColorPicker = (\{ label, value, onChange \}) => (\
  <div className="mb-4">\
    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">\{label\}</label>\
    <div className="flex items-center space-x-3 bg-slate-800 p-2 rounded-lg border border-slate-700">\
      <input\
        type="color"\
        value=\{value\}\
        onChange=\{(e) => onChange(e.target.value)\}\
        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"\
      />\
      <span className="text-xs font-mono text-slate-300 uppercase">\{value\}</span>\
    </div>\
  </div>\
);\
\
const Toggle = (\{ label, checked, onChange \}) => (\
  <div className="flex items-center justify-between mb-4 bg-slate-800 p-3 rounded-lg border border-slate-700">\
    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">\{label\}</span>\
    <button\
      onClick=\{() => onChange(!checked)\}\
      className=\{`w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out $\{checked ? 'bg-cyan-500' : 'bg-slate-600'\}`\}\
    >\
      <span className=\{`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform duration-200 ease-in-out $\{checked ? 'translate-x-5' : 'translate-x-0'\}`\} />\
    </button>\
  </div>\
);\
\
const Select = (\{ label, value, options, onChange \}) => (\
  <div className="mb-4">\
    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">\{label\}</label>\
    <select\
      value=\{value\}\
      onChange=\{(e) => onChange(e.target.value)\}\
      className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg border border-slate-700 p-2.5 focus:ring-cyan-500 focus:border-cyan-500 outline-none"\
    >\
      \{options.map((opt) => (\
        <option key=\{opt.value\} value=\{opt.value\}>\{opt.label\}</option>\
      ))\}\
    </select>\
  </div>\
);\
\
// --- Main App Component ---\
\
const App = () => \{\
  // State: Canvas & Image\
  const canvasRef = useRef(null);\
  const [image, setImage] = useState(null);\
  const [dimensions, setDimensions] = useState(\{ width: 800, height: 600 \});\
  const [toast, setToast] = useState(null);\
\
  // State: Parameters\
  const [config, setConfig] = useState(\{\
    // Stage 1: Preprocessing\
    contrastBoost: 1.2,\
    thresholdClamp: 0.1,\
    invert: false,\
    \
    // Stage 2: Grid\
    dotSpacing: 12,\
    lineDirection: 'horizontal', // 'horizontal' | 'vertical'\
    \
    // Stage 3: Color Modes\
    colorMode: 'single', // 'single' | 'quad'\
    backgroundColor: '#e2e8f0',\
    transparentBackground: false,\
\
    // Single Mode Settings\
    dotColor: '#000000',\
    dotSizeMin: 2,\
    dotSizeMax: 14,\
    dotShape: 0, // 0 = Circle, 1 = Line\
    \
    // Quad Mode Settings (4 bands)\
    // 0: Darkest, 3: Brightest\
    quadColors: ['#0f172a', '#334155', '#475569', '#ef4444'], \
    quadSizes: [12, 8, 4, 2], // Default diameters for bands\
    quadShapes: [0, 0, 0, 0], // 0 = Circle, 1 = Line for each band\
\
    // Stage 4: Explode/Physics\
    explodeStrength: 0,\
    explodeDirection: 'radial', \
    noiseVariation: 0,\
  \});\
\
  // Load default image on mount\
  useEffect(() => \{\
    const img = new Image();\
    img.crossOrigin = "anonymous";\
    img.src = "https://images.unsplash.com/photo-1517466787929-bc90951d6428?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";\
    img.onload = () => \{\
      setImage(img);\
      setDimensions(\{ width: img.width, height: img.height \});\
    \};\
  \}, []);\
\
  const handleImageUpload = (e) => \{\
    const file = e.target.files[0];\
    if (file) \{\
      const reader = new FileReader();\
      reader.onload = (event) => \{\
        const img = new Image();\
        img.onload = () => \{\
          setImage(img);\
          const maxDim = 1200;\
          let w = img.width;\
          let h = img.height;\
          \
          if (w > maxDim || h > maxDim) \{\
             const ratio = w / h;\
             if (w > h) \{\
               w = maxDim;\
               h = maxDim / ratio;\
             \} else \{\
               h = maxDim;\
               w = maxDim * ratio;\
             \}\
          \}\
          setDimensions(\{ width: w, height: h \});\
        \};\
        img.src = event.target.result;\
      \};\
      reader.readAsDataURL(file);\
    \}\
  \};\
\
  const handleDownload = () => \{\
    if (canvasRef.current) \{\
      const link = document.createElement('a');\
      link.download = 'halftone-poster.png';\
      link.href = canvasRef.current.toDataURL('image/png');\
      link.click();\
    \}\
  \};\
\
  // --- Share & Import Features ---\
\
  const showToast = (message) => \{\
    setToast(message);\
    setTimeout(() => setToast(null), 3000);\
  \};\
\
  const handleShareConfig = () => \{\
    try \{\
      const configStr = btoa(JSON.stringify(config));\
      navigator.clipboard.writeText(configStr);\
      showToast("Config copied to clipboard!");\
    \} catch (err) \{\
      showToast("Failed to copy config.");\
    \}\
  \};\
\
  const handleImportConfig = () => \{\
    const configStr = prompt("Paste your configuration code here:");\
    if (configStr) \{\
      try \{\
        const newConfig = JSON.parse(atob(configStr));\
        setConfig(prev => (\{ ...prev, ...newConfig \}));\
        showToast("Config imported successfully!");\
      \} catch (e) \{\
        showToast("Invalid configuration code.");\
      \}\
    \}\
  \};\
\
  const updateQuadConfig = (index, field, value) => \{\
    setConfig(prev => \{\
      const newArr = [...prev[field]];\
      newArr[index] = value;\
      return \{ ...prev, [field]: newArr \};\
    \});\
  \};\
\
  // --- The Core Image Processing Engine ---\
  const processImage = useCallback(() => \{\
    if (!image || !canvasRef.current) return;\
\
    const ctx = canvasRef.current.getContext('2d');\
    const \{ width, height \} = dimensions;\
\
    // 1. Setup Canvas\
    canvasRef.current.width = width;\
    canvasRef.current.height = height;\
\
    // 2. Create Offscreen canvas to read pixel data\
    const osCanvas = document.createElement('canvas');\
    osCanvas.width = width;\
    osCanvas.height = height;\
    const osCtx = osCanvas.getContext('2d');\
    osCtx.drawImage(image, 0, 0, width, height);\
    \
    // Get raw pixel data\
    const imageData = osCtx.getImageData(0, 0, width, height);\
    const data = imageData.data;\
\
    // 3. Fill Background\
    if (config.transparentBackground) \{\
      ctx.clearRect(0, 0, width, height);\
    \} else \{\
      ctx.fillStyle = config.backgroundColor;\
      ctx.fillRect(0, 0, width, height);\
    \}\
    \
    // 4. Pre-calculate constants\
    const centerX = width / 2;\
    const centerY = height / 2;\
    const spacing = Math.max(2, config.dotSpacing);\
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);\
\
    // 5. Grid Loop\
    for (let y = 0; y < height; y += spacing) \{\
      for (let x = 0; x < width; x += spacing) \{\
        \
        const i = (Math.floor(y) * width + Math.floor(x)) * 4;\
        const r = data[i];\
        const g = data[i + 1];\
        const b = data[i + 2];\
        const a = data[i + 3];\
\
        if (a < 50) continue;\
\
        // --- Stage 1: Preprocessing ---\
        let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;\
\
        if (config.invert) brightness = 1.0 - brightness;\
\
        if (config.contrastBoost !== 1) \{\
          brightness = (brightness - 0.5) * config.contrastBoost + 0.5;\
        \}\
\
        if (brightness < config.thresholdClamp) brightness = 0;\
        if (brightness > (1 - config.thresholdClamp)) brightness = 1;\
        \
        brightness = Math.max(0, Math.min(1, brightness));\
\
        // --- Stage 2 & 3: Size & Color & Shape Determination ---\
        \
        let radius = 0;\
        let shapeFactor = 0;\
        let color = '#000000';\
        \
        if (config.colorMode === 'quad') \{\
            // Quad Mode: Fixed steps based on brightness bands\
            let bandIndex = 0;\
            if (brightness > 0.75) bandIndex = 3;\
            else if (brightness > 0.50) bandIndex = 2;\
            else if (brightness > 0.25) bandIndex = 1;\
            else bandIndex = 0;\
\
            color = config.quadColors[bandIndex];\
            radius = config.quadSizes[bandIndex] / 2;\
            shapeFactor = config.quadShapes[bandIndex];\
            \
        \} else \{\
            // Single Mode: Continuous gradient\
            color = config.dotColor;\
            radius = (config.dotSizeMin + brightness * (config.dotSizeMax - config.dotSizeMin)) / 2;\
            shapeFactor = config.dotShape;\
        \}\
\
        if (radius <= 0.5) continue; \
\
        // --- Stage 4: Explode & Physics ---\
        let drawX = x;\
        let drawY = y;\
\
        if (config.explodeStrength > 0 || config.noiseVariation > 0) \{\
          const dx = x - centerX;\
          const dy = y - centerY;\
          const dist = Math.sqrt(dx * dx + dy * dy);\
          const normDist = dist / maxDist;\
\
          let shift = config.explodeStrength * 5;\
          \
          const noiseX = (Math.random() - 0.5) * config.noiseVariation;\
          const noiseY = (Math.random() - 0.5) * config.noiseVariation;\
\
          if (config.explodeDirection === 'radial') \{\
             const explodeFactor = shift * (normDist * normDist); \
             drawX += (dx / dist) * explodeFactor + noiseX;\
             drawY += (dy / dist) * explodeFactor + noiseY;\
          \} else if (config.explodeDirection === 'horizontal') \{\
             drawX += shift * (1 - brightness) + noiseX;\
             drawY += noiseY;\
          \} else if (config.explodeDirection === 'vertical') \{\
             drawY += shift * (1 - brightness) + noiseY;\
             drawX += noiseX;\
          \}\
        \}\
\
        // --- Stage 5: Draw ---\
        \
        // METHOD: Stroke with Round Cap\
        // This simulates "duplicating the circle on itself" to create a line\
        // without distorting the curvature of the endpoints.\
        \
        const extension = (spacing * 1.1) * shapeFactor; // 1.1 ensures slight overlap for solid lines\
        \
        ctx.beginPath();\
        \
        if (extension <= 1) \{\
          // Just a dot\
          ctx.fillStyle = color;\
          ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);\
          ctx.fill();\
        \} else \{\
          // A line/pill shape\
          ctx.strokeStyle = color;\
          ctx.lineWidth = radius * 2;\
          ctx.lineCap = 'round';\
          \
          ctx.moveTo(drawX, drawY);\
          \
          if (config.lineDirection === 'vertical') \{\
             ctx.moveTo(drawX, drawY - extension / 2);\
             ctx.lineTo(drawX, drawY + extension / 2);\
          \} else \{\
             // Horizontal default\
             ctx.moveTo(drawX - extension / 2, drawY);\
             ctx.lineTo(drawX + extension / 2, drawY);\
          \}\
          \
          ctx.stroke();\
        \}\
      \}\
    \}\
    \
  \}, [image, dimensions, config]);\
\
  useEffect(() => \{\
    let timeout;\
    timeout = setTimeout(() => \{\
      processImage();\
    \}, 10);\
    return () => clearTimeout(timeout);\
  \}, [processImage]);\
\
  return (\
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">\
      \
      \{/* Toast Notification */\}\
      \{toast && (\
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-cyan-600 text-white px-4 py-2 rounded-lg shadow-xl z-50 flex items-center space-x-2 animate-in fade-in slide-in-from-top-4">\
          <CheckCircle2 className="w-4 h-4" />\
          <span className="text-sm font-medium">\{toast\}</span>\
        </div>\
      )\}\
\
      \{/* Header */\}\
      <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shrink-0 z-10">\
        <div className="flex items-center space-x-3">\
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-md flex items-center justify-center">\
            <Zap className="w-5 h-5 text-white" />\
          </div>\
          <h1 className="text-lg font-bold tracking-tight text-white hidden md:block">\
            PUNCH<span className="text-cyan-400">TONE</span> <span className="text-slate-500 font-normal text-sm ml-2">Halftone Engine</span>\
          </h1>\
        </div>\
        \
        <div className="flex items-center space-x-2">\
          \{/* Share Tools */\}\
          <div className="flex items-center space-x-1 mr-4 border-r border-slate-800 pr-4">\
             <button \
                onClick=\{handleShareConfig\}\
                title="Copy Preset Code"\
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"\
             >\
                <Share2 className="w-4 h-4" />\
             </button>\
             <button \
                onClick=\{handleImportConfig\}\
                title="Import Preset Code"\
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"\
             >\
                <FolderInput className="w-4 h-4" />\
             </button>\
          </div>\
\
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors">\
            <Upload className="w-4 h-4" />\
            <span className="hidden sm:inline">Load Image</span>\
            <input type="file" accept="image/*" className="hidden" onChange=\{handleImageUpload\} />\
          </label>\
          <button \
            onClick=\{handleDownload\}\
            className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-cyan-900/20 transition-all hover:scale-105"\
          >\
            <Download className="w-4 h-4" />\
            <span className="hidden sm:inline">Export PNG</span>\
          </button>\
        </div>\
      </header>\
\
      \{/* Main Content Area */\}\
      <div className="flex flex-1 overflow-hidden">\
        \
        \{/* Controls Sidebar */\}\
        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto custom-scrollbar shrink-0">\
          <div className="p-6 space-y-8">\
            \
            \{/* Group 1: Preprocessing */\}\
            <div className="space-y-4">\
              <div className="flex items-center space-x-2 text-cyan-400 mb-4 border-b border-slate-800 pb-2">\
                <Layers className="w-4 h-4" />\
                <h3 className="text-sm font-bold uppercase tracking-wider">Preprocessing</h3>\
              </div>\
              \
              <Slider \
                label="Contrast Boost" \
                value=\{config.contrastBoost\} \
                min=\{0.5\} max=\{3.0\} step=\{0.1\} \
                onChange=\{(v) => setConfig(prev => (\{ ...prev, contrastBoost: v \}))\} \
              />\
              <Slider \
                label="Threshold Clamp" \
                value=\{config.thresholdClamp\} \
                min=\{0\} max=\{0.45\} step=\{0.01\} \
                onChange=\{(v) => setConfig(prev => (\{ ...prev, thresholdClamp: v \}))\} \
              />\
              <Toggle \
                label="Invert Source" \
                checked=\{config.invert\} \
                onChange=\{(v) => setConfig(prev => (\{ ...prev, invert: v \}))\} \
              />\
            </div>\
\
            \{/* Group 2: Grid & Dots */\}\
            <div className="space-y-4">\
              <div className="flex items-center space-x-2 text-cyan-400 mb-4 border-b border-slate-800 pb-2">\
                <ImageIcon className="w-4 h-4" />\
                <h3 className="text-sm font-bold uppercase tracking-wider">Grid Matrix</h3>\
              </div>\
              \
              <Slider \
                label="Grid Spacing" \
                value=\{config.dotSpacing\} \
                min=\{4\} max=\{60\} step=\{1\} unit="px"\
                onChange=\{(v) => setConfig(prev => (\{ ...prev, dotSpacing: v \}))\} \
              />\
              \
              <Select \
                label="Line Direction"\
                value=\{config.lineDirection\}\
                options=\{[\
                  \{ value: 'horizontal', label: 'Horizontal (\'97)' \},\
                  \{ value: 'vertical', label: 'Vertical (|)' \},\
                ]\}\
                onChange=\{(v) => setConfig(prev => (\{ ...prev, lineDirection: v \}))\}\
              />\
\
              \{config.colorMode === 'single' && (\
                <>\
                  <div className="grid grid-cols-2 gap-4">\
                    <Slider \
                      label="Min Size" \
                      value=\{config.dotSizeMin\} \
                      min=\{0\} max=\{20\} step=\{1\} unit="px"\
                      onChange=\{(v) => setConfig(prev => (\{ ...prev, dotSizeMin: v \}))\} \
                    />\
                    <Slider \
                      label="Max Size" \
                      value=\{config.dotSizeMax\} \
                      min=\{1\} max=\{100\} step=\{1\} unit="px"\
                      onChange=\{(v) => setConfig(prev => (\{ ...prev, dotSizeMax: v \}))\} \
                    />\
                  </div>\
                  <Slider \
                    label="Dot Shape (Circle \uc0\u8594  Line)" \
                    value=\{config.dotShape\} \
                    min=\{0\} max=\{1\} step=\{0.05\} \
                    onChange=\{(v) => setConfig(prev => (\{ ...prev, dotShape: v \}))\} \
                  />\
                </>\
              )\}\
            </div>\
\
            \{/* Group 3: Color */\}\
            <div className="space-y-4">\
              <div className="flex items-center space-x-2 text-cyan-400 mb-4 border-b border-slate-800 pb-2">\
                <Palette className="w-4 h-4" />\
                <h3 className="text-sm font-bold uppercase tracking-wider">Color Grade</h3>\
              </div>\
              \
              <div className=\{config.transparentBackground ? "opacity-50 pointer-events-none grayscale mb-4" : "mb-4"\}>\
                <ColorPicker \
                  label="Background Paper" \
                  value=\{config.backgroundColor\} \
                  onChange=\{(v) => setConfig(prev => (\{ ...prev, backgroundColor: v \}))\} \
                />\
              </div>\
\
              <Toggle \
                label="Transparent Background" \
                checked=\{config.transparentBackground\} \
                onChange=\{(v) => setConfig(prev => (\{ ...prev, transparentBackground: v \}))\} \
              />\
\
              <div className="mt-4 pt-4 border-t border-slate-800">\
                <Select \
                   label="Dot Mode"\
                   value=\{config.colorMode\}\
                   options=\{[\
                     \{ value: 'single', label: 'Single Color (Gradient Size)' \},\
                     \{ value: 'quad', label: '4-Color Split (Fixed Sizes)' \},\
                   ]\}\
                   onChange=\{(v) => setConfig(prev => (\{ ...prev, colorMode: v \}))\}\
                />\
\
                \{config.colorMode === 'single' && (\
                   <ColorPicker \
                    label="Dot Ink" \
                    value=\{config.dotColor\} \
                    onChange=\{(v) => setConfig(prev => (\{ ...prev, dotColor: v \}))\} \
                  />\
                )\}\
                \
                \{config.colorMode === 'quad' && (\
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 bg-slate-800/50 p-3 rounded-lg">\
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold">Brightness Bands (Size & Shape)</p>\
                    \
                    \{['Dark', 'Mid-D', 'Mid-L', 'Lite'].map((label, idx) => (\
                      <div key=\{idx\} className="flex items-start space-x-2 pt-1 border-t border-white/5 first:border-0 first:pt-0">\
                         \{/* Color */\}\
                         <input \
                           type="color" \
                           value=\{config.quadColors[idx]\} \
                           onChange=\{(e) => updateQuadConfig(idx, 'quadColors', e.target.value)\} \
                           className="w-6 h-6 rounded bg-transparent border-0 p-0 cursor-pointer mt-1"\
                         />\
                         \
                         <div className="flex-1 flex flex-col space-y-2">\
                            \{/* Size Control */\}\
                            <div className="flex items-center space-x-2">\
                               <span className="text-[8px] uppercase text-slate-500 w-6">Size</span>\
                               <input \
                                 type="range" min="0" max="40" \
                                 value=\{config.quadSizes[idx]\} \
                                 onChange=\{(e) => updateQuadConfig(idx, 'quadSizes', parseFloat(e.target.value))\} \
                                 className="flex-1 h-1 bg-slate-600 rounded-lg accent-slate-400" \
                               />\
                               <span className="text-[10px] font-mono w-5 text-right">\{config.quadSizes[idx]\}</span>\
                            </div>\
                            \
                            \{/* Shape Control */\}\
                            <div className="flex items-center space-x-2">\
                               <span className="text-[8px] uppercase text-slate-500 w-6">Line</span>\
                               <input \
                                 type="range" min="0" max="1" step="0.05"\
                                 value=\{config.quadShapes[idx]\} \
                                 onChange=\{(e) => updateQuadConfig(idx, 'quadShapes', parseFloat(e.target.value))\} \
                                 className="flex-1 h-1 bg-slate-600 rounded-lg accent-cyan-500" \
                               />\
                               <span className="text-[10px] font-mono w-5 text-right">\{(config.quadShapes[idx] * 10).toFixed(0)\}</span>\
                            </div>\
                         </div>\
                         \
                         <span className="text-[9px] text-slate-400 uppercase w-8 text-right font-medium self-center">\{label\}</span>\
                      </div>\
                    ))\}\
                  </div>\
                )\}\
              </div>\
            </div>\
\
            \{/* Group 4: Physics */\}\
            <div className="space-y-4">\
              <div className="flex items-center space-x-2 text-cyan-400 mb-4 border-b border-slate-800 pb-2">\
                <Move className="w-4 h-4" />\
                <h3 className="text-sm font-bold uppercase tracking-wider">Displacement</h3>\
              </div>\
              \
              <Select \
                label="Explode Direction"\
                value=\{config.explodeDirection\}\
                options=\{[\
                  \{ value: 'radial', label: 'Radial (Center Out)' \},\
                  \{ value: 'horizontal', label: 'Horizontal (Wind)' \},\
                  \{ value: 'vertical', label: 'Vertical (Rain)' \},\
                ]\}\
                onChange=\{(v) => setConfig(prev => (\{ ...prev, explodeDirection: v \}))\}\
              />\
              <Slider \
                label="Explode Strength" \
                value=\{config.explodeStrength\} \
                min=\{0\} max=\{100\} step=\{1\} \
                onChange=\{(v) => setConfig(prev => (\{ ...prev, explodeStrength: v \}))\} \
              />\
              <Slider \
                label="Noise / Jitter" \
                value=\{config.noiseVariation\} \
                min=\{0\} max=\{50\} step=\{1\} \
                onChange=\{(v) => setConfig(prev => (\{ ...prev, noiseVariation: v \}))\} \
              />\
            </div>\
\
          </div>\
          \
          <div className="p-4 border-t border-slate-800 text-center">\
            <button \
              onClick=\{() => \{\
                setConfig(\{\
                  contrastBoost: 1.2,\
                  thresholdClamp: 0.1,\
                  dotSpacing: 12,\
                  lineDirection: 'horizontal',\
                  colorMode: 'single',\
                  dotColor: '#000000',\
                  dotSizeMin: 2,\
                  dotSizeMax: 14,\
                  dotShape: 0,\
                  backgroundColor: '#e2e8f0',\
                  transparentBackground: false,\
                  quadColors: ['#0f172a', '#334155', '#475569', '#ef4444'], \
                  quadSizes: [12, 8, 4, 2],\
                  quadShapes: [0, 0, 0, 0],\
                  invert: false,\
                  explodeStrength: 0,\
                  explodeDirection: 'radial',\
                  noiseVariation: 0,\
                \})\
              \}\}\
              className="text-xs text-slate-500 hover:text-cyan-400 flex items-center justify-center space-x-2 mx-auto transition-colors"\
            >\
              <RefreshCw className="w-3 h-3" />\
              <span>Reset Defaults</span>\
            </button>\
          </div>\
        </div>\
\
        \{/* Canvas Area */\}\
        <div className="flex-1 bg-slate-950 p-8 flex items-center justify-center overflow-auto relative checkerboard-bg">\
           \{/* Decorative Grid Background */\}\
           <div className="absolute inset-0 opacity-5 pointer-events-none" \
                style=\{\{backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', backgroundSize: '20px 20px'\}\}>\
           </div>\
\
           <div className="relative shadow-2xl shadow-black/50 border border-slate-800">\
              \{!image && (\
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 z-10 bg-slate-900/50 backdrop-blur-sm">\
                  <div className="text-center">\
                    <p>Loading Engine...</p>\
                  </div>\
                </div>\
              )\}\
              <canvas \
                ref=\{canvasRef\} \
                className="max-w-full max-h-[85vh] block"\
                style=\{\{ imageRendering: 'pixelated' \}\}\
              />\
           </div>\
        </div>\
\
      </div>\
      \
      \{/* Styles for custom scrollbar */\}\
      <style>\{`\
        .custom-scrollbar::-webkit-scrollbar \{\
          width: 6px;\
        \}\
        .custom-scrollbar::-webkit-scrollbar-track \{\
          background: #0f172a; \
        \}\
        .custom-scrollbar::-webkit-scrollbar-thumb \{\
          background: #334155; \
          border-radius: 3px;\
        \}\
        .custom-scrollbar::-webkit-scrollbar-thumb:hover \{\
          background: #475569; \
        \}\
      `\}</style>\
    </div>\
  );\
\};\
\
export default App;}