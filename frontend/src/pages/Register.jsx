import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { registerUser, verifyOtp } from '../utils/api';
import { useToast } from '../components/Toast';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1); // 1=form, 2=otp
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({
    username: '', email: '', password: '',
    mobile_no: '', address: '', role: 'user'
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerUser(form);
      toast('Account created! OTP sent to your email.', 'success');
      setStep(2);
    } catch (err) {
      const d = err.response?.data;
      const msg = typeof d === 'object' ? Object.values(d).flat().join(', ') : 'Registration failed';
      toast(msg, 'error');
    } finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp({ email: form.email, otp });
      toast('Email verified! Please login. 🎉', 'success');
      navigate('/login');
    } catch (err) {
      toast(err.response?.data?.[0] || 'Invalid OTP', 'error');
    } finally { setLoading(false); }
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
          <h2>Join MyShop &<br/>Start Shopping</h2>
          <p>Create your free account and get access to exclusive deals, fast delivery, and a seamless shopping experience.</p>
        </div>
        <div className="auth-features">
          {[
            {icon:'🛍️', bg:'rgba(255,63,108,0.15)',  label:'Shop 50,000+ products'},
            {icon:'💼', bg:'rgba(255,144,90,0.15)',  label:'Sell your products easily'},
            {icon:'⚡', bg:'rgba(56,128,255,0.15)',  label:'Lightning fast delivery'},
            {icon:'⭐', bg:'rgba(3,166,133,0.15)',   label:'Trusted by 10,000+ users'},
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
            <div className={`auth-step-dot ${step===1?'active':'done'}`}/>
            <div className={`auth-step-dot ${step===2?'active':''}`}/>
          </div>

          {/* ── STEP 1: FORM ── */}
          {step === 1 && (
            <>
              <div className="auth-card-header">
                <span className="auth-card-icon">✨</span>
                <h2>Create Account</h2>
                <p>Fill in your details to get started</p>
              </div>

              <form onSubmit={handleRegister}>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <div className="input-wrap">
                      <span className="input-icon-left"><User size={15}/></span>
                      <input className="form-input" placeholder="johndoe" value={form.username} onChange={e=>set('username',e.target.value)} required/>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile</label>
                    <div className="input-wrap">
                      <span className="input-icon-left"><Phone size={15}/></span>
                      <input className="form-input" placeholder="+91 98765..." value={form.mobile_no} onChange={e=>set('mobile_no',e.target.value)} required/>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrap">
                    <span className="input-icon-left"><Mail size={15}/></span>
                    <input className="form-input" type="email" placeholder="you@email.com" value={form.email} onChange={e=>set('email',e.target.value)} required/>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrap">
                    <span className="input-icon-left"><Lock size={15}/></span>
                    <input className="form-input" type={showPass?'text':'password'} placeholder="Min 8 characters" value={form.password} onChange={e=>set('password',e.target.value)} required/>
                    <button type="button" className="input-eye" onClick={()=>setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">I want to</label>
                  <div className="role-toggle">
                    <button type="button" className={`role-btn ${form.role==='user'?'active':''}`} onClick={()=>set('role','user')}>
                      🛍️ Shop (Customer)
                    </button>
                    <button type="button" className={`role-btn ${form.role==='admin'?'active':''}`} onClick={()=>set('role','admin')}>
                      💼 Sell (Seller)
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <div className="input-wrap">
                    <span className="input-icon-left" style={{top:14,alignSelf:'flex-start'}}><MapPin size={15}/></span>
                    <textarea className="form-input" placeholder="House No, Street, City, PIN" value={form.address} onChange={e=>set('address',e.target.value)} rows={2} required/>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? <span className="spinner spinner-sm"/> : '✨'}
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
              <p className="auth-switch">Already have an account? <Link to="/login">Login here</Link></p>
            </>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 2 && (
            <>
              <div className="auth-card-header">
                <span className="auth-card-icon">📧</span>
                <h2>Verify Your Email</h2>
                <p>We sent a 6-digit OTP to<br/><strong>{form.email}</strong></p>
              </div>
              <form onSubmit={handleVerify}>
                <div className="form-group">
                  <label className="form-label">Enter OTP</label>
                  <input className="form-input otp-input" placeholder="• • • • • •" value={otp} onChange={e=>setOtp(e.target.value)} maxLength={6} required/>
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? <span className="spinner spinner-sm"/> : '✓'}
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </form>
              <button onClick={()=>setStep(1)} className="btn btn-ghost btn-full" style={{marginTop:12}}>← Back</button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
