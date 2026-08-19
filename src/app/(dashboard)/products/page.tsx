'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Product, Category } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '@/lib/validations';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/pdf/generateBill';
import { Plus, Search, Edit2, Trash2, X, Package, Tag, ToggleLeft, ToggleRight, List } from 'lucide-react';

const UNITS = ['pcs', 'meter', 'unit', 'set', 'titik', 'roll', 'box'];

const categoryColors: Record<string, { color: string; bg: string }> = {
  'CCTV': { color: '#DC2626', bg: '#FEF2F2' },
  'Access Point': { color: '#2563EB', bg: '#EFF6FF' },
  'Instalasi Listrik': { color: '#D97706', bg: '#FFFBEB' },
  'Kabel LAN': { color: '#7C3AED', bg: '#F5F3FF' },
  'Kabel FO': { color: '#0891B2', bg: '#ECFEFF' },
  'Kabel Listrik': { color: '#EA580C', bg: '#FFF7ED' },
  'Cleaning AC': { color: '#059669', bg: '#ECFDF5' },
  'Jasa': { color: '#0066FF', bg: '#EBF2FF' },
  'Lainnya': { color: '#6B7280', bg: '#F3F4F6' },
};

export default function ProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: { is_custom_price: false, price: 0, unit: 'pcs', category: 'CCTV' },
  });

  const isCustomPrice = watch('is_custom_price');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data: catData } = await supabase.from('product_categories').select('*').order('name');
    if (catData) setCategories(catData);

    const { data } = await supabase
      .from('products')
      .select('*')
      .order('category')
      .order('name');
    setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('product_categories').insert({ name: newCatName });
    if (error) showAlert('error', 'Kategori sudah ada atau gagal ditambah');
    else {
      showAlert('success', 'Kategori ditambah');
      setNewCatName('');
      fetchProducts();
    }
    setSaving(false);
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase.from('product_categories').delete().eq('id', id);
    if (error) showAlert('error', 'Gagal menghapus (mungkin masih ada produk di kategori ini)');
    else {
      showAlert('success', 'Kategori dihapus');
      fetchProducts();
    }
    setDeleteCatConfirm(null);
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const openCreateModal = () => {
    reset({ is_custom_price: false, price: 0, unit: 'pcs', category: 'CCTV' });
    setEditingProduct(null);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      category: product.category,
      description: product.description || '',
      unit: product.unit,
      price: product.price,
      is_custom_price: product.is_custom_price,
      stock: product.stock,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: ProductFormData) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', editingProduct.id);
      if (error) { showAlert('error', 'Gagal mengupdate produk'); }
      else { showAlert('success', 'Produk berhasil diupdate'); setShowModal(false); fetchProducts(); }
    } else {
      const { error } = await supabase
        .from('products')
        .insert({ ...data, created_by: user?.id });
      if (error) { showAlert('error', 'Gagal menambah produk'); }
      else { showAlert('success', 'Produk berhasil ditambah'); setShowModal(false); fetchProducts(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { showAlert('error', 'Gagal menghapus produk'); }
    else { showAlert('success', 'Produk dihapus'); fetchProducts(); }
    setDeleteConfirm(null);
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Produk & Barang</h1>
          <p>{products.length} produk tersedia</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setShowCatModal(true)}>
            <List size={16} /> Kelola Kategori
          </button>
          <button className="btn btn-primary" onClick={openCreateModal} id="add-product-btn">
            <Plus size={16} /> Tambah Produk
          </button>
        </div>
      </div>

      {/* Alert */}
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ maxWidth: '300px' }}>
          <Search className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            id="product-search"
          />
        </div>
        <select
          className="form-select"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{ width: 'auto' }}
          id="category-filter"
        >
          <option value="all">Semua Kategori</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '52px' }} />
          ))}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th>Satuan</th>
                <th style={{ textAlign: 'right' }}>Harga</th>
                <th>Tipe Harga</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <Package className="empty-icon" />
                      <h3>Tidak ada produk</h3>
                      <p>{searchQuery ? 'Coba kata kunci lain' : 'Tambah produk pertama Anda'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(product => {
                  const catStyle = categoryColors[product.category] || categoryColors['Lainnya'];
                  return (
                    <tr key={product.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '13.5px' }}>{product.name}</div>
                        {product.description && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{product.description}</div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.3px',
                          background: catStyle.color,
                          color: 'white',
                        }}>
                          {product.category}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/{product.unit}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {formatCurrency(product.price)}
                      </td>
                      <td>
                        <span className={`badge ${product.is_custom_price ? 'badge-sent' : 'badge-paid'}`}>
                          {product.is_custom_price ? 'Custom' : 'Tetap'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => openEditModal(product)}
                            title="Edit"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Edit2 size={14} />
                          </button>
                          {deleteConfirm === product.id ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product.id)}>Ya</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => setDeleteConfirm(null)}>Batal</button>
                            </div>
                          ) : (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => setDeleteConfirm(product.id)}
                              title="Hapus"
                              aria-label={`Hapus ${product.name}`}
                              style={{ color: 'var(--danger)' }}
                            >
                              <Trash2 size={14} />
                            </button>
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

      {/* Product Modal */}
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
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                </span>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)} aria-label="Tutup">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label required">Nama Produk</label>
                    <input
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      placeholder="e.g. CCTV Hikvision 2MP"
                      {...register('name')}
                    />
                    {errors.name && <span className="form-error">{errors.name.message}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-group">
                      <label className="form-label required">Kategori</label>
                      <select className={`form-select ${errors.category ? 'error' : ''}`} {...register('category')}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Satuan</label>
                      <select className={`form-select ${errors.unit ? 'error' : ''}`} {...register('unit')}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Deskripsi</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Deskripsi singkat produk (opsional)"
                      rows={2}
                      {...register('description')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-group">
                      <label className="form-label required">Harga (Rp)</label>
                      <input
                        type="number"
                        className={`form-input ${errors.price ? 'error' : ''}`}
                        placeholder="0"
                        {...register('price', { valueAsNumber: true })}
                      />
                      {errors.price && <span className="form-error">{errors.price.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Stok</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Opsional"
                        {...register('stock', { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  {/* Custom Price Toggle */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setValue('is_custom_price', !isCustomPrice)}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Harga Dapat Dikustomisasi
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Aktifkan untuk item seperti kabel (harga per meter bisa diubah saat buat bill)
                      </div>
                    </div>
                    {isCustomPrice
                      ? <ToggleRight size={28} color="var(--accent)" />
                      : <ToggleLeft size={28} color="var(--text-muted)" />
                    }
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving} id="save-product-btn">
                    {saving ? 'Menyimpan...' : editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Category Management Modal */}
      <AnimatePresence>
        {showCatModal && (
          <div className="modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-content"
              style={{ maxWidth: '400px' }}
            >
              <div className="modal-header">
                <h2>Kelola Kategori</h2>
                <button className="btn-icon" onClick={() => setShowCatModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nama Kategori Baru"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={!newCatName.trim() || saving}>
                    {saving ? '...' : 'Tambah'}
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {categories.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Belum ada kategori.</p>
                  ) : (
                    categories.map(cat => (
                      <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>{cat.name}</span>
                        {deleteCatConfirm === cat.id ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-icon" style={{ color: 'var(--danger)', fontSize: '11px', fontWeight: '600' }} onClick={() => handleDeleteCategory(cat.id)}>Ya, Hapus</button>
                            <button className="btn-icon" style={{ fontSize: '11px' }} onClick={() => setDeleteCatConfirm(null)}>Batal</button>
                          </div>
                        ) : (
                          <button className="btn-icon" onClick={() => setDeleteCatConfirm(cat.id)}>
                            <Trash2 size={16} color="var(--danger)" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
