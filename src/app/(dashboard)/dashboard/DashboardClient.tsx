'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatCurrency } from '@/lib/pdf/generateBill';
import {
  TrendingUp,
  FileText,
  Users,
  CheckCircle,
  Clock,
  Plus,
  ArrowRight,
  Package,
} from 'lucide-react';

interface Props {
  stats: {
    totalBills: number;
    totalClients: number;
    paidBills: number;
    sentBills: number;
    draftBills: number;
    totalRevenue: number;
  };
  recentBills: any[];
}

const statusConfig = {
  draft: { label: 'Draft', className: 'badge-draft' },
  sent: { label: 'Terkirim', className: 'badge-sent' },
  paid: { label: 'Lunas', className: 'badge-paid' },
  cancelled: { label: 'Dibatalkan', className: 'badge-cancelled' },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 200 } },
};

export default function DashboardClient({ stats, recentBills }: Props) {
  const statCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: '#0066FF',
      bg: '#EBF2FF',
      sub: `${stats.paidBills} bill lunas`,
    },
    {
      label: 'Total Bill',
      value: stats.totalBills.toString(),
      icon: FileText,
      color: '#7C3AED',
      bg: '#F5F3FF',
      sub: `${stats.draftBills} draft`,
    },
    {
      label: 'Total Klien',
      value: stats.totalClients.toString(),
      icon: Users,
      color: '#059669',
      bg: '#ECFDF5',
      sub: 'Klien aktif',
    },
    {
      label: 'Menunggu Pembayaran',
      value: stats.sentBills.toString(),
      icon: Clock,
      color: '#D97706',
      bg: '#FFFBEB',
      sub: 'Bill terkirim',
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="page-header"
      >
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Selamat datang kembali! Berikut ringkasan bisnis Anda.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/bills/new" className="btn btn-primary" id="new-bill-btn">
            <Plus size={16} />
            Buat Bill
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-4 gap-4 mb-6"
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={item} className="stat-card">
              <div
                className="stat-icon"
                style={{ background: stat.bg }}
              >
                <Icon size={20} color={stat.color} />
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-change" style={{ color: stat.color }}>
                {stat.sub}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Bottom Grid */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        {/* Recent Bills */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="card-header">
            <span className="card-title">Bill Terbaru</span>
            <Link href="/bills" className="btn btn-ghost btn-sm" style={{ fontSize: '13px' }}>
              Lihat semua <ArrowRight size={13} style={{ marginLeft: '4px' }} />
            </Link>
          </div>
          <div>
            {recentBills.length === 0 ? (
              <div className="empty-state">
                <FileText className="empty-icon" />
                <h3>Belum ada bill</h3>
                <p>Buat bill pertama Anda untuk klien</p>
                <Link href="/bills/new" className="btn btn-primary btn-sm">
                  <Plus size={14} /> Buat Bill
                </Link>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Bill</th>
                    <th>Klien</th>
                    <th>Tanggal</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBills.map((bill) => {
                    const status = statusConfig[bill.status as keyof typeof statusConfig];
                    return (
                      <tr key={bill.id}>
                        <td>
                          <Link href={`/bills/${bill.id}`} style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'none', fontSize: '13px' }}>
                            {bill.bill_number}
                          </Link>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>
                            {bill.client?.name}
                          </div>
                          {bill.client?.company && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{bill.client.company}</div>
                          )}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(bill.issue_date).toLocaleDateString('id-ID')}
                        </td>
                        <td>
                          <span className={`badge ${status.className}`}>
                            <span className="badge-dot" />
                            {status.label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '13px' }}>
                          {formatCurrency(bill.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div className="card">
            <div className="card-header">
              <span className="card-title">Aksi Cepat</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { href: '/bills/new', icon: Plus, label: 'Buat Bill Baru', desc: 'Buat invoice untuk klien', color: '#0066FF' },
                { href: '/products', icon: Package, label: 'Kelola Produk', desc: 'Tambah atau edit produk', color: '#7C3AED' },
                { href: '/clients', icon: Users, label: 'Kelola Klien', desc: 'Tambah data klien baru', color: '#059669' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      background: 'var(--surface)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)';
                      (e.currentTarget as HTMLElement).style.borderColor = action.color;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius)',
                      background: `${action.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={16} color={action.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{action.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{action.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Status Summary */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Status Bill</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Draft', count: stats.draftBills, color: '#6B7280', bg: '#F3F4F6' },
                { label: 'Terkirim', count: stats.sentBills, color: '#2563EB', bg: '#EFF6FF' },
                { label: 'Lunas', count: stats.paidBills, color: '#16A34A', bg: '#F0FDF4' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: s.color,
                    background: s.bg,
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
