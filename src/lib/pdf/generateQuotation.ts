import { Quotation } from '@/types';
import { formatCurrency, formatDate } from './generateBill';

export const generateQuotationHTML = (quo: Quotation): string => {
  const itemsHTML = (quo.items || []).map((item, index) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const discPercent = Number(item.discount_percent) || 0;
    
    // Formatting display
    const discDisplay = discPercent > 0 ? `${discPercent}%` : '-';
    
    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: center;">${index + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">${item.product?.sku_code || '-'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">
          <div style="font-weight: 600; color: #111827;">${item.name}</div>
          ${item.description ? `<div style="font-size: 11px; color: #6B7280; margin-top: 2px;">${item.description}</div>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: center;">${qty}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: center; text-transform: uppercase;">${item.unit}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: right;">${formatCurrency(price)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: center;">${discDisplay}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: 600;">${formatCurrency(item.total)}</td>
      </tr>
    `;
  }).join('');

  return `
    <div id="quotation-pdf" style="font-family: 'Inter', sans-serif; max-width: 794px; margin: 0 auto; padding: 40px; background: white; color: #111827;">
      
      <!-- Watermark Draft (If applicable) -->
      ${quo.status === 'draft' ? `
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; font-weight: 900; color: rgba(0,0,0,0.03); z-index: 0; pointer-events: none; letter-spacing: 20px;">
        DRAFT
      </div>
      ` : ''}

      <div style="position: relative; z-index: 1;">
        <!-- Header Section -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
          <div>
            <!-- Placeholder for Logo -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 32px; height: 32px; background: #00AEEF; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                <div style="width: 16px; height: 16px; border: 3px solid white; border-radius: 50%;"></div>
              </div>
              <div style="font-size: 24px; font-weight: 900; color: #00AEEF; letter-spacing: -0.5px;">TMK SYSTEM</div>
            </div>
          </div>
          <div style="text-align: right;">
            <h1 style="font-size: 28px; font-weight: 800; color: #00AEEF; margin: 0 0 8px 0; text-transform: uppercase;">PENAWARAN PENJUALAN</h1>
            <div style="font-size: 16px; font-weight: 700;">${quo.quotation_number}</div>
          </div>
        </div>

        <!-- Meta Section -->
        <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 20px; margin-bottom: 40px; font-size: 13px;">
          
          <!-- Dari -->
          <div>
            <div style="font-weight: 700; margin-bottom: 8px;">Dari:</div>
            <div style="margin-bottom: 4px;">TMK (Teknik Muda Klungkung)</div>
            <div style="color: #4B5563;">Jl. Raya Semarapura No. 45<br/>Klungkung, Bali</div>
          </div>
          
          <!-- Kepada -->
          <div>
            <div style="font-weight: 700; margin-bottom: 8px;">Kepada:</div>
            <div style="margin-bottom: 4px;">${quo.client?.name || '-'}</div>
            <div style="color: #4B5563;">
              ${quo.client?.company ? `${quo.client.company}<br/>` : ''}
              ${quo.client?.address || ''}
            </div>
          </div>
          
          <!-- Dates & Sales -->
          <div style="display: grid; grid-template-columns: auto auto; gap: 8px 24px; align-content: flex-start;">
            <div style="color: #4B5563;">Tanggal</div>
            <div style="font-weight: 600;">: ${formatDate(quo.issue_date)}</div>
            
            <div style="color: #4B5563;">Termin</div>
            <div style="font-weight: 600;">: ${quo.valid_until ? formatDate(quo.valid_until) : '-'}</div>
          </div>
        </div>
        
        <!-- Title / Intro -->
        ${quo.title || quo.description ? `
        <div style="margin-bottom: 24px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">Perihal: ${quo.title}</div>
          ${quo.description ? `<div style="font-size: 13px; color: #4B5563;">${quo.description.replace(/\\n/g, '<br/>')}</div>` : ''}
        </div>
        ` : ''}

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 12px;">
          <thead>
            <tr style="background: #00AEEF; color: white;">
              <th style="padding: 12px 10px; text-align: center; font-weight: 600; width: 40px;">No</th>
              <th style="padding: 12px 10px; text-align: left; font-weight: 600; width: 80px;">Kode</th>
              <th style="padding: 12px 10px; text-align: left; font-weight: 600;">Nama Produk</th>
              <th style="padding: 12px 10px; text-align: center; font-weight: 600; width: 50px;">Qty</th>
              <th style="padding: 12px 10px; text-align: center; font-weight: 600; width: 70px;">Satuan</th>
              <th style="padding: 12px 10px; text-align: right; font-weight: 600; width: 100px;">Harga</th>
              <th style="padding: 12px 10px; text-align: center; font-weight: 600; width: 60px;">Disc</th>
              <th style="padding: 12px 10px; text-align: right; font-weight: 600; width: 110px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <!-- Summary & Signatures -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
          
          <!-- Notes Section -->
          <div style="width: 50%; font-size: 12px;">
            ${quo.notes ? `
            <div style="font-weight: 700; margin-bottom: 4px;">Keterangan / Syarat & Ketentuan:</div>
            <div style="color: #4B5563; line-height: 1.5; white-space: pre-wrap;">${quo.notes}</div>
            ` : ''}
          </div>
          
          <!-- Totals -->
          <div style="width: 300px;">
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #E5E7EB; font-size: 13px;">
              <div style="color: #4B5563;">Subtotal</div>
              <div style="font-weight: 600;">${formatCurrency(quo.subtotal)}</div>
            </div>
            ${quo.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #E5E7EB; font-size: 13px;">
              <div style="color: #4B5563;">Diskon Tambahan</div>
              <div style="font-weight: 600; color: #EF4444;">-${formatCurrency(quo.discount)}</div>
            </div>
            ` : ''}
            ${quo.tax > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #E5E7EB; font-size: 13px;">
              <div style="color: #4B5563;">PPN</div>
              <div style="font-weight: 600;">${formatCurrency(quo.tax)}</div>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 16px;">
              <div style="font-weight: 800;">TOTAL</div>
              <div style="font-weight: 800; color: #00AEEF;">${formatCurrency(quo.total)}</div>
            </div>
          </div>
        </div>
        
        <!-- Signatures -->
        <div style="display: flex; justify-content: flex-end; margin-top: 40px; padding-right: 40px;">
          <div style="text-align: center; width: 200px;">
            <div style="font-size: 13px; margin-bottom: 70px;">Hormat Kami,</div>
            <div style="font-weight: 700; font-size: 14px; text-transform: uppercase;">TMK</div>
          </div>
        </div>

      </div>
    </div>
  `;
};
