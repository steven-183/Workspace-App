import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  Mail, 
  User as UserIcon, 
  X, 
  Check, 
  LogIn, 
  ArrowRight, 
  Lock, 
  Database, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Settings, 
  UserPlus,
  Server,
  Cloud
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveCustomSupabaseConfig, 
  signInWithEmail, 
  signUpWithEmail, 
  getSupabase 
} from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
  darkMode: boolean;
}

type AuthTab = 'signin' | 'signup' | 'config';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  darkMode,
}) => {
  const [authTab, setAuthTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Supabase direct config
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setSupabaseUrl(config.url);
      setSupabaseAnonKey(config.anonKey);
      setIsConfigured(config.isConfigured);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email.');
      return;
    }

    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsSubmitting(true);

    const supabase = getSupabase();
    if (supabase) {
      // Authenticate with Supabase Auth
      const { user, error } = await signInWithEmail(email.trim(), password);
      setIsSubmitting(false);

      if (error) {
        setErrorMessage(error.includes('Invalid login credentials') 
          ? 'Email hoặc mật khẩu không chính xác.' 
          : error
        );
        return;
      }

      if (user) {
        onLogin(user);
        onClose();
      }
    } else {
      // Fallback local sign in
      setTimeout(() => {
        setIsSubmitting(false);
        const displayName = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

        const user: User = {
          id: `u-${Date.now()}`,
          name: displayName,
          email: email.trim(),
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=2383e2`,
          color: '#2383e2',
        };

        onLogin(user);
        onClose();
      }, 300);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);

    const supabase = getSupabase();
    if (supabase) {
      const displayName = fullName.trim() || email.split('@')[0];
      const { user, error } = await signUpWithEmail(email.trim(), password, displayName);
      setIsSubmitting(false);

      if (error) {
        setErrorMessage(error);
        return;
      }

      if (user) {
        setSuccessMessage('Đăng ký thành công! Đang đăng nhập...');
        setTimeout(() => {
          onLogin(user);
          onClose();
        }, 800);
      } else {
        setSuccessMessage('Tài khoản đã được tạo! Vui lòng kiểm tra email của bạn để xác thực.');
      }
    } else {
      // Offline fallback signup
      setTimeout(() => {
        setIsSubmitting(false);
        const displayName = fullName.trim() || email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        const user: User = {
          id: `u-${Date.now()}`,
          name: displayName,
          email: email.trim(),
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=2383e2`,
          color: '#2383e2',
        };
        setSuccessMessage('Đăng ký thành công!');
        setTimeout(() => {
          onLogin(user);
          onClose();
        }, 500);
      }, 300);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomSupabaseConfig(supabaseUrl, supabaseAnonKey);
    const config = getSupabaseConfig();
    setIsConfigured(config.isConfigured);
    setSuccessMessage('Đã lưu cấu hình Supabase! Bạn có thể bắt đầu Đăng nhập / Đăng ký qua Cloud.');
    setTimeout(() => {
      setAuthTab('signin');
      setSuccessMessage(null);
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden transition-all ${
          darkMode ? 'bg-[#202020] border-[#333] text-[#e0e0e0]' : 'bg-white border-[#e3e2e0] text-[#37352f]'
        }`}
      >
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          darkMode ? 'border-[#313131] bg-[#1a1a1a]' : 'border-[#ededeb] bg-[#fbfbfa]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2383e2] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Lock size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold leading-tight">Tài khoản & Xác thực</h2>
                {isConfigured ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Cloud size={10} /> Supabase Cloud
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <Server size={10} /> Offline Local
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#9b9a97]">Đăng nhập Email & Mật khẩu để đồng bộ công việc</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-[#2e2e2e] text-[#888]' : 'hover:bg-[#efedea] text-[#787774]'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Current user status if already logged in */}
        {currentUser && (
          <div className={`p-3.5 mx-5 mt-4 rounded-xl border flex items-center justify-between ${
            darkMode ? 'bg-[#282828] border-[#383838]' : 'bg-[#f7f6f3] border-[#e8e7e4]'
          }`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full ring-2 ring-[#2383e2]/40 object-cover"
              />
              <div className="text-left overflow-hidden">
                <div className="text-xs font-bold truncate">{currentUser.name}</div>
                <div className="text-[11px] text-[#9b9a97] truncate">{currentUser.email}</div>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
              }}
              className="px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* Tab selector */}
          <div className={`flex rounded-lg p-1 border text-xs font-medium ${
            darkMode ? 'bg-[#191919] border-[#313131]' : 'bg-[#f1f1ef] border-[#e3e2e0]'
          }`}>
            <button
              onClick={() => { setAuthTab('signin'); setErrorMessage(null); }}
              className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                authTab === 'signin'
                  ? (darkMode ? 'bg-[#2c2c2c] text-white shadow-xs' : 'bg-white text-[#37352f] shadow-xs font-bold')
                  : 'text-[#888] hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              <LogIn size={13} />
              <span>Đăng nhập</span>
            </button>
            <button
              onClick={() => { setAuthTab('signup'); setErrorMessage(null); }}
              className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                authTab === 'signup'
                  ? (darkMode ? 'bg-[#2c2c2c] text-white shadow-xs' : 'bg-white text-[#37352f] shadow-xs font-bold')
                  : 'text-[#888] hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              <UserPlus size={13} />
              <span>Đăng ký</span>
            </button>
            <button
              onClick={() => { setAuthTab('config'); setErrorMessage(null); }}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                authTab === 'config'
                  ? (darkMode ? 'bg-[#2c2c2c] text-white shadow-xs' : 'bg-white text-[#37352f] shadow-xs font-bold')
                  : 'text-[#888] hover:text-[#37352f] dark:hover:text-white'
              }`}
              title="Cài đặt Supabase"
            >
              <Settings size={14} />
              <span>Kết nối DB</span>
            </button>
          </div>

          {/* Feedback banners */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {authTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#9b9a97] mb-1">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                  darkMode ? 'bg-[#181818] border-[#383838] focus-within:border-[#2383e2]' : 'bg-white border-[#e3e2e0] focus-within:border-[#2383e2]'
                }`}>
                  <Mail size={15} className="text-[#9b9a97] shrink-0" />
                  <input
                    type="email"
                    required
                    placeholder="ví dụ: steven.mai@mathpresso.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent outline-none text-xs text-[#37352f] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9b9a97] mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                  darkMode ? 'bg-[#181818] border-[#383838] focus-within:border-[#2383e2]' : 'bg-white border-[#e3e2e0] focus-within:border-[#2383e2]'
                }`}>
                  <Lock size={15} className="text-[#9b9a97] shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Nhập mật khẩu..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent outline-none text-xs text-[#37352f] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#9b9a97] hover:text-[#555] transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!email.trim() || !password || isSubmitting}
                  className="w-full py-2.5 px-4 bg-[#2383e2] hover:bg-[#1d6ec0] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <LogIn size={15} />
                  <span>{isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setAuthTab('signup')}
                  className="text-xs text-[#2383e2] hover:underline"
                >
                  Chưa có tài khoản? Đăng ký ngay
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SIGN UP */}
          {authTab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#9b9a97] mb-1">
                  Họ và tên hiển thị <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                  darkMode ? 'bg-[#181818] border-[#383838] focus-within:border-[#2383e2]' : 'bg-white border-[#e3e2e0] focus-within:border-[#2383e2]'
                }`}>
                  <UserIcon size={15} className="text-[#9b9a97] shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: Steven Mai"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-transparent outline-none text-xs text-[#37352f] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9b9a97] mb-1">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                  darkMode ? 'bg-[#181818] border-[#383838] focus-within:border-[#2383e2]' : 'bg-white border-[#e3e2e0] focus-within:border-[#2383e2]'
                }`}>
                  <Mail size={15} className="text-[#9b9a97] shrink-0" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent outline-none text-xs text-[#37352f] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9b9a97] mb-1">
                  Mật khẩu (tối thiểu 6 ký tự) <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                  darkMode ? 'bg-[#181818] border-[#383838] focus-within:border-[#2383e2]' : 'bg-white border-[#e3e2e0] focus-within:border-[#2383e2]'
                }`}>
                  <Lock size={15} className="text-[#9b9a97] shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent outline-none text-xs text-[#37352f] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9b9a97] mb-1">
                  Xác nhận lại mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                  darkMode ? 'bg-[#181818] border-[#383838] focus-within:border-[#2383e2]' : 'bg-white border-[#e3e2e0] focus-within:border-[#2383e2]'
                }`}>
                  <Lock size={15} className="text-[#9b9a97] shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-transparent outline-none text-xs text-[#37352f] dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!email.trim() || !password || isSubmitting}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserPlus size={15} />
                  <span>{isSubmitting ? 'Đang đăng ký...' : 'Tạo tài khoản mới'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SUPABASE CONFIGURATION */}
          {authTab === 'config' && (
            <form onSubmit={handleSaveConfig} className="space-y-3 text-left">
              <div className="text-xs font-semibold text-[#37352f] dark:text-white flex items-center gap-1.5">
                <Database size={14} className="text-[#2383e2]" />
                <span>Cấu hình kết nối Supabase</span>
              </div>
              <p className="text-[11px] text-[#9b9a97] leading-relaxed">
                Nhập thông tin từ <strong>Project Settings &gt; API</strong> trên Supabase để kết nối trực tiếp.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-[#9b9a97] mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs bg-transparent outline-none ${
                    darkMode ? 'border-[#383838] focus:border-[#2383e2]' : 'border-[#e3e2e0] focus:border-[#2383e2]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#9b9a97] mb-1">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs bg-transparent outline-none ${
                    darkMode ? 'border-[#383838] focus:border-[#2383e2]' : 'border-[#e3e2e0] focus:border-[#2383e2]'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-[#2383e2] hover:bg-[#1d6ec0] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  Lưu cấu hình Supabase
                </button>
                {isConfigured && (
                  <button
                    type="button"
                    onClick={() => {
                      saveCustomSupabaseConfig('', '');
                      setSupabaseUrl('');
                      setSupabaseAnonKey('');
                      setIsConfigured(false);
                    }}
                    className="px-3 py-2 border border-red-300 dark:border-red-900 text-red-500 text-xs rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
