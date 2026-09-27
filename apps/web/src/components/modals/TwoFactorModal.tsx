'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Copy, Check } from 'lucide-react';
import { api } from '@/lib/api';

interface TwoFactorModalProps {
  onClose: () => void;
  is2FAEnabled: boolean;
  onSuccess: () => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  onClose,
  is2FAEnabled,
  onSuccess,
}) => {
  const [step, setStep] = useState<'INIT' | 'SETUP' | 'VERIFY'>('INIT');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/privacy/2fa/setup');
      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
      setStep('SETUP');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to initialize 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!token || token.length !== 6) {
      setError('Please enter a valid 6-digit TOTP code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/privacy/2fa/verify', { token });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!token || token.length !== 6) {
      setError('Please enter your 6-digit TOTP code to disable 2FA');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/privacy/2fa/disable', { token });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#17212B] border border-[#2b394a] rounded-2xl shadow-2xl p-6 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-full bg-[#2AABEE]/10 text-[#2AABEE]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Two-Factor Authentication</h3>
            <p className="text-xs text-gray-400">Secure your NexChat account with TOTP</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {is2FAEnabled ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium text-center">
              ✓ Two-Factor Authentication is active
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Enter 6-digit TOTP code to disable 2FA
              </label>
              <input
                type="text"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="000000"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0e1621] border border-[#2b394a] text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-[#2AABEE]"
              />
            </div>
            <button
              onClick={handleDisable}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        ) : step === 'INIT' ? (
          <div className="space-y-5 text-center">
            <p className="text-sm text-gray-300">
              Add an extra layer of security to your NexChat account by requiring a 6-digit code from Google Authenticator, Authy, or 1Password when logging in.
            </p>
            <button
              onClick={handleStartSetup}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#2AABEE] hover:bg-[#2297d6] text-white font-semibold shadow-lg shadow-[#2AABEE]/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Generating Secret...' : 'Set Up 2FA'}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl">
              {qrCodeUrl && <img src={qrCodeUrl} alt="2FA QR Code" className="w-44 h-44" />}
            </div>

            {/* Secret key text */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0e1621] border border-[#2b394a]">
              <span className="text-xs font-mono text-gray-300 truncate">{secret}</span>
              <button
                onClick={handleCopySecret}
                className="ml-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Code Verification Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Enter code from authenticator app
              </label>
              <input
                type="text"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="000000"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0e1621] border border-[#2b394a] text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-[#2AABEE]"
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#2AABEE] hover:bg-[#2297d6] text-white font-semibold transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Enable 2FA'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
