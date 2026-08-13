import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { login } from '../services/auth';

function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      onLoginSuccess(user);
    } catch (err) {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0F2340 0%, #1E3A5F 50%, #134E4A 100%)' }}
    >
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-teal-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 -translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-400 rounded-full mix-blend-screen filter blur-3xl opacity-10 translate-x-1/3 translate-y-1/3"></div>
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-400 rounded-full mix-blend-screen filter blur-3xl opacity-10 -translate-x-1/2 -translate-y-1/2"></div>

      <div className="animate-fade-in-up relative z-10 w-full max-w-4xl bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex">
        <div className="hidden md:flex md:w-2/5 flex-col justify-between p-10 border-r border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 backdrop-blur-sm border border-teal-400/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal-300" />
            </div>
            <span className="text-white font-semibold text-lg">Gestion RH</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white leading-tight mb-3">
              Bienvenue sur votre espace RH.
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Employés, présences, congés : tout est réuni au même endroit.
            </p>
          </div>

          <p className="text-slate-400 text-xs">© 2026 Gestion RH</p>
        </div>

        <div className="flex-1 p-8 md:p-10">
          <div className="md:hidden flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal-300" />
            </div>
            <span className="text-white font-semibold text-lg">Gestion RH</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1.5">Connexion</h2>
          <p className="text-slate-300 text-sm mb-8">Entrez vos identifiants pour continuer</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">
                Email professionnel
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vous@entreprise.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">
                Mot de passe
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 accent-teal-500"
                />
                Se souvenir de moi
              </label>
             <Link to="/forgot-password" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
                Mot de passe oublié ?
              </Link>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-rose-200 bg-rose-500/10 border border-rose-500/30 px-3 py-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 text-white text-sm font-semibold py-3 rounded-xl hover:bg-teal-400 hover:shadow-lg hover:shadow-teal-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;