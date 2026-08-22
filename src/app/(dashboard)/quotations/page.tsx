'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Quotation } from '@/types';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/pdf/generateBill';
import { Plus, Search, FileText, Eye, Trash2, ChevronDown, CheckCircle } from 'lucide-react';

const statusConfig = {
  draft: { label: 'Draft', className: 'badge-draft' },
  sent: { label: 'Dikirim', className: 'badge-sent' },
  revised: { label: 'Direvisi', className: 'badge-cancelled' },
  deal: { label: 'Deal', className: 'badge-paid' },
  rejected: { label: 'Ditolak', className: 'badge-cancelled' },
};

export default function QuotationsPage() {
  const supabase = createClient();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('quotations')
      .select('*, client:clients(name, company)')
      .order('created_at', { ascending: false });
    setQuotations(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchQuotations(); }, [fetchQuotations]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('quotations').update({ status }).eq('id', id);
    if (error) showAlert('error', 'Gagal mengupdate status');
    else { showAlert('success', 'Status berhasil diupdate'); fetchQuotations(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('quotations').delete().eq('id', id);
    if (error) showAlert('error', 'Gagal menghapus penawaran');
    else { showAlert('success', 'Penawaran dihapus'); fetchQuotations(); }
    setDeleteConfirm(null);
  };

  const filtered = quotations.filter(q => {
    const matchSearch =
      q.quotation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.client?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = filtered.reduce((sum, q) => sum + (q.total || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Surat Penawaran</h1>
          <p>{quotations.length} surat total • {formatCurrency(totalAmount)} nilai ditampilkan</p>
        </div>
        <Link href="/quotations/new" className="btn btn-primary" id="new-quotation-link">
          <Plus size={16} /> Buat Penawaran
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
            placeholder="Cari nomor, judul, atau klien..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="all">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Dikirim</option>
          <option value="revised">Direvisi</option>
          <option value="deal">Deal</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '72px' }} />
          ))}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Penawaran</th>
                <th>Info Klien</th>
                <th>Tgl Dibuat</th>
                <th>Total Nominal</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <FileText className="empty-icon" />
                      <h3>Tidak ada penawaran</h3>
                      <p>{searchQuery ? 'Tidak ada hasil pencarian' : 'Mulai buat penawaran pertama Anda'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(q => {
                  const conf = statusConfig[q.status as keyof typeof statusConfig] || statusConfig.draft;
                  return (
                    <tr key={q.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{q.quotation_number}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{q.title}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{q.client?.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{q.client?.company || '-'}</div>
                      </td>
                      <td>
                        <div>{new Date(q.issue_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                        {formatCurrency(q.total)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge ${conf.className}`}>{conf.label}</span>
                          <div className="dropdown" style={{ display: 'inline-block', position: 'relative' }}>
                            <button className="btn-icon btn-sm" aria-label="Ubah Status">
                              <ChevronDown size={14} />
                            </button>
                            <div className="dropdown-menu">
                              <button onClick={() => updateStatus(q.id, 'draft')}>Set Draft</button>
                              <button onClick={() => updateStatus(q.id, 'sent')}>Set Dikirim</button>
                              <button onClick={() => updateStatus(q.id, 'revised')}>Set Direvisi</button>
                              <button onClick={() => updateStatus(q.id, 'deal')}>Set Deal</button>
                              <button onClick={() => updateStatus(q.id, 'rejected')}>Set Ditolak</button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <Link href={`/quotations/${q.id}`} className="btn btn-secondary btn-sm" title="Lihat & PDF">
                            <Eye size={14} /> Lihat
                          </Link>
                          {q.status === 'deal' && (
                            <Link href={`/bills/new?quotation_id=${q.id}`} className="btn btn-primary btn-sm" title="Buat Tagihan">
                              <CheckCircle size={14} /> Jadi Bill
                            </Link>
                          )}
                          {deleteConfirm === q.id ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q.id)}>Ya</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => setDeleteConfirm(null)}>Btl</button>
                            </div>
                          ) : (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => setDeleteConfirm(q.id)}
                              title="Hapus"
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
    </div>
  );
}
