'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, UserRole } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Edit2, Trash2, X, Shield, Crown, Wrench, Eye, Search } from 'lucide-react';

const ROLES: { value: UserRole; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { value: 'owner',   label: 'Owner',   icon: Crown,   color: '#D97706', bg: '#FFFBEB' },
  { value: 'admin',   label: 'Admin',   icon: Shield,  color: '#0066FF', bg: '#EBF2FF' },
  { value: 'teknisi', label: 'Teknisi', icon: Wrench,  color: '#059669', bg: '#ECFDF5' },
  { value: 'viewer',  label: 'Viewer',  icon: Eye,     color: '#6B7280', bg: '#F3F4F6' },
];

const getRoleInfo = (role: string) =>
  ROLES.find(r => r.value === role) ?? ROLES[3];

export default function UsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    role: 'teknisi' as UserRole,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setCurrentUser(data);
      }
      await fetchUsers();
    };
    init();
  }, [fetchUsers]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = 'Nama wajib diisi';
    if (!form.email.trim()) errs.email = 'Email wajib diisi';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Format email tidak valid';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      showAlert('error', data.error || 'Gagal membuat user');
    } else {
      showAlert('success', `User ${form.full_name} berhasil dibuat`);
      setShowModal(false);
      setForm({ full_name: '', email: '', role: 'teknisi' });
      fetchUsers();
    }
    setSaving(false);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    });
    const data = await res.json();
    if (!res.ok) showAlert('error', data.error || 'Gagal update role');
    else {
      showAlert('success', 'Role berhasil diubah');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const handleDelete = async (userId: string) => {
    const res = await fetch(`/api/users?userId=${userId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) showAlert('error', data.error || 'Gagal menghapus user');
    else {
      showAlert('success', 'User berhasil dihapus');
      fetchUsers();
    }
    setUserToDelete(null);
    setDeleteConfirmText('');
  };

  const canManageUser = (targetRole: string) => {
    if (currentUser?.role === 'owner') return true;
    if (currentUser?.role === 'admin' && targetRole !== 'owner') return true;
    return false;
  };

  const availableRoles = currentUser?.role === 'owner'
    ? ROLES
    : ROLES.filter(r => r.value !== 'owner');

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) =>
    name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Manajemen User</h1>
          <p>{users.length} user terdaftar</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="add-user-btn">
          <Plus size={16} /> Tambah User
        </button>
      </div>

      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`alert alert-${alert.type}`}
            style={{ marginBottom: '20px' }}
          >
            {alert.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <div className="search-bar">
          <Search className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Cari user..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            id="user-search"
          />
        </div>
      </div>

      {/* Role Legend */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {ROLES.map(r => {
          const Icon = r.icon;
          return (
            <div key={r.value} style={{
              display: 'flex', alignItems: 'center',
              padding: '5px 12px', borderRadius: '20px',
              background: r.color,
              fontSize: '12px', fontWeight: '700', color: 'white',
            }}>
              {r.label}
            </div>
          );
        })}
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '68px' }} />)}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Bergabung</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <Users className="empty-icon" />
                      <h3>Tidak ada user</h3>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(user => {
                  const roleInfo = getRoleInfo(user.role);
                  const RoleIcon = roleInfo.icon;
                  const isSelf = user.id === currentUser?.id;
                  const canManage = canManageUser(user.role);

                  return (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            background: `${roleInfo.color}18`,
                            border: `2px solid ${roleInfo.color}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: '700', color: roleInfo.color,
                            flexShrink: 0,
                          }}>
                            {getInitials(user.full_name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {user.full_name}
                              {isSelf && (
                                <span style={{ fontSize: '10px', padding: '1px 6px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '10px', fontWeight: '700' }}>
                                  Anda
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user.email}</td>
                      <td>
                        {canManage && !isSelf ? (
                          /* Editable role dropdown */
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <select
                              value={user.role}
                              onChange={e => handleRoleChange(user.id, e.target.value as UserRole)}
                              id={`role-select-${user.id}`}
                              aria-label={`Role ${user.full_name}`}
                              style={{
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 24px 4px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'white',
                                background: roleInfo.color,
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              {availableRoles.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                              stroke="white" strokeWidth="2.5"
                              style={{ position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </div>
                        ) : (
                          /* Static badge for self or unmanageable */
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '4px 10px', borderRadius: '20px',
                            fontSize: '12px', fontWeight: '700',
                            color: 'white', background: roleInfo.color,
                          }}>
                            {roleInfo.label}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          {canManage && !isSelf ? (
                              <button
                                className="btn btn-ghost btn-icon btn-sm"
                                onClick={() => {
                                  setUserToDelete({ id: user.id, name: user.full_name });
                                  setDeleteConfirmText('');
                                }}
                                aria-label={`Hapus ${user.full_name}`}
                                style={{ color: 'var(--danger)' }}
                                title="Hapus user"
                              >
                                <Trash2 size={14} />
                              </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="modal-header">
                <span className="modal-title">Undang User Baru</span>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)} aria-label="Tutup">
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Role Selector Cards */}
                <div className="form-group">
                  <label className="form-label required">Role</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {availableRoles.map(r => {
                      const Icon = r.icon;
                      const selected = form.role === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          id={`role-card-${r.value}`}
                          onClick={() => setForm(f => ({ ...f, role: r.value }))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 14px',
                            borderRadius: 'var(--radius)',
                            border: `2px solid ${selected ? r.color : 'var(--border)'}`,
                            background: selected ? r.bg : 'var(--surface)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: selected ? `${r.color}25` : 'var(--bg-tertiary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <Icon size={16} color={selected ? r.color : 'var(--text-muted)'} />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: selected ? r.color : 'var(--text-primary)' }}>
                              {r.label}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                              {r.value === 'owner' ? 'Akses penuh' :
                               r.value === 'admin' ? 'Kelola semua' :
                               r.value === 'teknisi' ? 'Buat bill' : 'Hanya lihat'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required">Nama Lengkap</label>
                  <input
                    className={`form-input ${formErrors.full_name ? 'error' : ''}`}
                    placeholder="Nama lengkap user"
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    id="user-name-input"
                  />
                  {formErrors.full_name && <span className="form-error">{formErrors.full_name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label required">Email</label>
                  <input
                    type="email"
                    className={`form-input ${formErrors.email ? 'error' : ''}`}
                    placeholder="email@perusahaan.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    id="user-email-input"
                  />
                  {formErrors.email && <span className="form-error">{formErrors.email}</span>}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={saving} id="create-user-btn">
                  {saving ? 'Mengundang...' : 'Kirim Undangan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {userToDelete && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setUserToDelete(null)}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ maxWidth: '400px' }}
            >
              <div className="modal-header">
                <span className="modal-title" style={{ color: 'var(--danger)' }}>Konfirmasi Hapus User</span>
                <button className="btn btn-ghost btn-icon" onClick={() => setUserToDelete(null)} aria-label="Tutup">
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ 
                  padding: '12px', 
                  background: '#FEF2F2', 
                  borderLeft: '4px solid #DC2626',
                  borderRadius: '0 8px 8px 0',
                  marginBottom: '16px' 
                }}>
                  <p style={{ color: '#991B1B', fontSize: '13px', lineHeight: 1.5 }}>
                    Tindakan ini tidak dapat dibatalkan. User <strong>{userToDelete.name}</strong> akan kehilangan akses ke sistem secara permanen.
                  </p>
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    Ketik <strong>hapus-{userToDelete.name}</strong> untuk konfirmasi:
                  </label>
                  <input
                    className="form-input"
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    placeholder={`hapus-${userToDelete.name}`}
                    style={{ borderColor: deleteConfirmText === `hapus-${userToDelete.name}` ? '#16A34A' : 'var(--border)' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setUserToDelete(null)}>
                  Batal
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleDelete(userToDelete.id)} 
                  disabled={deleteConfirmText !== `hapus-${userToDelete.name}`}
                >
                  Hapus Permanen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
