import { useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Building2, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { getCsrfCookie } from '../services/csrf';

function ResetPasswordPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  
  // États pour afficher/masquer les mots de passe
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await getCsrfCookie();
      await api.post('/reset-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setDone(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0F2340 0%, #1E3A5F 50%, #134E4A 100%)' }}
    >
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-teal-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 -translate-x-1/3 -translate-y-1/3"></div>

      <div className="relative z-10 w-full max-w-sm bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-teal-300" />
          </div>
          <span className="text-white font-semibold text-lg">Gestion RH</span>
        </div>

        {done ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-teal-400 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">Mot de passe réinitialisé</p>
            <p className="text-slate-300 text-sm">Redirection vers la connexion...</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-1.5">Nouveau mot de passe</h2>
            <p className="text-slate-300 text-sm mb-6">Choisissez un nouveau mot de passe pour {email}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Champ Nouveau mot de passe avec icône oeil */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Nouveau mot de passe"
                  className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Champ Confirmation avec icône oeil */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPasswordConfirmation ? 'text' : 'password'}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Confirmer le mot de passe"
                  className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-300 focus:outline-none"
                >
                  {showPasswordConfirmation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && <p className="text-sm text-rose-200 bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-xl">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-teal-400 disabled:opacity-50 transition-all"
              >
                {loading ? 'Enregistrement...' : 'Réinitialiser le mot de passe'}
              </button>
            </form>
          </>
        )}

        <Link to="/" className="flex items-center justify-center text-sm text-slate-300 hover:text-teal-300 mt-6 transition-colors">
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}

export default ResetPasswordPage;