'use client';

import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/pdf/generateBill';
import { TrendingUp, FileText, CheckCircle, Clock, XCircle, Send } from 'lucide-react';

interface Props {
  monthlyData: { month: string; revenue: number; monthKey: string }[];
  statusBreakdown: { status: string; count: number; total: number }[];
  totalBills: number;
  totalRevenue: number;
}

const statusInfo = {
  draft: { label: 'Draft', color: '#6B7280', bg: '#F3F4F6', icon: FileText },
  sent: { label: 'Terkirim', color: '#2563EB', bg: '#EFF6FF', icon: Send },
  paid: { label: 'Lunas', color: '#16A34A', bg: '#F0FDF4', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', color: '#DC2626', bg: '#FEF2F2', icon: XCircle },
};

export default function ReportsClient({ monthlyData, statusBreakdown, totalBills, totalRevenue }: Props) {
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Laporan</h1>
          <p>Ringkasan kinerja bisnis Anda</p>
        </div>
      </div>

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-2 gap-4 mb-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#EBF2FF' }}>
            <TrendingUp size={20} color="#0066FF" />
          </div>
          <div className="stat-value">{formatCurrency(totalRevenue)}</div>
          <div className="stat-label">Total Revenue (Lunas)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#F5F3FF' }}>
            <FileText size={20} color="#7C3AED" />
          </div>
          <div className="stat-value">{totalBills}</div>
          <div className="stat-label">Total Bill Dibuat</div>
        </div>
      </motion.div>

      <div className="grid grid-layout-sidebar" style={{ gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        {/* Monthly Revenue Chart */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="card-header">
            <span className="card-title">Revenue per Bulan (6 Bulan Terakhir)</span>
          </div>
          <div className="card-body">
            {monthlyData.every(d => d.revenue === 0) ? (
              <div className="empty-state" style={{ padding: '40px' }}>
                <TrendingUp className="empty-icon" />
                <h3>Belum ada data revenue</h3>
                <p>Revenue akan muncul saat ada bill dengan status &quot;Lunas&quot;</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Chart */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '200px', padding: '0 8px' }}>
                  {monthlyData.map((d, i) => {
                    const height = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={d.monthKey} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'center' }}>
                          {d.revenue > 0 ? formatCurrency(d.revenue).replace('Rp', '') : ''}
                        </div>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(height, d.revenue > 0 ? 4 : 0)}%` }}
                          transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
                          style={{
                            width: '100%',
                            background: d.revenue > 0
                              ? 'linear-gradient(to top, #0052CC, #0066FF, #3385FF)'
                              : 'var(--bg-tertiary)',
                            borderRadius: '6px 6px 2px 2px',
                            minHeight: '4px',
                          }}
                          title={`${d.month}: ${formatCurrency(d.revenue)}`}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', fontWeight: '500' }}>
                          {d.month}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Status Breakdown */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-header">
            <span className="card-title">Status Bill</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {statusBreakdown.map(s => {
              const info = statusInfo[s.status as keyof typeof statusInfo];
              if (!info) return null;
              const Icon = info.icon;
              const pct = totalBills > 0 ? Math.round((s.count / totalBills) * 100) : 0;
              return (
                <div key={s.status}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '8px',
                      background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <Icon size={14} color={info.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{info.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: info.color }}>{s.count}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                        {formatCurrency(s.total)}
                      </div>
                    </div>
                  </div>
                  <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{ height: '100%', background: info.color, borderRadius: '2px' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
