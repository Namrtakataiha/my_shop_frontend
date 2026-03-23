import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, KeyRound, ShoppingBag } from 'lucide-react';
import { loginUser, verifyOtp2f, resetPassword, resendOtp } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [mode, setMode] = useState('login'); // login | otp | reset
  const [resetStep, setResetStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginUser({ email, password });
      toast('OTP sent to your email!', 'success');
      setMode('otp');
    } catch (err) {
      const d = err.response?.data;
      toast(Array.isArray(d) ? d[0] : (d?.detail || 'Login failed'), 'error');
    } finally { setLoading(false); }
  };

  const handleOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await verifyOtp2f({ email, otp });
      login(data);
      toast(`Welcome back, ${data.username}! 🎉`, 'success');
      navigate(data.role === 'admin' ? '/admin/dashboard' : '/');
    } catch (err) {
      toast(err.response?.data?.[0] || 'Invalid OTP', 'error');
    } finally { setLoading(false); }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword({ email });
      toast('OTP sent to your email!', 'success');
      setResetStep(2);
    } catch (err) {
      toast(err.response?.data?.[0] || 'Email not found', 'error');
    } finally { setLoading(false); }
  };

  const handleResetConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword({ email, otp, new_password: newPassword });
      toast('Password reset! Please login.', 'success');
      setMode('login'); setResetStep(1); setOtp(''); setNewPassword('');
    } catch (err) {
      toast(err.response?.data?.[0] || 'Reset failed', 'error');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    try { await resendOtp({ email }); toast('OTP resent!', 'info'); }
    catch { toast('Failed to resend', 'error'); }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <div className="logo-icon"><ShoppingBag size={22}/></div>
            <span>My<span style={{color:'#ff3f6c'}}>Shop</span></span>
          </div>
          <h2>Welcome back to<br/>MyShop</h2>
          <p>Login to access your orders, wishlist, and exclusive member deals.</p>
        </div>
        <div className="auth-features">
          {[
            {icon:'🔐', bg:'rgba(255,63,108,0.15)',  label:'2-Factor Authentication'},
            {icon:'📦', bg:'rgba(255,144,90,0.15)',  label:'Track your orders live'},
            {icon:'💰', bg:'rgba(56,128,255,0.15)',  label:'Exclusive member discounts'},
            {icon:'🚀', bg:'rgba(3,166,133,0.15)',   label:'Lightning fast checkout'},
          ].map((f,i) => (
            <div key={i} className="auth-feat animate-left" style={{animationDelay:`${i*0.1}s`}}>
              <div className="auth-feat-icon" style={{background:f.bg}}>{f.icon}</div>
              {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-card">

          {/* Step dots */}
          <div className="auth-steps">
            <div className={`auth-step-dot ${mode==='login'?'active':mode!=='login'?'done':''}`}/>
            <div className={`auth-step-dot ${mode==='otp'?'active':''}`}/>
          </div>

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <>
              <div className="auth-card-header">
                <span className="auth-card-icon">👋</span>
                <h2>Login to MyShop</h2>
                <p>Enter your credentials to continue</p>
              </div>
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrap">
                    <span className="input-icon-left"><Mail size={16}/></span>
                    <input className="form-input" type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrap">
                    <span className="input-icon-left"><Lock size={16}/></span>
                    <input className="form-input" type={showPass?'text':'password'} placeholder="Your password" value={password} onChange={e=>setPassword(e.target.value)} required/>
                    <button type="button" className="input-eye" onClick={()=>setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
                <div style={{textAlign:'right', marginBottom:20}}>
                  <button type="button" className="forgot-btn" onClick={()=>setMode('reset')}>Forgot password?</button>
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? <span className="spinner spinner-sm"/> : <LogIn size={17}/>}
                  {loading ? 'Sending OTP...' : 'Continue'}
                </button>
              </form>
              <p className="auth-switch">New to MyShop? <Link to="/register">Create account</Link></p>
            </>
          )}

          {/* ── OTP ── */}
          {mode === 'otp' && (
            <>
              <div className="auth-card-header">
                <span className="auth-card-icon">🔐</span>
                <h2>Verify It's You</h2>
                <p>OTP sent to <strong>{email}</strong></p>
              </div>
              <form onSubmit={handleOtp}>
                <div className="form-group">
                  <label className="form-label">Enter 6-digit OTP</label>
                  <input className="form-input otp-input" placeholder="• • • • • •" value={otp} onChange={e=>setOtp(e.target.value)} maxLength={6} required/>
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? <span className="spinner spinner-sm"/> : <KeyRound size={17}/>}
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
              </form>
              <div style={{display:'flex', gap:10, marginTop:14}}>
                <button onClick={handleResend} className="btn btn-ghost btn-sm btn-full">Resend OTP</button>
                <button onClick={()=>setMode('login')} className="btn btn-ghost btn-sm btn-full">← Back</button>
              </div>
            </>
          )}

          {/* ── RESET ── */}
          {mode === 'reset' && (
            <>
              <div className="auth-card-header">
                <span className="auth-card-icon">🔑</span>
                <h2>Reset Password</h2>
                <p>{resetStep===1 ? 'Enter your email to get OTP' : 'Enter OTP and new password'}</p>
              </div>
              <div className="auth-steps" style={{marginBottom:24}}>
                <div className={`auth-step-dot ${resetStep===1?'active':'done'}`}/>
                <div className={`auth-step-dot ${resetStep===2?'active':''}`}/>
              </div>
              {resetStep === 1 ? (
                <form onSubmit={handleResetRequest}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="input-wrap">
                      <span className="input-icon-left"><Mail size={16}/></span>
                      <input className="form-input" type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                    {loading ? <span className="spinner spinner-sm"/> : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetConfirm}>
                  <div className="form-group">
                    <label className="form-label">OTP Code</label>
                    <input className="form-input otp-input" placeholder="• • • • • •" value={otp} onChange={e=>setOtp(e.target.value)} maxLength={6} required/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div className="input-wrap">
                      <span className="input-icon-left"><Lock size={16}/></span>
                      <input className="form-input" type="password" placeholder="Min 8 characters" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required/>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                    {loading ? <span className="spinner spinner-sm"/> : 'Reset Password'}
                  </button>
                </form>
              )}
              <button onClick={()=>{setMode('login');setResetStep(1);}} className="btn btn-ghost btn-full" style={{marginTop:12}}>← Back to Login</button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
