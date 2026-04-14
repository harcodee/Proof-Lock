import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus } from 'lucide-react';
import { useStore } from '../store';
import { loginUser, getUserProfile, getCredential } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { addToast, setCurrentStep, setUserData, setCredential } = useStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      addToast('Please enter both username and password', 'error');
      return;
    }

    if (form.username === "Administrator" && form.password === "Administrator@123") {
      setCurrentStep('ADMIN');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser(form);
      const user = res.data;
      localStorage.setItem('user_id', user.user_id);

      if (!user.is_verified) {
        // Identity Register
        setUserData(user.user_id, { name: user.username }, null);
        setCurrentStep(2);
      } else {
        // Existing verified user
        const profileRes = await getUserProfile(user.user_id);
        setUserData(user.user_id, profileRes.data, profileRes.data.trust);

        try {
          const creds = await getCredential(user.user_id);
          if (creds.data) setCredential(creds.data);
        } catch (e) { }

        setCurrentStep(3); // Dashboard
      }
    } catch (err) {
      addToast(err.message || 'Login failed. Check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingSpinner message="Authenticating User Context..." />}
      </AnimatePresence>

      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >

          <h1 className="font-serif text-[36px] md:text-[48px] font-medium leading-[1.1] tracking-[-0.3px] text-[#E6EAF2] mb-4">
            Proof Lock
          </h1>
          <p className="text-zinc-400 max-w-md mx-auto text-sm md:text-base">
            Login to access your centralized identity ecosystem.
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
                placeholder="Enter username"
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
                placeholder="Enter password"
                required
              />
            </div>

            <button type="submit" className="btn-primary mt-4 py-3 text-sm tracking-wide flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" /> LOGIN TO PORTAL
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-500 border-t border-white/5 pt-6">
            Don't have an account?{' '}
            <button onClick={() => setCurrentStep(1.5)} className="text-blue-400 font-semibold hover:text-blue-300 transition">
              Create one
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
