'use client';

import { useState } from 'react';
import { Bill } from '@/types';
import { generateBillHTML, formatCurrency, formatDate } from '@/lib/pdf/generateBill';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Download, Printer, CheckCircle, Send, XCircle,
  FileText, Calendar, User, Hash, Edit2
} from 'lucide-react';

interface Props {
  bill: Bill;
}

const statusConfig = {
  draft: { label: 'Draft', className: 'badge-draft', icon: FileText },
  sent: { label: 'Terkirim', className: 'badge-sent', icon: Send },
  paid: { label: 'Lunas', className: 'badge-paid', icon: CheckCircle },
  cancelled: { label: 'Dibatalkan', className: 'badge-cancelled', icon: XCircle },
};

export default function BillDetailClient({ bill: initialBill }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [bill, setBill] = useState(initialBill);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const updateStatus = async (status: string) => {
    setUpdatingStatus(true);
    const { error } = await supabase.from('bills').update({ status }).eq('id', bill.id);
    if (error) showAlert('error', 'Gagal update status');
    else {
      setBill({ ...bill, status: status as any });
      showAlert('success', 'Status berhasil diupdate');
    }
    setUpdatingStatus(false);
  };

  const handlePrint = () => {
    const html = generateBillHTML(bill);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      const html = generateBillHTML(bill);
      const container = document.createElement('div');
      container.innerHTML = html;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      const canvas = await html2canvas(container.querySelector('#bill-pdf') as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${bill.bill_number}.pdf`);

      document.body.removeChild(container);
      showAlert('success', 'PDF berhasil didownload');
    } catch {
      showAlert('error', 'Gagal generate PDF');
    }
  };

  const status = statusConfig[bill.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* Alert */}
      {alert && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`alert alert-${alert.type}`}
          style={{ marginBottom: '20px' }}
        >
          {alert.message}
        </motion.div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Link href="/bills" className="btn btn-ghost btn-sm">
              <ArrowLeft size={14} /> Kembali
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '22px' }}>{bill.bill_number}</h1>
            <span className={`badge ${status.className}`}>
              <StatusIcon size={12} />
              {status.label}
            </span>
          </div>
          <p>{bill.title}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handlePrint} id="print-bill-btn">
            <Printer size={15} /> Cetak
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadPDF} id="download-pdf-btn">
            <Download size={15} /> Download PDF
          </button>
          {bill.status === 'draft' && (
            <button className="btn btn-primary" onClick={() => updateStatus('sent')} disabled={updatingStatus} id="send-bill-btn">
              <Send size={15} /> Kirim ke Klien
            </button>
          )}
          {bill.status === 'sent' && (
            <button
              className="btn btn-primary"
              onClick={() => updateStatus('paid')}
              disabled={updatingStatus}
              style={{ background: 'var(--success)' }}
              id="mark-paid-btn"
            >
              <CheckCircle size={15} /> Tandai Lunas
            </button>
          )}
        </div>
      </div>

      {/* Status Actions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {Object.entries(statusConfig).map(([key, val]) => (
          <button
            key={key}
            onClick={() => updateStatus(key)}
            disabled={updatingStatus || bill.status === key}
            className="btn btn-sm"
            id={`status-${key}`}
            style={{
              background: bill.status === key ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: bill.status === key ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
              opacity: bill.status === key ? 1 : 0.7,
            }}
          >
            <val.icon size={12} />
            {val.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px' }}>
        {/* Bill Preview */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Preview Invoice</span>
          </div>
          <div style={{ padding: '32px', background: '#FAFAFA', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
            {/* Mini Invoice Preview */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0066FF' }}>TMK</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Solusi Teknologi & Keamanan Terpadu</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>{bill.bill_number}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                    {formatDate(bill.issue_date)}
                  </div>
                  {bill.due_date && (
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                      Jatuh tempo: {formatDate(bill.due_date)}
                    </div>
                  )}
                </div>
              </div>

              {/* Client Info */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                padding: '20px',
                background: '#F9FAFB',
                borderRadius: '10px',
                marginBottom: '24px',
              }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Dari</div>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>PT. TMK Indonesia</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Kepada</div>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{bill.client?.name}</div>
                  {bill.client?.company && <div style={{ fontSize: '12px', color: '#6B7280' }}>{bill.client.company}</div>}
                  {bill.client?.address && <div style={{ fontSize: '12px', color: '#6B7280' }}>{bill.client.address}</div>}
                  {bill.client?.phone && <div style={{ fontSize: '12px', color: '#6B7280' }}>{bill.client.phone}</div>}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{bill.title}</div>
                {bill.description && <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>{bill.description}</div>}
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ background: '#0066FF' }}>
                    <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: 'white', textAlign: 'left', borderRadius: '6px 0 0 0' }}>Deskripsi</th>
                    <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: 'white', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: 'white', textAlign: 'right' }}>Harga</th>
                    <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: 'white', textAlign: 'right', borderRadius: '0 6px 0 0' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items?.map((item, i) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 1 ? '#F9FAFB' : 'white' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{item.name}</div>
                        {item.description && <div style={{ fontSize: '11px', color: '#6B7280' }}>{item.description}</div>}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: '#374151' }}>
                        {item.quantity} {item.unit}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: '#374151' }}>
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: '700' }}>
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ marginLeft: 'auto', maxWidth: '280px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                  <span style={{ color: '#6B7280' }}>Subtotal</span>
                  <span>{formatCurrency(bill.subtotal)}</span>
                </div>
                {bill.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                    <span style={{ color: '#6B7280' }}>Diskon</span>
                    <span style={{ color: '#DC2626' }}>- {formatCurrency(bill.discount)}</span>
                  </div>
                )}
                {bill.tax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                    <span style={{ color: '#6B7280' }}>PPN</span>
                    <span>{formatCurrency(bill.tax)}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0 0',
                  borderTop: '2px solid #0066FF',
                  marginTop: '8px',
                }}>
                  <span style={{ fontSize: '16px', fontWeight: '800' }}>TOTAL</span>
                  <span style={{ fontSize: '20px', fontWeight: '900', color: '#0066FF' }}>
                    {formatCurrency(bill.total)}
                  </span>
                </div>
              </div>

              {bill.notes && (
                <div style={{
                  marginTop: '24px',
                  padding: '14px 16px',
                  background: '#FFFBEB',
                  borderLeft: '4px solid #F59E0B',
                  borderRadius: '0 8px 8px 0',
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#92400E', textTransform: 'uppercase', marginBottom: '4px' }}>Catatan</div>
                  <div style={{ fontSize: '13px', color: '#78350F' }}>{bill.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Bill Info */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Informasi Bill</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: Hash, label: 'Nomor', value: bill.bill_number },
                { icon: Calendar, label: 'Tanggal', value: formatDate(bill.issue_date) },
                { icon: Calendar, label: 'Jatuh Tempo', value: bill.due_date ? formatDate(bill.due_date) : '-' },
                { icon: User, label: 'Klien', value: bill.client?.name || '-' },
              ].map(info => {
                const Icon = info.icon;
                return (
                  <div key={info.label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <Icon size={14} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {info.label}
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>
                        {info.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Ringkasan</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span style={{ fontWeight: '600' }}>{formatCurrency(bill.subtotal)}</span>
              </div>
              {bill.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Diskon</span>
                  <span style={{ color: 'var(--danger)', fontWeight: '600' }}>- {formatCurrency(bill.discount)}</span>
                </div>
              )}
              {bill.tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>PPN</span>
                  <span style={{ fontWeight: '600' }}>{formatCurrency(bill.tax)}</span>
                </div>
              )}
              <div style={{ borderTop: '2px solid var(--accent)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '800' }}>TOTAL</span>
                <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--accent)' }}>
                  {formatCurrency(bill.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn btn-primary" onClick={handleDownloadPDF} id="download-pdf-side-btn">
              <Download size={15} /> Download PDF
            </button>
            <button className="btn btn-secondary" onClick={handlePrint} id="print-side-btn">
              <Printer size={15} /> Cetak
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
