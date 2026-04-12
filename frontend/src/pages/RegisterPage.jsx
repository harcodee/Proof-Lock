import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, FileCheck2, User as UserIcon, Calendar, Fingerprint } from 'lucide-react';
import { useStore } from '../store';
import { registerUser } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import TrustScoreRing from '../components/TrustScoreRing';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', age: '', id_number: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const [cameraActive, setCameraActive] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [tempCapture, setTempCapture] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [livenessState, setLivenessState] = useState('IDLE');
  const [livenessInstruction, setLivenessInstruction] = useState('');

  const { userId, addToast, setUserData, setCurrentStep } = useStore();

  // Handle Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMediaStream(stream);
      setCameraActive(true);
      setLivenessState('IDLE');
      setLivenessInstruction('');
      recordedChunksRef.current = [];
    } catch (err) {
      addToast('Camera access is required.', 'error');
    }
  };

  useEffect(() => {
    if (cameraActive && videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [cameraActive, mediaStream]);

  const startVerification = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    setLivenessState('RECORDING');
    recordedChunksRef.current = [];
    
    // Support varying mime types depending on browser
    let mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';

    const stream = videoRef.current.srcObject;
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();

    // Guided instructions
    setLivenessInstruction('Turn your head LEFT');
    setTimeout(() => {
      if (livenessState !== 'PROCESSING') setLivenessInstruction('Turn your head RIGHT');
    }, 2000);
    setTimeout(() => {
      if (livenessState !== 'PROCESSING') setLivenessInstruction('Look STRAIGHT at the camera');
    }, 4500);
  };

  const finishVerification = () => {
    if (mediaRecorderRef.current && livenessState === 'RECORDING') {
      setLivenessState('PROCESSING');
      
      let captureDataUrl = null;
      if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
        captureDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      }

      mediaRecorderRef.current.onstop = () => uploadVideo(captureDataUrl);
      mediaRecorderRef.current.stop();
    }
  };

  const uploadVideo = async (captureDataUrl) => {
    try {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const vFile = new File([blob], "liveness.webm", { type: "video/webm" });
      setVideoFile(vFile);
      
      if (captureDataUrl) {
        setImagePreview(captureDataUrl);
        const res = await fetch(captureDataUrl);
        const imgBlob = await res.blob();
        setImageFile(new File([imgBlob], "webcam_capture.jpg", { type: "image/jpeg" }));
      }
      
      stopCamera();
      addToast('Liveness video securely captured', 'success');
    } catch (err) {
      addToast('Failed to process video.', 'error');
      setLivenessState('IDLE');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    setTempCapture(canvas.toDataURL('image/jpeg', 0.9));
  };

  const confirmCapture = () => {
    if (!tempCapture) return;
    setImagePreview(tempCapture);
    fetch(tempCapture)
      .then(res => res.blob())
      .then(blob => {
        setImageFile(new File([blob], "webcam_capture.jpg", { type: "image/jpeg" }));
        stopCamera();
      });
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setMediaStream(null);
    setTempCapture(null);
  };

  useEffect(() => {
    return () => stopCamera(); // Cleanup on unmount
  }, []);

  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('Please upload a valid image file.', 'error');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.age || !form.id_number.trim()) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('user_id', userId);
      fd.append('name', form.name.trim());
      fd.append('age', form.age);
      fd.append('id_number', form.id_number.trim());
      if (imageFile) fd.append('image', imageFile);
      if (videoFile) fd.append('video', videoFile);

      const res = await registerUser(fd);
      setResult(res.data);
      addToast('Identity processed successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    setUserData(result.user_id, {
      name: result.name,
      fraud_score: result.fraud_score,
      id_number_masked: '****',
    }, result.trust);
    setCurrentStep(3);
  };

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingSpinner message="Orchestrating Multi-Signal AI Verification..." />}
      </AnimatePresence>

      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4">
        
        {/* Header Text */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
            <span>🌍</span> Protocol v2.0 Live
          </div>
          <h1 className="font-serif text-[36px] md:text-[48px] font-medium leading-[1.1] tracking-[-0.3px] text-[#E6EAF2] mb-4">
            Secure Digital Intake
          </h1>
          <p className="text-zinc-400 max-w-md mx-auto text-sm md:text-base">
            Establish your identity once with military-grade AI. Share proof effortlessly anywhere.
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card w-full max-w-lg p-6 sm:p-8 relative overflow-hidden"
        >
          {/* Subtle decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
                  
                  {/* Info Fields row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="font-sans text-[11px] md:text-[12px] tracking-[1.5px] uppercase text-white/50 mb-2 flex items-center gap-2">
                        <UserIcon className="w-4 h-4" /> Full Legal Name
                      </label>
                      <input type="text" name="name" value={form.name} onChange={(e)=>setForm(f=>({...f, name: e.target.value}))} className="input-field" placeholder="John Doe" required />
                    </div>
                    <div>
                      <label className="font-sans text-[11px] md:text-[12px] tracking-[1.5px] uppercase text-white/50 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Age
                      </label>
                      <input type="number" name="age" value={form.age} onChange={(e)=>setForm(f=>({...f, age: e.target.value}))} className="input-field" placeholder="e.g. 28" min={1} required />
                    </div>
                    <div>
                      <label className="font-sans text-[11px] md:text-[12px] tracking-[1.5px] uppercase text-white/50 mb-2 flex items-center gap-2">
                        <Fingerprint className="w-4 h-4" /> ID Number
                      </label>
                      <input type="text" name="id_number" value={form.id_number} onChange={(e)=>setForm(f=>({...f, id_number: e.target.value}))} className="input-field" placeholder="Gov ID" required />
                    </div>
                  </div>

                  {/* Photo area */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-sans text-[11px] tracking-[1.5px] uppercase text-white/50 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-400" /> Biometric Capture
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono tracking-wider">REQ: FACE</span>
                    </div>

                    {!imagePreview ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={startCamera} className="glass-surface hover:bg-white/5 border-dashed border-zinc-700 py-6 flex flex-col items-center justify-center gap-2 rounded-xl transition-all">
                          <Camera className="w-6 h-6 text-blue-400" />
                          <span className="text-xs text-zinc-400 font-medium tracking-wide">Use Webcam</span>
                        </button>
                        <div 
                           onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                           onDragLeave={() => setDragOver(false)}
                           onDrop={(e) => { e.preventDefault(); setDragOver(false); handleImageFile(e.dataTransfer.files[0]); }}
                           onClick={() => fileInputRef.current?.click()}
                           className={`cursor-pointer border-dashed py-6 flex flex-col items-center justify-center gap-2 rounded-xl transition-all ${dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 glass-surface hover:bg-white/5'}`}
                        >
                          <Upload className="w-6 h-6 text-blue-400" />
                          <span className="text-xs text-zinc-400 font-medium tracking-wide">Upload File</span>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFile(e.target.files[0])} />
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-zinc-700 group h-40">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1"><FileCheck2 className="w-3 h-3"/> Image Locked</span>
                        </div>
                        <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); }} className="absolute top-2 right-2 bg-black/60 hover:bg-rose-500/80 text-white rounded-full p-1.5 backdrop-blur transition opacity-0 group-hover:opacity-100">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Camera Modal */}
                  {cameraActive && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                      <div className="bg-zinc-900/90 border border-blue-500/30 p-6 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden backdrop-blur-xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-[#E6EAF2] font-serif text-[20px] flex items-center gap-2">
                            <Camera className="w-5 h-5 text-blue-400"/> Live Liveness Check
                          </h3>
                          {livenessState === 'RECORDING' && (
                            <div className="flex items-center gap-2 animate-pulse">
                              <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                              <span className="text-xs text-rose-400 font-mono">RECORDING</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="relative rounded-xl overflow-hidden border border-zinc-700/50 bg-black aspect-[4/3] w-full flex flex-col items-center justify-center">
                          {tempCapture ? (
                            <img src={tempCapture} alt="captured" className="w-full h-full object-cover" />
                          ) : (
                            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-transform duration-500 ${livenessState === 'RECORDING' ? 'scale-[1.02]' : 'scale-100'}`} />
                          )}

                          {/* Instruction Overlay */}
                          <AnimatePresence mode="wait">
                            {livenessState === 'RECORDING' && livenessInstruction && !tempCapture && (
                              <motion.div 
                                key={livenessInstruction}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute bottom-6 px-6 py-2 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-full flex items-center gap-3 shadow-xl"
                              >
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                <span className="font-sans text-sm font-semibold tracking-wide text-blue-50">{livenessInstruction}</span>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {livenessState === 'PROCESSING' && (
                             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                <LoadingSpinner message="Processing verification..." />
                             </div>
                          )}
                        </div>
                        
                        <div className="mt-6 flex justify-end gap-3 relative z-10">
                          {livenessState !== 'PROCESSING' && (
                            <button type="button" onClick={stopCamera} className="px-4 py-2 border border-white/10 hover:bg-white/5 text-zinc-300 rounded-xl text-sm font-semibold transition">Cancel</button>
                          )}
                          
                          {livenessState === 'IDLE' && (
                            <button type="button" onClick={startVerification} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                              Start Verification
                            </button>
                          )}
                          
                          {livenessState === 'RECORDING' && (
                            <button type="button" onClick={finishVerification} className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-sm font-bold transition shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                              Finish
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <button type="submit" className="btn-primary mt-4 py-4 text-sm tracking-wide">
                    INITIATE VERIFICATION
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6 z-10 relative">
                
                <h2 className="font-serif text-[20px] md:text-[24px] font-medium text-[#E6EAF2]">Analysis Complete</h2>
                
                {/* Visual Trust Ring */}
                <TrustScoreRing score={result.trust.composite_score} tierLabel={result.trust.tier_label} size={150} />

                {/* Data Grid */}
                <div className="w-full bg-black/40 rounded-xl p-4 border border-white/5 space-y-3 font-mono text-sm">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-sans text-[11px] tracking-[1.5px] uppercase text-white/50">ID Array Hash</span>
                    <span className="text-blue-400">{(result.intake?.hash || "NO_IMG_PROV").substring(0,12)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-sans text-[11px] tracking-[1.5px] uppercase text-white/50">Liveness</span>
                    <span className={result.trust.signals.liveness.passed ? "text-emerald-400" : "text-amber-400"}>
                      {result.trust.signals.liveness.passed ? 'PASS' : 'WARN'} ({Math.round(result.trust.signals.liveness.score*100)}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-[11px] tracking-[1.5px] uppercase text-white/50">Auth Model</span>
                    <span className="text-zinc-300">{result.trust.model_version}</span>
                  </div>
                </div>

                <button onClick={handleContinue} className="btn-success w-full py-4 text-sm tracking-wide">
                  ENTER SECURE DASHBOARD →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
