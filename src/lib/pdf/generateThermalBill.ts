import { Bill } from '@/types';
import { formatCurrency, formatDate } from './generateBill';

export const generateThermalBillHTML = (bill: Bill): string => {
  const itemsHTML = (bill.items || []).map(item => {
    return `
      <tr>
        <td colspan="3" style="font-weight: 600; padding-top: 6px; font-size: 11px;">
          ${item.name}
        </td>
      </tr>
      <tr>
        <td style="color: #4B5563; font-size: 11px;">${item.quantity} ${item.unit} x ${formatCurrency(item.unit_price)}</td>
        <td style="text-align: right; font-weight: 600; font-size: 11px;" colspan="2">${formatCurrency(item.total)}</td>
      </tr>
    `;
  }).join('');

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <title>Struk Bill - ${bill.bill_number}</title>
        <style>
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body {
            font-family: 'monospace';
            width: 72mm;
            margin: 0 auto;
            padding: 4mm;
            color: #000;
            background: #fff;
            font-size: 11px;
            line-height: 1.4;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .border-top { border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
          .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; }
          td { vertical-align: top; }
        </style>
      </head>
      <body>
        <div class="text-center" style="margin-bottom: 12px;">
          <h2 style="margin: 0; font-size: 16px;">TMK</h2>
          <div style="font-size: 11px;">Teknik Muda Klungkung</div>
          <div style="font-size: 10px;">Jl. Raya Semarapura No.45, Bali</div>
        </div>
        
        <div class="border-bottom">
          <table style="font-size: 10px;">
            <tr>
              <td>No</td>
              <td>: ${bill.bill_number}</td>
            </tr>
            <tr>
              <td>Tgl</td>
              <td>: ${formatDate(bill.issue_date)}</td>
            </tr>
            <tr>
              <td>Plg</td>
              <td>: ${bill.client?.name}</td>
            </tr>
          </table>
        </div>

        <table style="margin-bottom: 8px;">
          ${itemsHTML}
        </table>

        <div class="border-top">
          <table>
            <tr>
              <td>Subtotal</td>
              <td class="text-right">${formatCurrency(bill.subtotal)}</td>
            </tr>
            ${bill.discount > 0 ? `
            <tr>
              <td>Diskon</td>
              <td class="text-right">-${formatCurrency(bill.discount)}</td>
            </tr>
            ` : ''}
            ${bill.tax > 0 ? `
            <tr>
              <td>PPN</td>
              <td class="text-right">${formatCurrency(bill.tax)}</td>
            </tr>
            ` : ''}
            <tr style="font-size: 13px; font-weight: bold;">
              <td style="padding-top: 4px;">TOTAL</td>
              <td class="text-right" style="padding-top: 4px;">${formatCurrency(bill.total)}</td>
            </tr>
          </table>
        </div>

        <div class="text-center" style="margin-top: 16px; font-size: 10px;">
          <div>Terima kasih atas kepercayaan Anda</div>
          <div style="margin-top: 4px;">-- STATUS: ${bill.status.toUpperCase()} --</div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `;
};
