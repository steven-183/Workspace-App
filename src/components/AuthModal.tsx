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
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  UserPlus,
  Send,
  HelpCircle
} from 'lucide-react';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  resendConfirmationEmail,
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

type AuthTab = 'signin' | 'signup';

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
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsEmailUnconfirmed(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEmailUnconfirmed(false);

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
        const lower = error.toLowerCase();
        if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
          setIsEmailUnconfirmed(true);
          setErrorMessage('Email của bạn chưa được xác nhận trong hệ thống Supabase.');
        } else if (lower.includes('invalid login credentials')) {
          setErrorMessage('Email hoặc mật khẩu không chính xác.');
        } else {
          setErrorMessage(error);
        }
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
    setIsEmailUnconfirmed(false);

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
        if (error.toLowerCase().includes('email')) {
          setIsEmailUnconfirmed(true);
        }
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
        setIsEmailUnconfirmed(true);
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

  const handleResend = async () => {
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập email trước khi gửi lại yêu cầu xác nhận.');
      return;
    }

    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await resendConfirmationEmail(email.trim());
    setIsResending(false);

    if (res.success) {
      setSuccessMessage(`Đã gửi lại link xác thực đến ${email.trim()}. Vui lòng kiểm tra hộp thư (kể cả mục Spam/Thư rác)!`);
    } else {
      setErrorMessage(res.error || 'Không thể gửi lại email xác thực.');
    }
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

        {/* When user is already logged in: Only show current user info and single Logout button */}
        {currentUser ? (
          <div className="p-6 space-y-5">
            <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${
              darkMode ? 'bg-[#252525] border-[#383838]' : 'bg-[#f7f6f3] border-[#e8e7e4]'
            }`}>
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full ring-2 ring-[#2383e2]/40 object-cover shrink-0"
              />
              <div className="text-left overflow-hidden flex-1">
                <div className="text-sm font-bold truncate text-[#37352f] dark:text-white">{currentUser.name}</div>
                <div className="text-xs text-[#9b9a97] truncate mt-0.5">{currentUser.email}</div>
                <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Đã đăng nhập</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn size={15} className="rotate-180" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Tab selector */}
            <div className={`flex rounded-lg p-1 border text-xs font-medium ${
              darkMode ? 'bg-[#191919] border-[#313131]' : 'bg-[#f1f1ef] border-[#e3e2e0]'
            }`}>
              <button
                onClick={() => { setAuthTab('signin'); setErrorMessage(null); }}
                className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  authTab === 'signin'
                    ? (darkMode ? 'bg-[#2c2c2c] text-white shadow-xs font-bold' : 'bg-white text-[#111] shadow-xs font-bold')
                    : 'text-[#888] hover:text-[#111] dark:hover:text-white'
                }`}
              >
                <LogIn size={13} />
                <span>Đăng nhập</span>
              </button>
              <button
                onClick={() => { setAuthTab('signup'); setErrorMessage(null); }}
                className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  authTab === 'signup'
                    ? (darkMode ? 'bg-[#2c2c2c] text-white shadow-xs font-bold' : 'bg-white text-[#111] shadow-xs font-bold')
                    : 'text-[#888] hover:text-[#111] dark:hover:text-white'
                }`}
              >
                <UserPlus size={13} />
                <span>Đăng ký</span>
              </button>
            </div>

            {/* Feedback banners */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Email Unconfirmed Help & Action Box */}
            {isEmailUnconfirmed && (
              <div className={`p-3.5 rounded-xl border space-y-2.5 text-xs ${
                darkMode ? 'bg-amber-950/30 border-amber-800/60 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-start gap-2">
                  <HelpCircle size={15} className="shrink-0 text-amber-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Tại sao có thông báo "Email not confirmed"?</p>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      Mặc định tài khoản Supabase yêu cầu người dùng phải bấm vào đường link trong email xác thực để kích hoạt trước khi được phép đăng nhập.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending || !email.trim()}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 text-[11px]"
                  >
                    <Send size={12} />
                    <span>{isResending ? 'Đang gửi...' : 'Gửi lại email xác thực'}</span>
                  </button>
                </div>

                <div className="text-[10.5px] border-t border-amber-200/50 dark:border-amber-800/40 pt-2 opacity-85 space-y-0.5">
                  <p className="font-semibold text-amber-600 dark:text-amber-400">💡 Mẹo cho Admin (Đăng nhập ngay không cần xác thực):</p>
                  <p>Vào <strong>Supabase Dashboard</strong> → <strong>Authentication</strong> → <strong>Providers</strong> → chọn <strong>Email</strong> → Tắt mục <strong>"Confirm email"</strong> → Nhấn <strong>Save</strong>.</p>
                </div>
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
                  <label className="block text-xs font-semibold text-[#555] dark:text-[#9b9a97] mb-1">
                    Địa chỉ Email <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    darkMode ? 'bg-[#181818] border-[#383838] focus-within:border-[#2383e2]' : 'bg-white border-[#cfceca] focus-within:border-[#2383e2] shadow-xs'
                  }`}>
                    <Mail size={15} className="text-[#888] shrink-0" />
                    <input
                      type="email"
                      required
                      placeholder="ví dụ: steven.mai@mathpresso.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs text-black dark:text-white font-medium placeholder:text-[#9b9a97]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#555] dark:text-[#9b9a97] mb-1">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    darkMode ? 'bg-[#181818] border-[#383838] focus-within:border-[#2383e2]' : 'bg-white border-[#cfceca] focus-within:border-[#2383e2] shadow-xs'
                  }`}>
                    <Lock size={15} className="text-[#888] shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Nhập mật khẩu..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs text-black dark:text-white font-medium placeholder:text-[#9b9a97]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#888] hover:text-[#333] dark:hover:text-[#eee] transition-colors"
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
                  <label className="block text-xs font-semibold text-[#555] dark:text-[#9b9a97] mb-1">
                    Họ và tên hiển thị <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    darkMode ? 'bg-[#181818] border-[#383838] focus-within:border-[#2383e2]' : 'bg-white border-[#cfceca] focus-within:border-[#2383e2] shadow-xs'
                  }`}>
                    <UserIcon size={15} className="text-[#888] shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder="ví dụ: Steven Mai"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs text-black dark:text-white font-medium placeholder:text-[#9b9a97]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#555] dark:text-[#9b9a97] mb-1">
                    Địa chỉ Email <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    darkMode ? 'bg-[#181818] border-[#383838] focus-within:border-[#2383e2]' : 'bg-white border-[#cfceca] focus-within:border-[#2383e2] shadow-xs'
                  }`}>
                    <Mail size={15} className="text-[#888] shrink-0" />
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs text-black dark:text-white font-medium placeholder:text-[#9b9a97]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#555] dark:text-[#9b9a97] mb-1">
                    Mật khẩu (tối thiểu 6 ký tự) <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    darkMode ? 'bg-[#181818] border-[#383838] focus-within:border-[#2383e2]' : 'bg-white border-[#cfceca] focus-within:border-[#2383e2] shadow-xs'
                  }`}>
                    <Lock size={15} className="text-[#888] shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs text-black dark:text-white font-medium placeholder:text-[#9b9a97]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#555] dark:text-[#9b9a97] mb-1">
                    Xác nhận lại mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    darkMode ? 'bg-[#181818] border-[#383838] focus-within:border-[#2383e2]' : 'bg-white border-[#cfceca] focus-within:border-[#2383e2] shadow-xs'
                  }`}>
                    <Lock size={15} className="text-[#888] shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs text-black dark:text-white font-medium placeholder:text-[#9b9a97]"
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
          </div>
        )}
      </div>
    </div>
  );
};
