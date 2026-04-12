import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { useStore } from '../store';
import { registerAuthUser } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

export default function RegisterAuthPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { addToast, setCurrentStep } = useStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      addToast('Please fill out all fields', 'error');
      return;
    }
    
    setLoading(true);
    try {
      await registerAuthUser(form);
      addToast('Registration successful! Please log in.', 'success');
      setCurrentStep(1); // Go back to login
    } catch (err) {
      addToast(err.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingSpinner message="Creating Identity Profile..." />}
      </AnimatePresence>

      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
            <span>✨</span> New Profile
          </div>
          <h1 className="font-serif text-[36px] md:text-[48px] font-medium leading-[1.1] tracking-[-0.3px] text-[#E6EAF2] mb-4">
            Join Platform
          </h1>
          <p className="text-zinc-400 max-w-md mx-auto text-sm md:text-base">
            Create an account to begin the identity verification process.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card w-full max-w-sm p-6 sm:p-8 relative overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
            <div>
              <label className="font-sans text-[11px] md:text-[12px] tracking-[1.5px] uppercase text-white/50 block mb-2">
                Username
              </label>
              <input 
                type="text" 
                value={form.username} 
                onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))} 
                className="input-field w-full"
                placeholder="Choose a username" 
                required 
              />
            </div>
            <div>
              <label className="font-sans text-[11px] md:text-[12px] tracking-[1.5px] uppercase text-white/50 block mb-2">
                Email
              </label>
              <input 
                type="email" 
                value={form.email} 
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} 
                className="input-field w-full"
                placeholder="your@email.com" 
                required 
              />
            </div>
            <div>
              <label className="font-sans text-[11px] md:text-[12px] tracking-[1.5px] uppercase text-white/50 block mb-2">
                Password
              </label>
              <input 
                type="password" 
                value={form.password} 
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} 
                className="input-field w-full"
                placeholder="Create a password" 
                required 
              />
            </div>
            
            <button type="submit" className="btn-primary mt-4 py-3 text-sm tracking-wide flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" /> CREATE ACCOUNT
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-500 border-t border-white/5 pt-6">
            Already have an account?{' '}
            <button onClick={() => setCurrentStep(1)} className="text-blue-400 font-semibold hover:text-blue-300 transition flex items-center gap-1 justify-center mx-auto mt-2 cursor-pointer">
               <ArrowLeft className="w-3 h-3"/> Back to Login
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
