'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bill } from '@/types';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/pdf/generateBill';
import { Plus, Search, FileText, Eye, Download, Trash2, ChevronDown } from 'lucide-react';

const statusConfig = {
  draft: { label: 'Draft', className: 'badge-draft' },
  sent: { label: 'Terkirim', className: 'badge-sent' },
  paid: { label: 'Lunas', className: 'badge-paid' },
  cancelled: { label: 'Dibatalkan', className: 'badge-cancelled' },
};

export default function BillsPage() {
  const supabase = createClient();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bills')
      .select('*, client:clients(name, company)')
      .order('created_at', { ascending: false });
    setBills(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('bills').update({ status }).eq('id', id);
    if (error) showAlert('error', 'Gagal mengupdate status');
    else { showAlert('success', 'Status berhasil diupdate'); fetchBills(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) showAlert('error', 'Gagal menghapus bill');
    else { showAlert('success', 'Bill dihapus'); fetchBills(); }
    setDeleteConfirm(null);
  };

  const filtered = bills.filter(b => {
    const matchSearch =
      b.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.client?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = filtered.reduce((sum, b) => sum + (b.total || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Bill & Invoice</h1>
          <p>{bills.length} bill total • {formatCurrency(totalAmount)} nilai ditampilkan</p>
        </div>
        <Link href="/bills/new" className="btn btn-primary" id="new-bill-link">
          <Plus size={16} /> Buat Bill Baru
        </Link>
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ maxWidth: '320px' }}>
          <Search className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Cari nomor bill, klien..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            id="bill-search"
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['all', 'draft', 'sent', 'paid', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="btn btn-sm"
              id={`filter-${s}`}
              style={{
                background: statusFilter === s ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: statusFilter === s ? 'white' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: statusFilter === s ? 'var(--accent)' : 'var(--border)',
              }}
            >
              {s === 'all' ? 'Semua' :
               s === 'draft' ? 'Draft' :
               s === 'sent' ? 'Terkirim' :
               s === 'paid' ? 'Lunas' : 'Dibatalkan'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: '60px' }} />)}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Bill</th>
                <th>Klien</th>
                <th>Judul</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <FileText className="empty-icon" />
                      <h3>Tidak ada bill</h3>
                      <p>{searchQuery || statusFilter !== 'all' ? 'Tidak ada hasil yang cocok' : 'Buat bill pertama Anda'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(bill => {
                  const status = statusConfig[bill.status as keyof typeof statusConfig];
                  return (
                    <tr key={bill.id}>
                      <td>
                        <Link
                          href={`/bills/${bill.id}`}
                          style={{ color: 'var(--accent)', fontWeight: '700', textDecoration: 'none', fontSize: '13px' }}
                        >
                          {bill.bill_number}
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{bill.client?.name}</div>
                        {bill.client?.company && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{bill.client.company}</div>
                        )}
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '200px' }} className="truncate">
                        {bill.title}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(bill.issue_date).toLocaleDateString('id-ID')}
                      </td>
                      <td>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <select
                            value={bill.status}
                            onChange={e => updateStatus(bill.id, e.target.value)}
                            className={`badge ${status.className}`}
                            style={{
                              appearance: 'none',
                              WebkitAppearance: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              paddingRight: '18px',
                            }}
                            aria-label={`Status ${bill.bill_number}`}
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Terkirim</option>
                            <option value="paid">Lunas</option>
                            <option value="cancelled">Dibatalkan</option>
                          </select>
                          <ChevronDown size={10} style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {formatCurrency(bill.total)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          <Link href={`/bills/${bill.id}`} className="btn btn-ghost btn-icon btn-sm" title="Lihat detail" aria-label={`Lihat ${bill.bill_number}`}>
                            <Eye size={14} />
                          </Link>
                          {deleteConfirm === bill.id ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(bill.id)}>Ya</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => setDeleteConfirm(null)}>Batal</button>
                            </div>
                          ) : (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => setDeleteConfirm(bill.id)}
                              aria-label={`Hapus ${bill.bill_number}`}
                              style={{ color: 'var(--danger)' }}
                              title="Hapus"
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
    </div>
  );
}
