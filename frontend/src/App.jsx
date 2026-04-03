import React, { useState, useCallback } from 'react';
import StepIndicator from './components/StepIndicator';
import Toast from './components/Toast';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CredentialPage from './pages/CredentialPage';
import VerifyPage from './pages/VerifyPage';

/**
 * Step mapping:
 *  1 → Register form
 *  2 → After registration (fraud check displayed inline, user clicks Continue)
 *  3 → Dashboard → issues credential → Credential view
 *  4 → ZK Proof generation
 *  5 → Service Verification result
 */

let toastCounter = 0;

export default function App() {
  // Global app state
  const [currentStep, setCurrentStep] = useState(1);
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [credential, setCredential] = useState(null);
  const [showCredentialView, setShowCredentialView] = useState(false);
  const [toasts, setToasts] = useState([]);

  // ─── Toast system ───────────────────────────────────────────
  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Navigation handlers ────────────────────────────────────

  /** Called when user clicks "Continue to Dashboard" after fraud check */
  const handleContinueToDashboard = (result) => {
    setUserId(result.user_id);
    setUserData({
      name: result.name,
      fraud_score: result.fraud_score,
      id_number_masked: '****',
    });
    setCurrentStep(3);
  };

  /** Called after credential is generated on DashboardPage */
  const handleCredentialIssued = (credData) => {
    if (credData) setCredential(credData);
    setShowCredentialView(true);
    // Step stays at 3 — credential is sub-view within step 3
  };

  /** Called from CredentialPage CTA */
  const handleGoToProof = () => {
    setCurrentStep(4);
  };

  /** Called from VerifyPage when verification result is shown */
  const handleVerifyStepChange = (step) => {
    setCurrentStep(step);
  };

  /** Full reset — takes user back to start */
  const handleReset = () => {
    setUserId(null);
    setUserData(null);
    setCredential(null);
    setCurrentStep(1);
    setShowCredentialView(false);
  };

  // ─── Page routing ───────────────────────────────────────────
  const renderPage = () => {
    // Steps 1 & 2: Registration form + inline fraud result
    if (currentStep <= 2) {
      return (
        <RegisterPage
          onSuccess={handleContinueToDashboard}
          addToast={addToast}
        />
      );
    }

    // Step 3: Dashboard → then Credential view (sub-step)
    if (currentStep === 3) {
      if (showCredentialView && credential) {
        return (
          <CredentialPage
            credential={credential}
            onNext={handleGoToProof}
          />
        );
      }
      return (
        <DashboardPage
          userId={userId}
          userData={userData}
          onCredentialIssued={handleCredentialIssued}
          addToast={addToast}
        />
      );
    }

    // Steps 4 & 5: ZKP generation + service verification
    if (currentStep >= 4) {
      return (
        <VerifyPage
          userId={userId}
          onReset={handleReset}
          addToast={addToast}
          onStepChange={handleVerifyStepChange}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <StepIndicator currentStep={currentStep} />
      <main>{renderPage()}</main>
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
