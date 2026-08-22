'use client';

import { useState } from 'react';
import { Quotation } from '@/types';
import { formatCurrency, formatDate } from '@/lib/pdf/generateBill';
import { generateQuotationHTML } from '@/lib/pdf/generateQuotation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Download, Printer, CheckCircle, Send, XCircle,
  FileText, Calendar, User, Hash, Edit2
} from 'lucide-react';

interface Props {
  quotation: Quotation;
}

const statusConfig = {
  draft: { label: 'Draft', className: 'badge-draft', icon: FileText },
  sent: { label: 'Dikirim', className: 'badge-sent', icon: Send },
  revised: { label: 'Direvisi', className: 'badge-cancelled', icon: Edit2 },
  deal: { label: 'Deal', className: 'badge-paid', icon: CheckCircle },
  rejected: { label: 'Ditolak', className: 'badge-cancelled', icon: XCircle },
};

export default function QuotationDetailClient({ quotation: initialQuo }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [quo, setQuo] = useState(initialQuo);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const updateStatus = async (status: string) => {
    setUpdatingStatus(true);
    const { error } = await supabase.from('quotations').update({ status }).eq('id', quo.id);
    if (error) showAlert('error', 'Gagal update status');
    else {
      setQuo({ ...quo, status: status as any });
      showAlert('success', 'Status berhasil diupdate');
    }
    setUpdatingStatus(false);
  };

  const handlePrint = () => {
    const html = generateQuotationHTML(quo);
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

      const html = generateQuotationHTML(quo);
      const container = document.createElement('div');
      container.innerHTML = html;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '794px'; // Fixed A4 width
      container.style.backgroundColor = '#ffffff';
      document.body.appendChild(container);

      const canvas = await html2canvas(container.querySelector('#quotation-pdf') as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${quo.quotation_number}.pdf`);

      document.body.removeChild(container);
      showAlert('success', 'PDF berhasil didownload');
    } catch {
      showAlert('error', 'Gagal generate PDF');
    }
  };

  const status = statusConfig[quo.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  return (
    <div style={{ maxWidth: '960px' }}>
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
            <Link href="/quotations" className="btn btn-ghost btn-sm">
              <ArrowLeft size={14} /> Kembali
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '22px' }}>{quo.quotation_number}</h1>
            <span className={`badge ${status.className}`}>
              <StatusIcon size={12} />
              {status.label}
            </span>
          </div>
          <p>{quo.title}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={15} /> Cetak
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadPDF}>
            <Download size={15} /> Download PDF
          </button>
          {quo.status === 'deal' && (
            <Link href={`/bills/new?quotation_id=${quo.id}`} className="btn btn-primary" style={{ background: 'var(--success)' }}>
              <CheckCircle size={15} /> Buat Tagihan (Bill)
            </Link>
          )}
        </div>
      </div>

      {/* Status Actions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {Object.entries(statusConfig).map(([key, val]) => (
          <button
            key={key}
            onClick={() => updateStatus(key)}
            disabled={updatingStatus || quo.status === key}
            className="btn btn-sm"
            style={{
              background: quo.status === key ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: quo.status === key ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
              opacity: quo.status === key ? 1 : 0.7,
            }}
          >
            <val.icon size={12} />
            {val.label}
          </button>
        ))}
      </div>

      <div className="grid grid-layout-sidebar" style={{ gridTemplateColumns: '1fr 280px', gap: '20px' }}>
        {/* Preview */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Preview Penawaran</span>
          </div>
          <div style={{ padding: '32px', background: '#FAFAFA', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', overflowX: 'auto' }}>
            <div dangerouslySetInnerHTML={{ __html: generateQuotationHTML(quo) }} style={{
              transform: 'scale(0.85)',
              transformOrigin: 'top center',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            }} />
          </div>
        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Detail Penawaran</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <Calendar size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Tgl Dibuat</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{formatDate(quo.issue_date)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <Calendar size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Berlaku Sampai</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {quo.valid_until ? formatDate(quo.valid_until) : '-'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <User size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Dibuat Oleh</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{quo.creator?.full_name || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
