import React, { useState, useRef } from 'react';
import { registerUser } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import FraudBadge from '../components/FraudBadge';

export default function RegisterPage({ onSuccess, addToast }) {
  const [form, setForm] = useState({ name: '', age: '', id_number: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

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

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleImageFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.age || !form.id_number.trim()) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }
    if (parseInt(form.age) <= 0 || parseInt(form.age) > 120) {
      addToast('Age must be between 1 and 120.', 'error');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('age', form.age);
      fd.append('id_number', form.id_number.trim());
      if (imageFile) fd.append('image', imageFile);

      const res = await registerUser(fd);
      setResult(res.data);
      addToast('Identity registered successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <LoadingSpinner message="Running AI Fraud Analysis... 🤖" />}

      <div className="min-h-screen bg-grid flex flex-col items-center justify-center px-4 py-12">
        {/* Hero text */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-4 py-1.5 text-xs font-semibold mb-4 tracking-wide uppercase">
            <span>🌐</span> SDG 10 · Reduced Inequalities
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            <span className="text-gradient">Digital Identity</span> Platform
          </h1>
          <p className="text-slate-500 text-base max-w-sm mx-auto">
            Verify once. Prove eligibility anywhere. <strong>Share proof, not data.</strong>
          </p>
        </div>

        {/* Registration card */}
        <div className="card w-full max-w-md p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {!result ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg">🛡️</div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Verify Your Identity</h2>
                  <p className="text-xs text-slate-500">One-time verification. Reusable forever.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="input-field"
                    required
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    placeholder="Your age"
                    min={1}
                    max={120}
                    className="input-field"
                    required
                  />
                </div>

                {/* ID Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">ID Number *</label>
                  <input
                    type="text"
                    name="id_number"
                    value={form.id_number}
                    onChange={handleChange}
                    placeholder="Aadhaar / PAN / Passport"
                    className="input-field"
                    required
                  />
                </div>

                {/* Image upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Photo <span className="text-slate-400 normal-case font-normal">(optional — improves AI detection)</span>
                  </label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200
                      ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFile(e.target.files[0])}
                    />
                    {imagePreview ? (
                      <div className="flex items-center gap-3">
                        <img src={imagePreview} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-slate-200" />
                        <div className="text-left">
                          <p className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">{imageFile?.name}</p>
                          <p className="text-xs text-slate-500">Click to change photo</p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2">
                        <div className="text-2xl mb-1">📷</div>
                        <p className="text-sm text-slate-600 font-medium">Drag & drop or click to upload</p>
                        <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WEBP accepted</p>
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full mt-2" id="register-submit-btn">
                  <span>Verify Identity</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            /* Success result */
            <div className="animate-bounce-in flex flex-col gap-5">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 ring-4 ring-emerald-200">
                  ✅
                </div>
                <h2 className="text-xl font-bold text-slate-900">Identity Verified!</h2>
                <p className="text-slate-500 text-sm mt-1">AI fraud analysis complete</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</span>
                  <span className="text-slate-800 font-semibold">{result.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">User ID</span>
                  <span className="text-slate-800 font-mono font-semibold">#{result.user_id}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-0.5">AI Risk Score</span>
                  <FraudBadge score={result.fraud_score} showDescription />
                </div>
              </div>

              <button
                id="continue-to-dashboard-btn"
                className="btn-primary w-full"
                onClick={() => onSuccess(result)}
              >
                <span>Continue to Dashboard</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Bottom note */}
        <p className="mt-6 text-xs text-slate-400 text-center max-w-sm">
          🔒 Your data is processed locally and never shared with third parties without your explicit consent.
        </p>
      </div>
    </>
  );
}
