import { Bill } from '@/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return format(new Date(date), 'd MMMM yyyy', { locale: idLocale });
}

export function generateBillHTML(bill: Bill): string {
  const statusLabel: Record<string, string> = {
    draft: 'DRAFT',
    sent: 'TERKIRIM',
    paid: 'LUNAS',
    cancelled: 'DIBATALKAN',
  };

  const statusColor: Record<string, string> = {
    draft: '#6B7280',
    sent: '#2563EB',
    paid: '#16A34A',
    cancelled: '#DC2626',
  };

  const itemsHTML = bill.items?.map((item, index) => `
    <tr style="border-bottom: 1px solid #F3F4F6;">
      <td style="padding: 16px 0; font-size: 13px; color: #374151;">${index + 1}</td>
      <td style="padding: 16px 0;">
        <div style="font-size: 13px; font-weight: 500; color: #111827;">${item.name}</div>
        ${item.description ? `<div style="font-size: 12px; color: #9CA3AF; margin-top: 4px;">${item.description}</div>` : ''}
      </td>
      <td style="padding: 16px 0; font-size: 13px; color: #4B5563; text-align: center;">${item.quantity} ${item.unit}</td>
      <td style="padding: 16px 0; font-size: 13px; color: #4B5563; text-align: right;">${formatCurrency(item.unit_price)}</td>
      <td style="padding: 16px 0; font-size: 13px; font-weight: 600; color: #111827; text-align: right;">${formatCurrency(item.total)}</td>
    </tr>
  `).join('') || '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111827; }
    .page { max-width: 794px; margin: 0 auto; padding: 48px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
    .logo-section h1 { font-size: 28px; font-weight: 900; color: #111827; letter-spacing: -1px; }
    .logo-section p { font-size: 12px; color: #9CA3AF; margin-top: 4px; }
    .bill-meta { text-align: right; }
    .bill-number { font-size: 22px; font-weight: 700; color: #111827; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; color: white; margin-top: 8px; background: ${statusColor[bill.status]}; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; padding: 24px 0; border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; }
    .info-block label { font-size: 11px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-block p { font-size: 14px; color: #111827; margin-top: 6px; font-weight: 500; }
    .info-block .name { font-size: 15px; font-weight: 700; }
    .title-section { margin-bottom: 32px; }
    .title-section h2 { font-size: 20px; font-weight: 700; color: #111827; }
    .title-section p { font-size: 14px; color: #6B7280; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    thead tr { }
    thead th { padding: 12px 0; font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E7EB; }
    thead th:first-child { text-align: left; }
    thead th:last-child { }
    thead th:nth-child(3), thead th:nth-child(4), thead th:nth-child(5) { text-align: right; }
    tbody tr:nth-child(even) { background: transparent; }
    .totals { margin-left: auto; width: 320px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #4B5563; }
    .total-row.divider { border-top: 1px solid #E5E7EB; margin-top: 8px; padding-top: 16px; }
    .total-row.grand { font-size: 18px; font-weight: 800; color: #111827; border-top: 1px solid #111827; padding-top: 16px; margin-top: 12px; }
    .notes { margin-top: 40px; padding-top: 24px; border-top: 1px solid #E5E7EB; }
    .notes label { font-size: 11px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; }
    .notes p { font-size: 13px; color: #4B5563; margin-top: 8px; line-height: 1.6; }
    .footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center; }
    .footer p { font-size: 12px; color: #9CA3AF; }
    .signature { text-align: center; }
    .signature .line { width: 160px; border-top: 1px solid #D1D5DB; margin-top: 60px; }
    .signature p { font-size: 12px; color: #6B7280; margin-top: 8px; }
  </style>
</head>
<body>
<div class="page" id="bill-pdf">
  <!-- Header -->
  <div class="header">
    <div class="logo-section">
      <h1>TMK</h1>
      <p style="font-size:14px; font-weight:600; color:#374151; margin-top:4px;">Teknik Muda Klungkung</p>
      <p style="margin-top:2px;">Solusi Teknologi & Keamanan Terpadu</p>
      <p style="margin-top:8px; font-size:12px; color:#6B7280;">CCTV • Access Point • Instalasi Listrik</p>
      <p style="font-size:12px; color:#6B7280;">Kabel LAN/FO • Cleaning AC</p>
    </div>
    <div class="bill-meta">
      <div class="bill-number">${bill.bill_number}</div>
      <div class="status-badge">${statusLabel[bill.status]}</div>
      <div style="font-size:12px; color:#6B7280; margin-top:12px;">
        <div>Tanggal: ${formatDate(bill.issue_date)}</div>
        ${bill.due_date ? `<div>Jatuh tempo: ${formatDate(bill.due_date)}</div>` : ''}
      </div>
    </div>
  </div>

  <!-- Bill Info -->
  <div class="info-grid">
    <div class="info-block">
      <label>Dari</label>
      <p class="name">TMK (Teknik Muda Klungkung)</p>
      <p>Jl. Teknologi No. 1</p>
      <p>info@tmk.co.id</p>
    </div>
    <div class="info-block">
      <label>Kepada</label>
      <p class="name">${bill.client?.name || '-'}</p>
      ${bill.client?.company ? `<p>${bill.client.company}</p>` : ''}
      ${bill.client?.address ? `<p>${bill.client.address}</p>` : ''}
      ${bill.client?.phone ? `<p>${bill.client.phone}</p>` : ''}
    </div>
  </div>

  <!-- Title -->
  <div class="title-section">
    <h2>${bill.title}</h2>
    ${bill.description ? `<p>${bill.description}</p>` : ''}
  </div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th style="width:40px; text-align:left;">#</th>
        <th style="text-align:left;">Deskripsi</th>
        <th style="text-align:right;">Qty</th>
        <th style="text-align:right;">Harga Satuan</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>${formatCurrency(bill.subtotal)}</span>
    </div>
    ${bill.discount > 0 ? `
    <div class="total-row">
      <span>Diskon</span>
      <span style="color:#DC2626;">- ${formatCurrency(bill.discount)}</span>
    </div>` : ''}
    ${bill.tax > 0 ? `
    <div class="total-row">
      <span>PPN</span>
      <span>${formatCurrency(bill.tax)}</span>
    </div>` : ''}
    <div class="total-row grand">
      <span>TOTAL</span>
      <span>${formatCurrency(bill.total)}</span>
    </div>
  </div>

  <!-- Notes -->
  ${bill.notes ? `
  <div class="notes">
    <label>Catatan</label>
    <p>${bill.notes}</p>
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <div>
      <p>Terima kasih atas kepercayaan Anda!</p>
      <p>Dokumen ini digenerate secara otomatis oleh sistem TMK.</p>
    </div>
    <div class="signature">
      <div class="line" style="margin: 0 auto;"></div>
      <p>TTD & Stempel</p>
      <p style="font-weight:600;">TMK (Teknik Muda Klungkung)</p>
    </div>
  </div>
</div>
</body>
</html>
  `;
}
