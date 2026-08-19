'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Category } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, List, Search } from 'lucide-react';

export default function CategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('product_categories').select('*').order('name');
    if (data) setCategories(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('product_categories').insert({ name: newCatName });
    if (error) {
      showAlert('error', 'Kategori sudah ada atau gagal ditambah');
    } else {
      showAlert('success', 'Kategori berhasil ditambah');
      setNewCatName('');
      fetchCategories();
    }
    setSaving(false);
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase.from('product_categories').delete().eq('id', id);
    if (error) {
      showAlert('error', 'Gagal menghapus kategori (mungkin masih digunakan oleh produk)');
    } else {
      showAlert('success', 'Kategori berhasil dihapus');
      fetchCategories();
    }
    setDeleteConfirm(null);
  };

  const filtered = categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Kategori Produk</h1>
          <p>{categories.length} kategori terdaftar</p>
        </div>
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

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Form Add Category */}
        <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Tambah Kategori
          </h2>
          <form onSubmit={handleAddCategory}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Nama Kategori</label>
              <input
                type="text"
                className="form-input"
                placeholder="Misal: Jaringan, Material, dll"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={!newCatName.trim() || saving}>
              {saving ? 'Menyimpan...' : 'Simpan Kategori'}
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <List size={18} /> Daftar Kategori
            </h2>
            <div className="search-bar" style={{ width: '250px' }}>
              <Search className="search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Cari kategori..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '52px' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <List className="empty-icon" />
              <h3>Belum ada kategori</h3>
              <p>Tambahkan kategori baru menggunakan form di sebelah kiri.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map(cat => (
                <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{cat.name}</div>
                  {deleteConfirm === cat.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Yakin hapus?</span>
                      <button className="btn-icon" style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: '600' }} onClick={() => handleDeleteCategory(cat.id)}>Ya</button>
                      <button className="btn-icon" style={{ fontSize: '12px' }} onClick={() => setDeleteConfirm(null)}>Batal</button>
                    </div>
                  ) : (
                    <button className="btn-icon" onClick={() => setDeleteConfirm(cat.id)}>
                      <Trash2 size={16} color="var(--danger)" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
