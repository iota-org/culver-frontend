import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import logoIcon from '../assets/culver/default-monochrome.svg';
import { Lock, ArrowLeft } from 'lucide-react';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../lib/firebase';
import parsePhoneNumber, {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from 'libphonenumber-js';
import { checkUserExistsByPhone } from '../services/authService';

type AuthMode = 'login' | 'signup';
type Step = 'entry' | 'details' | 'otp';

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [step, setStep] = useState<Step>('entry');

  // Shared fields
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('NG');
  const [otp, setOtp] = useState('');

  // Signup-only fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const { sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
    };
  }, []);

  const getRecaptchaVerifier = () => {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        { size: 'invisible' },
      );
    }
    return recaptchaVerifierRef.current;
  };

  const resetRecaptcha = () => {
    recaptchaVerifierRef.current?.clear();
    recaptchaVerifierRef.current = null;
  };
  const formatPhone = (phone: string) => {
    const parsedPhone = parsePhoneNumber(
      phone.trim(),
      selectedCountry as CountryCode,
    );
    if (!parsedPhone || !parsedPhone.isValid()) {
      setError('Please enter a valid phone number.');
      return;
    }

    return parsedPhone.format('E.164');
  };

  // Step 1 (login): phone → send OTP
  // Step 1 (signup): phone → go to details
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formattedPhone = formatPhone(phone);
    if (!formattedPhone) return;

    if (mode === 'signup') {
      // For signup, collect name first before sending OTP
      setStep('details');
      return;
    }

    // Login: only send OTP for an existing backend user.
    setLoading(true);
    try {
      const userExists = await checkUserExistsByPhone(formattedPhone);
      if (!userExists) {
        setError('No account exists with that phone number. Please sign up.');
        return;
      }

      const verifier = getRecaptchaVerifier();
      await sendOtp(formattedPhone, verifier);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP.');
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  // Step 2 (signup): collect name → send OTP
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both first and last name.');
      return;
    }
    const formattedPhone = formatPhone(phone);
    if (!formattedPhone) return;

    setLoading(true);
    try {
      const userExists = await checkUserExistsByPhone(formattedPhone);
      if (userExists) {
        setError('An account already exists with that phone number. Log in instead.');
        return;
      }

      const verifier = getRecaptchaVerifier();
      await sendOtp(formattedPhone, verifier);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP.');
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  // Final step: verify OTP
  // For signup, pass the full name so the backend can create the account
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const fullName =
        mode === 'signup'
          ? `${firstName.trim()} ${lastName.trim()}`
          : undefined;

      await verifyOtp(otp.trim(), fullName);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setStep('entry');
    setOtp('');
    setFirstName('');
    setLastName('');
    setSelectedCountry('NG');
    setError(null);
    resetRecaptcha();
  };

  return (
    <div className="min-h-screen grid grid-rows-[1fr,auto] items-end justify-center bg-background px-4">
      <div className="w-full">
        {/* Logo */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center rounded-2xl mb-4">
            <img src={logoIcon} alt="Culver" className="w-48 h-48" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm w-2xl mx-auto">
          {/* Mode toggle (only show on entry step) */}
          {step === 'entry' && (
            <div className="flex rounded-xl bg-muted p-1 mb-8 mx-auto w-sm">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'login'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'signup'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign up
              </button>
            </div>
          )}

          {/* STEP: Phone number entry */}
          {step === 'entry' && (
            <form
              onSubmit={handlePhoneSubmit}
              className="mx-auto w-sm flex flex-col"
            >
              <div className="mb-6">
                <label
                  htmlFor="phone"
                  className="text-xl text-center block mb-2 p-4"
                >
                  {mode === 'login' ? 'Welcome back' : 'Create an account'}
                </label>
                {mode === 'signup' && (
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Enter your phone number to get started
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="px-3 py-3 bg-input-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
                  >
                    {getCountries().map((country) => (
                      <option key={country} value={country}>
                        +{getCountryCallingCode(country as CountryCode)}
                      </option>
                    ))}
                  </select>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="8011029924"
                    className="flex-1 px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mx-auto px-6 py-2 gradient-theme text-accent-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading
                  ? 'Sending...'
                  : mode === 'login'
                    ? 'Send OTP'
                    : 'Continue'}
              </button>
            </form>
          )}

          {/* STEP: Signup — collect name details */}
          {step === 'details' && mode === 'signup' && (
            <form
              onSubmit={handleDetailsSubmit}
              className="mx-auto w-sm flex flex-col"
            >
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => setStep('entry')}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <label className="text-xl font-medium">Your name</label>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  This is how you'll appear to others on Culver.
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                    required
                    autoFocus
                  />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mx-auto px-6 py-2 gradient-theme text-accent-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* STEP: OTP verification */}
          {step === 'otp' && (
            <form
              onSubmit={handleVerifyOTP}
              className="mx-auto w-sm flex flex-col"
            >
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(mode === 'signup' ? 'details' : 'entry');
                      setOtp('');
                      setError(null);
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <label className="text-xl font-medium">
                    Verify your number
                  </label>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the 6-digit code sent to{' '}
                  <span className="text-foreground font-medium">{phone}</span>
                </p>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-center tracking-[0.5em] text-lg placeholder:tracking-normal placeholder:text-muted-foreground"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mx-auto px-6 py-2 gradient-theme text-accent-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading
                  ? 'Verifying...'
                  : mode === 'login'
                    ? 'Log in'
                    : 'Create account'}
              </button>
            </form>
          )}

          {error && (
            <p className="text-sm text-destructive mt-4 text-center">{error}</p>
          )}

          <div id="recaptcha-container" />
        </div>
      </div>

      <div className="m-6 space-y-4">
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
