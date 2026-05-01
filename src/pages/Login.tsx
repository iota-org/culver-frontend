import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import logoIcon from '../assets/culver/default-monochrome.svg';
import { Lock } from 'lucide-react';

export default function Login() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setStep('otp');
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(phone, otp);
    setLoading(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen grid grid-rows-[1fr,auto] items-end justify-center bg-background px-4">
      <div className="w-full">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center rounded-2xl mb-4">
            <img src={logoIcon} alt="Culver" className="w-48 h-48" />
          </div>
          {/* <h1 className="mb-2">Welcome to Culver</h1>
          <p className="text-muted-foreground">
            Secure end-to-end encrypted messaging
          </p> */}
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm w-2xl mx-auto">
          {step === 'phone' ? (
            <form
              onSubmit={handleSendOTP}
              className="mx-auto w-sm flex flex-col"
            >
              <div className="mb-6">
                <label
                  htmlFor="phone"
                  className="text-xl text-center block mb-2 p-4"
                >
                  Enter Your Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 8011029924"
                  className="w-full px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mx-auto px-4 py-2 gradient-theme text-accent-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <div className="mb-6">
                <label htmlFor="otp" className="block mb-2">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-center tracking-widest placeholder:text-muted-foreground"
                  required
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Code sent to {phone}
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 gradient-theme text-accent-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 mb-3"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                Change phone number
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="m-6 space-y-6">
        <p className="mx-auto flex justify-center gap-2 text-muted-foreground">
          <Lock className="" />
          Secure end-to-end encrypted messaging
        </p>

        <p className="text-center text-sm text-muted-foreground">
          By continuing, you agree to Culver's Terms of Service and Privacy
          Policy
        </p>
      </div>
    </div>
  );
}
