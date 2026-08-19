'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Client } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, ClientFormData } from '@/lib/validations';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Users, Phone, Mail, MapPin, Building } from 'lucide-react';

export default function ClientsPage() {
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').order('name');
    setClients(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const openCreateModal = () => {
    reset({});
    setEditingClient(null);
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    reset({
      name: client.name,
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data: ClientFormData) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = { ...data, email: data.email || null };

    if (editingClient) {
      const { error } = await supabase.from('clients').update(payload).eq('id', editingClient.id);
      if (error) showAlert('error', 'Gagal mengupdate klien');
      else { showAlert('success', 'Klien berhasil diupdate'); setShowModal(false); fetchClients(); }
    } else {
      const { error } = await supabase.from('clients').insert({ ...payload, created_by: user?.id });
      if (error) showAlert('error', 'Gagal menambah klien');
      else { showAlert('success', 'Klien berhasil ditambah'); setShowModal(false); fetchClients(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) showAlert('error', 'Gagal menghapus klien');
    else { showAlert('success', 'Klien dihapus'); fetchClients(); }
    setDeleteConfirm(null);
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) =>
    name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  const colors = ['#0066FF', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2'];
  const getColor = (name: string) => colors[name.charCodeAt(0) % colors.length];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Klien</h1>
          <p>{clients.length} klien terdaftar</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} id="add-client-btn">
          <Plus size={16} /> Tambah Klien
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
            placeholder="Cari klien, perusahaan, kota..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            id="client-search"
          />
        </div>
      </div>

      {/* Client Cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '160px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Users className="empty-icon" />
            <h3>Tidak ada klien</h3>
            <p>{searchQuery ? 'Coba kata kunci lain' : 'Tambah klien pertama Anda'}</p>
          </div>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-3 gap-4"
          initial="hidden"
          animate="show"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
        >
          {filtered.map(client => {
            const color = getColor(client.name);
            return (
              <motion.div
                key={client.id}
                className="card"
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                style={{ transition: 'box-shadow 0.2s ease, transform 0.2s ease' }}
                whileHover={{ y: -2 }}
              >
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: `${color}15`,
                      border: `2px solid ${color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '16px',
                      fontWeight: '700',
                      color,
                    }}>
                      {getInitials(client.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {client.name}
                      </div>
                      {client.company && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Building size={11} /> {client.company}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {client.phone && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={11} /> {client.phone}
                      </div>
                    )}
                    {client.email && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Mail size={11} /> {client.email}
                      </div>
                    )}
                    {(client.address || client.city) && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={11} /> {[client.address, client.city].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEditModal(client)}
                      style={{ flex: 1 }}
                      aria-label={`Edit ${client.name}`}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    {deleteConfirm === client.id ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(client.id)}>Hapus</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setDeleteConfirm(null)}>Batal</button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => setDeleteConfirm(client.id)}
                        aria-label={`Hapus ${client.name}`}
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Client Modal */}
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
                <span className="modal-title">
                  {editingClient ? 'Edit Klien' : 'Tambah Klien Baru'}
                </span>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)} aria-label="Tutup">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label required">Nama Klien</label>
                      <input
                        className={`form-input ${errors.name ? 'error' : ''}`}
                        placeholder="Nama lengkap"
                        {...register('name')}
                      />
                      {errors.name && <span className="form-error">{errors.name.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Perusahaan</label>
                      <input className="form-input" placeholder="Nama perusahaan" {...register('company')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">No. Telepon</label>
                      <input className="form-input" placeholder="08xx-xxxx-xxxx" {...register('phone')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className={`form-input ${errors.email ? 'error' : ''}`}
                        placeholder="email@example.com"
                        {...register('email')}
                      />
                      {errors.email && <span className="form-error">{errors.email.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Kota</label>
                      <input className="form-input" placeholder="Kota" {...register('city')} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Alamat</label>
                      <textarea className="form-textarea" placeholder="Alamat lengkap" rows={2} {...register('address')} />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving} id="save-client-btn">
                    {saving ? 'Menyimpan...' : editingClient ? 'Simpan Perubahan' : 'Tambah Klien'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
