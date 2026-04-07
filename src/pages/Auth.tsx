import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, HelpCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message);
    } else {
      const { error } = await signUp(email, password, displayName);
      if (error) toast.error(error.message);
      else toast.success("Account created! Check your email to verify.");
    }
    setLoading(false);
  };

  const handleSocialLogin = (provider: string) => {
    toast.info(`${provider} integration is being configured. Please use Email for now.`);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 flex flex-col font-inter overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="px-8 py-6 flex justify-between items-center relative z-20 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-headline font-black tracking-tight text-white uppercase group cursor-default">
            Editorial <span className="text-slate-500 group-hover:text-blue-400 transition-colors">Financial Intelligence</span>
          </h2>
        </div>
        <button className="text-slate-500 hover:text-white transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 lg:p-12 relative z-10 w-full max-w-[1600px] mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full h-full max-h-[850px] grid grid-cols-1 lg:grid-cols-2 bg-[#0f172a] rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-slate-800/50"
        >
          {/* Left Panel: Brand Experience */}
          <div className="relative hidden lg:flex flex-col justify-between p-16 editorial-gradient overflow-hidden">
            <div className="absolute inset-0 bg-dot-pattern opacity-40" />
            
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-6xl font-headline font-black leading-[1.1] mb-8 tracking-tighter">
                  Master Your Capital.<br />
                  Editorial Command.
                </h1>
                <p className="text-xl text-blue-100 max-w-sm leading-relaxed opacity-90 font-light">
                  Your financial lifecycle, curated with the precision of a fine journal. Welcome to your personal capital archive.
                </p>
              </motion.div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 py-4 px-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 w-fit">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-white">
                  Institutional Grade Security
                </span>
              </div>
            </div>

            {/* Subtle glow */}
            <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-blue-400/20 blur-[100px] rounded-full" />
          </div>

          {/* Right Panel: Identity Form */}
          <div className="flex flex-col justify-center p-8 lg:p-20 bg-matte-dark relative">
            <div className="max-w-md mx-auto w-full">
              <div className="mb-10">
                <h2 className="text-3xl font-headline font-black text-white mb-2 tracking-tight">
                  {isLogin ? "Login" : "Create Identity"}
                </h2>
                <p className="text-slate-400 text-sm">
                  {isLogin ? "Enter your credentials to access your dashboard" : "Register your identity on the financial ledger"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <label className="text-[10px] font-label font-black text-slate-500 uppercase tracking-widest pl-1">Display Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Alexander Hamilton"
                        className="w-full bg-[#1e293b]/30 border border-slate-700/50 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="text-[10px] font-label font-black text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@financial-intelligence.com"
                    required
                    className="w-full bg-[#1e293b]/30 border border-slate-700/50 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-label font-black text-slate-500 uppercase tracking-widest">Password</label>
                    {isLogin && (
                      <button type="button" className="text-[10px] font-label font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors">
                        Forgot?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#1e293b]/30 border border-slate-700/50 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>

                {isLogin && (
                  <div className="flex items-center gap-3 px-1">
                    <div className="w-5 h-5 rounded-md border border-slate-700 flex items-center justify-center cursor-pointer hover:border-slate-500 transition-colors group">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-40 transition-opacity" />
                    </div>
                    <span className="text-xs text-slate-400">Remember Me</span>
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-4 rounded-xl editorial-gradient text-white font-black text-sm flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300"
                >
                  {loading ? "AUTHENTICATING..." : isLogin ? "Sign In" : "Register Identity"}
                  {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
                </motion.button>
              </form>

              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
                  <span className="bg-matte-dark px-4 text-slate-500 font-black">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleSocialLogin('Google')}
                  className="flex items-center justify-center gap-3 bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 py-3 rounded-xl transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Google</span>
                </button>
                <button 
                  onClick={() => handleSocialLogin('Apple')}
                  className="flex items-center justify-center gap-3 bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 py-3 rounded-xl transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78 1.11-.24 2.3-.94 3.66-.84 1.5.09 2.61.64 3.31 1.63-3.15 1.89-2.25 5.92.74 7.21-.69 1.71-1.63 3.35-2.79 4.19zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Apple</span>
                </button>
              </div>

              <div className="mt-12 text-center">
                <p className="text-slate-500 text-xs">
                  {isLogin ? "Don't have an account?" : "Already registered?"}{" "}
                  <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-500 font-bold hover:underline"
                  >
                    {isLogin ? "Create an Identity" : "Sign In"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="px-12 py-8 flex flex-col md:flex-row justify-between items-center text-[10px] font-label font-bold text-slate-600 uppercase tracking-widest shrink-0">
        <div className="mb-4 md:mb-0">Personal Finance Intelligence</div>
        <div className="flex gap-8">
          <button className="hover:text-white transition-colors">Privacy Policy</button>
          <button className="hover:text-white transition-colors">Terms of Service</button>
          <button className="hover:text-white transition-colors">Security Architecture</button>
          <span className="opacity-40">© 2024 ALL RIGHTS RESERVED.</span>
        </div>
      </footer>
    </div>
  );
}
