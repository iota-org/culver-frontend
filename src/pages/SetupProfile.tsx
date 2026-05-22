import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import logoIcon from '../assets/culver/default-monochrome.svg';

export default function SetupProfile() {
  const navigate = useNavigate();
  const { completeSetup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await completeSetup(fullName);
      navigate('/');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to complete setup. Please try again.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-rows-[1fr,auto] items-end justify-center bg-background px-4">
      <div className="w-full">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center rounded-2xl mb-4">
            <img src={logoIcon} alt="Culver" className="w-48 h-48" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="mx-auto w-sm flex flex-col">
            <div className="mb-6">
              <label
                htmlFor="fullName"
                className="text-xl text-center block mb-2 p-4"
              >
                Sign Up
              </label>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Enter your full name to finish creating your account.
              </p>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mx-auto px-4 py-2 gradient-theme text-accent-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>

          {error ? (
            <p className="text-sm text-destructive mt-4 text-center">{error}</p>
          ) : null}
        </div>
      </div>

      <div className="m-6">
        <p className="text-center text-sm text-muted-foreground">
          You can update your avatar and bio later in Profile.
        </p>
      </div>
    </div>
  );
}
