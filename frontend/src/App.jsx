import React from 'react';
import StepIndicator from './components/StepIndicator';
import Toast from './components/Toast';
import LoginPage from './pages/LoginPage';
import RegisterAuthPage from './pages/RegisterAuthPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CredentialPage from './pages/CredentialPage';
import VerifyPage from './pages/VerifyPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { useStore } from './store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getUserProfile, getCredential } from './api/client';
import { useEffect } from 'react';

const queryClient = new QueryClient();

export default function App() {
  const currentStep = useStore(state => state.currentStep);
  const toasts = useStore(state => state.toasts);
  const removeToast = useStore(state => state.removeToast);
  const showCredentialView = useStore(state => !!state.credential);

  const setUserData = useStore(state => state.setUserData);
  const setCredential = useStore(state => state.setCredential);
  const setCurrentStep = useStore(state => state.setCurrentStep);

  useEffect(() => {
    // DEV OVERRIDE: Disabled auto-login so you always start at the login/registration page upon reload
    /*
    const autoLogin = async () => {
      const storedId = localStorage.getItem('user_id');
      if (storedId) {
        try {
          const profileRes = await getUserProfile(storedId);
          const user = profileRes.data;
          setUserData(storedId, user, user.trust);
          
          if (!user.is_verified) {
             setCurrentStep(2);
          } else {
             try {
               const creds = await getCredential(storedId);
               if (creds.data) setCredential(creds.data);
             } catch(e) {}
             setCurrentStep(3);
          }
        } catch (err) {
           console.error("Auto-login failed:", err);
           localStorage.removeItem('user_id');
           setCurrentStep(1);
        }
      }
    };
    autoLogin();
    */
  }, []);

  const renderPage = () => {
    if (currentStep === 'ADMIN') return <AdminDashboardPage />;
    if (currentStep === 1) return <LoginPage />;
    if (currentStep === 1.5) return <RegisterAuthPage />;
    if (currentStep === 2) return <RegisterPage />;

    if (currentStep === 3) {
      if (showCredentialView) {
        return <CredentialPage />;
      }
      return <DashboardPage />;
    }

    if (currentStep >= 4) {
      return <VerifyPage />;
    }

    return null;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background font-sans text-zinc-300 selection:bg-blue-500/30">
        {currentStep !== 1 && currentStep !== 1.5 && currentStep !== 'ADMIN' && (
          <StepIndicator currentStep={currentStep} />
        )}
        <main className="relative overflow-hidden min-h-[calc(100vh-100px)]">
          {/* Global blur ambient background */}
          <div className="fixed top-0 left-1/4 w-[800px] h-[800px] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none animate-pulse-slow" />
          <div className="fixed bottom-0 right-1/4 w-[1000px] h-[1000px] bg-blue-900/10 blur-[200px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            {renderPage()}
          </div>
        </main>
        <Toast toasts={toasts} removeToast={removeToast} />
      </div>
    </QueryClientProvider>
  );
}
