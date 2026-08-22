'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quotationSchema, QuotationFormData } from '@/lib/validations';
import { Product, Client } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/pdf/generateBill';
import { Plus, Trash2, Search, X, ArrowLeft, Save, ChevronDown, Percent } from 'lucide-react';
import Link from 'next/link';
import { CustomDatePicker } from '@/components/DatePicker';
import { CurrencyInput } from '@/components/CurrencyInput';

export default function NewQuotationPage() {
  const router = useRouter();
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [productSearch, setProductSearch] = useState<number | null>(null);
  const [productQuery, setProductQuery] = useState('');
  const [showItemDiscount, setShowItemDiscount] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema) as any,
    defaultValues: {
      issue_date: new Date().toISOString().split('T')[0],
      valid_until: new Date().toISOString().split('T')[0],
      discount: 0,
      tax: 0,
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');
  const watchDiscount = watch('discount') || 0;
  const watchTax = watch('tax') || 0;

  const subtotal = watchItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const itemTotal = qty * price;
    const discPercent = Number(item.discount_percent) || 0;
    const itemNet = itemTotal - (itemTotal * discPercent / 100);
    return sum + itemNet;
  }, 0);

  const total = subtotal - Number(watchDiscount) + Number(watchTax);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from('clients').select('*').order('name'),
        supabase.from('products').select('*').order('category').order('name'),
      ]);
      setClients(c || []);
      setProducts(p || []);
    };
    fetch();
  }, [supabase]);

  const addProductToItem = (index: number, product: Product) => {
    setValue(`items.${index}.name`, product.name);
    setValue(`items.${index}.unit`, product.unit);
    setValue(`items.${index}.unit_price`, product.price);
    setValue(`items.${index}.product_id`, product.id);
    setValue(`items.${index}.is_custom_price`, product.is_custom_price);
    setValue(`items.${index}.discount_percent`, 0);
    setProductSearch(null);
    setProductQuery('');
  };

  const addEmptyItem = () => {
    append({
      name: '',
      description: '',
      quantity: 1,
      unit: 'pcs',
      unit_price: 0,
      discount_percent: 0,
      is_custom_price: false,
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(productQuery.toLowerCase()) ||
    (p.sku_code || '').toLowerCase().includes(productQuery.toLowerCase())
  );

  const onSubmit = async (data: QuotationFormData) => {
    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();

    // Generate quotation number via RPC or manually if RPC isn't available
    const { data: qNum, error: rpcError } = await supabase.rpc('generate_quotation_number');
    let quotationNumber = qNum;
    
    if (rpcError || !quotationNumber) {
      // Fallback if RPC fails
      const { data: qCount } = await supabase.from('quotations').select('id', { count: 'exact', head: true });
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const seq = ((qCount as any)?.count || 0) + 1;
      quotationNumber = `TMK-${month}-${year}-${String(seq).padStart(4, '0')}`;
    }

    const calculatedSubtotal = data.items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const disc = Number(item.discount_percent) || 0;
      const itemTotal = qty * price;
      return sum + (itemTotal - (itemTotal * disc / 100));
    }, 0);
    
    const calculatedTotal = calculatedSubtotal - (data.discount || 0) + (data.tax || 0);

    const { data: quo, error: quoError } = await supabase
      .from('quotations')
      .insert({
        quotation_number: quotationNumber,
        client_id: data.client_id,
        title: data.title,
        description: data.description,
        issue_date: data.issue_date,
        valid_until: data.valid_until || null,
        subtotal: calculatedSubtotal,
        discount: data.discount || 0,
        tax: data.tax || 0,
        total: calculatedTotal,
        notes: data.notes,
        status: 'draft',
        created_by: user?.id,
      })
      .select()
      .single();

    if (quoError) {
      setError('Gagal membuat surat penawaran: ' + quoError.message);
      setSaving(false);
      return;
    }

    // Insert items
    const itemsToInsert = data.items.map((item, i) => {
      const itemTotal = item.quantity * item.unit_price;
      const disc = item.discount_percent || 0;
      const netTotal = itemTotal - (itemTotal * disc / 100);
      
      return {
        quotation_id: quo.id,
        product_id: item.product_id || null,
        name: item.name,
        description: item.description || null,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        discount_percent: disc,
        total: netTotal,
        is_custom_price: item.is_custom_price,
        sort_order: i,
      };
    });

    const { error: itemsError } = await supabase.from('quotation_items').insert(itemsToInsert);
    if (itemsError) {
      setError('Gagal menyimpan item penawaran');
      setSaving(false);
      return;
    }

    router.push(`/quotations/${quo.id}`);
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Link href="/quotations" className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }}>
              <ArrowLeft size={14} /> Kembali
            </Link>
          </div>
          <h1>Buat Surat Penawaran</h1>
          <p>Isi detail penawaran untuk klien Anda</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Info */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <span className="card-title">Informasi Penawaran</span>
          </div>
          <div className="card-body grid grid-cols-2 gap-4">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label required">Klien</label>
              <select
                className={`form-select ${errors.client_id ? 'error' : ''}`}
                {...register('client_id')}
              >
                <option value="">-- Pilih Klien --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.company ? ` — ${c.company}` : ''}
                  </option>
                ))}
              </select>
              {errors.client_id && <span className="form-error">{errors.client_id.message}</span>}
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label required">Judul Penawaran</label>
              <input
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="e.g. Penawaran Instalasi CCTV Gedung A"
                {...register('title')}
              />
              {errors.title && <span className="form-error">{errors.title.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">Tanggal Dibuat</label>
              <Controller
                control={control}
                name="issue_date"
                render={({ field }) => (
                  <CustomDatePicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Berlaku Sampai (Valid Until)</label>
              <Controller
                control={control}
                name="valid_until"
                render={({ field }) => (
                  <CustomDatePicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Keterangan / Pendahuluan</label>
              <textarea
                className="form-textarea"
                placeholder="Keterangan tambahan (opsional)"
                rows={2}
                {...register('description')}
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <span className="card-title">Item Penawaran</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className={`btn btn-sm ${showItemDiscount ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => setShowItemDiscount(!showItemDiscount)}
              >
                <Percent size={14} /> {showItemDiscount ? 'Sembunyikan Diskon Item' : 'Tampilkan Diskon Item'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addEmptyItem}>
                <Plus size={14} /> Tambah Item
              </button>
            </div>
          </div>
          <div className="card-body">
            {fields.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: 'var(--text-muted)',
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-lg)',
              }}>
                <p style={{ marginBottom: '12px' }}>Belum ada item penawaran.</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={addEmptyItem}>
                  <Plus size={14} /> Tambah Item Pertama
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <AnimatePresence>
                  {fields.map((field, index) => {
                    const qty = Number(watchItems[index]?.quantity) || 0;
                    const price = Number(watchItems[index]?.unit_price) || 0;
                    const disc = Number(watchItems[index]?.discount_percent) || 0;
                    const gross = qty * price;
                    const itemTotal = gross - (gross * disc / 100);

                    return (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          overflow: productSearch === index ? 'visible' : 'hidden',
                          zIndex: productSearch === index ? 50 : 1,
                          position: 'relative',
                        }}
                      >
                        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <input type="hidden" {...register(`items.${index}.product_id`)} />
                          <input type="hidden" {...register(`items.${index}.is_custom_price`)} />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                            <div style={{ position: 'relative' }}>
                              <input
                                className="form-input"
                                placeholder="Nama item/layanan"
                                {...register(`items.${index}.name`)}
                              />
                              {productSearch === index && (
                                <div style={{
                                  position: 'absolute', top: '100%', left: 0, right: 0,
                                  background: 'var(--surface)', border: '1px solid var(--border)',
                                  borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
                                  zIndex: 10, maxHeight: '240px', overflowY: 'auto', marginTop: '4px',
                                }}>
                                  <div style={{ padding: '8px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10 }}>
                                    <div style={{ position: 'relative' }}>
                                      <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                      <input
                                        className="form-input"
                                        style={{ paddingLeft: '28px', fontSize: '13px' }}
                                        placeholder="Cari produk (Nama / SKU)..."
                                        value={productQuery}
                                        onChange={e => setProductQuery(e.target.value)}
                                        autoFocus
                                      />
                                    </div>
                                  </div>
                                  {filteredProducts.map(p => (
                                    <div
                                      key={p.id}
                                      onClick={() => addProductToItem(index, p)}
                                      style={{
                                        padding: '10px 12px', cursor: 'pointer', display: 'flex',
                                        justifyContent: 'space-between', alignItems: 'center',
                                        fontSize: '13px', transition: 'background 0.1s',
                                      }}
                                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                      <div>
                                        <div style={{ fontWeight: '600' }}>{p.sku_code && <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>[{p.sku_code}]</span>}{p.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.category} • /{p.unit}</div>
                                      </div>
                                      <div style={{ fontWeight: '700', color: 'var(--accent)', fontSize: '12px' }}>
                                        {p.is_custom_price ? 'Custom' : formatCurrency(p.price)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setProductSearch(productSearch === index ? null : index);
                                setProductQuery('');
                              }}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              Pilih Produk <ChevronDown size={12} />
                            </button>
                          </div>

                          <input
                            className="form-input"
                            placeholder="Deskripsi spesifikasi detail (opsional)"
                            style={{ fontSize: '13px' }}
                            {...register(`items.${index}.description`)}
                          />

                          <div style={{ display: 'grid', gridTemplateColumns: showItemDiscount ? '90px 110px 160px 80px 1fr 36px' : '90px 110px 160px 1fr 36px', gap: '8px', alignItems: 'center' }}>
                            <div className="form-group" style={{ gap: '4px' }}>
                              <label style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Qty</label>
                              <input
                                type="number" step="0.01" className="form-input" placeholder="1" style={{ fontSize: '13px' }}
                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                              />
                            </div>
                            <div className="form-group" style={{ gap: '4px' }}>
                              <label style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Satuan</label>
                              <input
                                className="form-input" placeholder="pcs" style={{ fontSize: '13px' }}
                                {...register(`items.${index}.unit`)}
                              />
                            </div>
                            <div className="form-group" style={{ gap: '4px' }}>
                              <label style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Harga Satuan (Rp)</label>
                              <Controller
                                control={control}
                                name={`items.${index}.unit_price`}
                                render={({ field }) => (
                                  <CurrencyInput
                                    className="form-input"
                                    placeholder="0"
                                    style={{ fontSize: '13px' }}
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                )}
                              />
                            </div>
                            
                            {showItemDiscount && (
                              <div className="form-group" style={{ gap: '4px' }}>
                                <label style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Disc %</label>
                                <input
                                  type="number" className="form-input" placeholder="0" style={{ fontSize: '13px' }} max={100}
                                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                  {...register(`items.${index}.discount_percent`, { valueAsNumber: true })}
                                />
                              </div>
                            )}

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total</div>
                              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent)' }}>
                                {formatCurrency(itemTotal)}
                              </div>
                            </div>
                            <button
                              type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => remove(index)}
                              style={{ color: 'var(--danger)', alignSelf: 'flex-end' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <button type="button" className="btn btn-secondary btn-sm" onClick={addEmptyItem} style={{ alignSelf: 'flex-start' }}>
                  <Plus size={14} /> Tambah Item
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Totals & Notes */}
        <div className="grid grid-layout-sidebar" style={{ gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'start' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Syarat & Ketentuan / Catatan</span>
            </div>
            <div className="card-body">
              <textarea
                className="form-textarea"
                placeholder="Tuliskan syarat pembayaran, garansi, dsb (opsional)"
                rows={4}
                {...register('notes')}
              />
            </div>
          </div>

          <div className="card" style={{ minWidth: '360px' }}>
            <div className="card-header">
              <span className="card-title">Ringkasan</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="bill-total-row">
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Subtotal</span>
                <span style={{ fontWeight: '600' }}>{formatCurrency(subtotal)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Diskon Tambahan (Rp)</span>
                <Controller
                  control={control}
                  name="discount"
                  render={({ field }) => (
                    <CurrencyInput
                      className="form-input"
                      style={{ width: '140px', textAlign: 'right', fontSize: '13px' }}
                      placeholder="0"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>PPN (Rp)</span>
                <Controller
                  control={control}
                  name="tax"
                  render={({ field }) => (
                    <CurrencyInput
                      className="form-input"
                      style={{ width: '140px', textAlign: 'right', fontSize: '13px' }}
                      placeholder="0"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div style={{ borderTop: '2px solid var(--accent)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '800' }}>TOTAL</span>
                <span style={{ fontSize: '22px', fontWeight: '900', color: 'var(--accent)' }}>
                  {formatCurrency(total)}
                </span>
              </div>

              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Draft'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
