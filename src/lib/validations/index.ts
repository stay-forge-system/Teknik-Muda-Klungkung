import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const productSchema = z.object({
  sku_code: z.string().optional(),
  name: z.string().min(1, 'Nama produk wajib diisi'),
  category: z.string().min(1, 'Kategori wajib diisi'),
  description: z.string().optional(),
  unit: z.enum(['pcs', 'meter', 'unit', 'set', 'titik', 'roll', 'box']),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
  is_custom_price: z.boolean(),
  stock: z.number().optional(),
});

export const clientSchema = z.object({
  name: z.string().min(1, 'Nama klien wajib diisi'),
  company: z.string().optional(),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
});

export const billItemSchema = z.object({
  product_id: z.string().optional(),
  name: z.string().min(1, 'Nama item wajib diisi'),
  description: z.string().optional(),
  quantity: z.number().min(0.01, 'Jumlah minimal 0.01'),
  unit: z.string().min(1, 'Satuan wajib diisi'),
  unit_price: z.number().min(0, 'Harga tidak boleh negatif'),
  is_custom_price: z.boolean(),
});

export const billSchema = z.object({
  client_id: z.string().min(1, 'Klien wajib dipilih'),
  title: z.string().min(1, 'Judul bill wajib diisi'),
  description: z.string().optional(),
  issue_date: z.string().min(1, 'Tanggal bill wajib diisi'),
  due_date: z.string().optional(),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(billItemSchema).min(1, 'Minimal satu item'),
});

export const quotationItemSchema = z.object({
  product_id: z.string().optional(),
  name: z.string().min(1, 'Nama item wajib diisi'),
  description: z.string().optional(),
  quantity: z.number().min(0.01, 'Jumlah minimal 0.01'),
  unit: z.string().min(1, 'Satuan wajib diisi'),
  unit_price: z.number().min(0, 'Harga tidak boleh negatif'),
  discount_percent: z.number().min(0).max(100).default(0),
  is_custom_price: z.boolean(),
});

export const quotationSchema = z.object({
  client_id: z.string().min(1, 'Klien wajib dipilih'),
  title: z.string().min(1, 'Judul penawaran wajib diisi'),
  description: z.string().optional(),
  issue_date: z.string().min(1, 'Tanggal penawaran wajib diisi'),
  valid_until: z.string().optional(),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, 'Minimal satu item'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type ClientFormData = z.infer<typeof clientSchema>;
export type BillFormData = z.infer<typeof billSchema>;
export type BillItemFormData = z.infer<typeof billItemSchema>;
export type QuotationFormData = z.infer<typeof quotationSchema>;
export type QuotationItemFormData = z.infer<typeof quotationItemSchema>;
