import { useState, useEffect, useRef } from 'react';
import { Camera, Edit2, Save, X, User, Mail, Phone, MapPin, Shield, Check } from 'lucide-react';
import { getProfile, updateProfile } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './Profile.css';

const AVATAR_COLORS = [
  ['#ff3f6c', '#ff905a'],
  ['#6c63ff', '#a78bfa'],
  ['#00b894', '#00cec9'],
  ['#e17055', '#fdcb6e'],
  ['#0984e3', '#74b9ff'],
  ['#e84393', '#fd79a8'],
];

export default function Profile() {
  const { user, login } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const isAdmin = user?.role === 'admin';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: '', mobile_no: '', address: '' });
  const [avatarColor, setAvatarColor] = useState(() => {
    const saved = localStorage.getItem('avatarColor');
    return saved ? JSON.parse(saved) : AVATAR_COLORS[0];
  });
  const [avatarImg, setAvatarImg] = useState(() => localStorage.getItem('avatarImg') || null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  useEffect(() => {
    getProfile()
      .then(r => {
        const data = r.data;
        setProfile(data);
        setForm({
          username: data.username || '',
          mobile_no: data.mobile_no || '',
          address: data.address || '',
        });
      })
      .catch(() => {
        // fallback to localStorage if API fails
        const fallback = {
          username: localStorage.getItem('username') || user?.username || '',
          email: localStorage.getItem('email') || user?.email || '',
          role: user?.role || '',
          mobile_no: '',
          address: '',
        };
        setProfile(fallback);
        setForm({ username: fallback.username, mobile_no: '', address: '' });
        toast('Could not load full profile from server', 'warning');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { username: form.username, mobile_no: form.mobile_no };
      // only send address for customers
      if (!isAdmin) payload.address = form.address;

      const { data } = await updateProfile(payload);
      setProfile(prev => ({ ...prev, ...data }));
      login({ ...user, token: localStorage.getItem('access'), username: data.username });
      localStorage.setItem('username', data.username);
      toast('Profile updated successfully', 'success');
      setEditing(false);
    } catch (err) {
      const d = err.response?.data;
      toast(typeof d === 'object' ? Object.values(d).flat().join(', ') : 'Update failed', 'error');
    } finally { setSaving(false); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast('Image must be under 2MB', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = ev.target.result;
      setAvatarImg(img);
      localStorage.setItem('avatarImg', img);
      toast('Profile photo updated', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleColorSelect = (color) => {
    setAvatarColor(color);
    localStorage.setItem('avatarColor', JSON.stringify(color));
    toast('Avatar color updated', 'success');
  };

  const removePhoto = () => {
    setAvatarImg(null);
    localStorage.removeItem('avatarImg');
    toast('Photo removed', 'info');
  };

  const initials = (profile?.username || user?.username || '?').slice(0, 2).toUpperCase();

  if (loading) return (
    <div className="profile-page">
      <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="spinner" />
      </div>
    </div>
  );

  return (
    <div className="profile-page">
      <div className="container">

        {/* ── Hero card ── */}
        <div className="profile-hero animate-fade">
          <div className="profile-avatar-wrap">
            <div
              className="profile-avatar-lg"
              style={{ background: avatarImg ? 'transparent' : `linear-gradient(135deg, ${avatarColor[0]}, ${avatarColor[1]})` }}
              onClick={() => setShowAvatarModal(true)}
            >
              {avatarImg
                ? <img src={avatarImg} alt="avatar" className="profile-avatar-img" />
                : <span>{initials}</span>
              }
              <div className="profile-avatar-overlay"><Camera size={20} /></div>
            </div>
            <button className="profile-camera-btn" onClick={() => fileRef.current?.click()} title="Change photo">
              <Camera size={14} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          </div>

          <div className="profile-hero-info">
            <h1 className="profile-hero-name">{profile?.username}</h1>
            <p className="profile-hero-email">{profile?.email}</p>
            <span className={`profile-role-badge ${isAdmin ? 'role-admin' : 'role-user'}`}>
              {isAdmin ? '🏪 Seller' : '🛍️ Customer'}
            </span>
          </div>

          <div className="profile-hero-actions">
            {!editing ? (
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                <Edit2 size={14} /> Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => setEditing(false)}><X size={14} /> Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="spinner spinner-sm" /> : <Save size={14} />}
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="profile-grid">
          {/* ── Details card ── */}
          <div className="profile-card animate-fade" style={{ animationDelay: '0.1s' }}>
            <div className="profile-card-header">
              <h3><User size={16} /> Personal Details</h3>
            </div>

            <div className="profile-fields">
              {/* Username */}
              <div className="profile-field">
                <label><User size={13} /> Username</label>
                {editing
                  ? <input className="form-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                  : <span>{profile?.username || <em style={{ color: '#94969f' }}>Not set</em>}</span>
                }
              </div>

              {/* Email — read only */}
              <div className="profile-field">
                <label><Mail size={13} /> Email</label>
                <span className="profile-field-readonly">{profile?.email || localStorage.getItem('email') || '—'}</span>
                <small>Email cannot be changed</small>
              </div>

              {/* Mobile */}
              <div className="profile-field">
                <label><Phone size={13} /> Mobile</label>
                {editing
                  ? <input className="form-input" value={form.mobile_no} onChange={e => setForm(f => ({ ...f, mobile_no: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
                  : <span>{profile?.mobile_no || <em style={{ color: '#94969f' }}>Not set</em>}</span>
                }
              </div>

              {/* Address — only for customers */}
              {!isAdmin && (
                <div className="profile-field">
                  <label><MapPin size={13} /> Address</label>
                  {editing
                    ? <textarea className="form-input" rows={3} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Your delivery address" />
                    : <span>{profile?.address || <em style={{ color: '#94969f' }}>Not set</em>}</span>
                  }
                </div>
              )}

              {/* Role */}
              <div className="profile-field">
                <label><Shield size={13} /> Role</label>
                <span className={`profile-role-badge ${isAdmin ? 'role-admin' : 'role-user'}`} style={{ width: 'fit-content' }}>
                  {isAdmin ? '🏪 Seller' : '🛍️ Customer'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Avatar customizer ── */}
          <div className="profile-card animate-fade" style={{ animationDelay: '0.2s' }}>
            <div className="profile-card-header">
              <h3><Camera size={16} /> Avatar</h3>
            </div>

            <div className="avatar-customizer">
              <div
                className="avatar-preview"
                style={{ background: avatarImg ? 'transparent' : `linear-gradient(135deg, ${avatarColor[0]}, ${avatarColor[1]})` }}
                onClick={() => setShowAvatarModal(true)}
              >
                {avatarImg
                  ? <img src={avatarImg} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : <span>{initials}</span>
                }
              </div>

              <div className="avatar-actions">
                <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()}>
                  <Camera size={13} /> Upload Photo
                </button>
                {avatarImg && (
                  <button className="btn btn-danger btn-sm" onClick={removePhoto}>
                    <X size={13} /> Remove
                  </button>
                )}
              </div>

              <div className="avatar-color-section">
                <p>Avatar Color</p>
                <div className="avatar-color-grid">
                  {AVATAR_COLORS.map((c, i) => (
                    <button
                      key={i}
                      className={`avatar-color-swatch ${JSON.stringify(c) === JSON.stringify(avatarColor) ? 'selected' : ''}`}
                      style={{ background: `linear-gradient(135deg, ${c[0]}, ${c[1]})` }}
                      onClick={() => handleColorSelect(c)}
                    >
                      {JSON.stringify(c) === JSON.stringify(avatarColor) && <Check size={12} color="#fff" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Full-size avatar modal ── */}
      {showAvatarModal && (
        <div className="avatar-modal-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="avatar-modal-content" onClick={e => e.stopPropagation()}>
            <button className="avatar-modal-close" onClick={() => setShowAvatarModal(false)}><X size={20} /></button>
            <div
              className="avatar-modal-img"
              style={{ background: avatarImg ? 'transparent' : `linear-gradient(135deg, ${avatarColor[0]}, ${avatarColor[1]})` }}
            >
              {avatarImg
                ? <img src={avatarImg} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : <span>{initials}</span>
              }
            </div>
            <p className="avatar-modal-name">{profile?.username}</p>
            <p className="avatar-modal-email">{profile?.email || localStorage.getItem('email')}</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => { setShowAvatarModal(false); fileRef.current?.click(); }}>
              <Camera size={13} /> Change Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
