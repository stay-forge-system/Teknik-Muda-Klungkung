export type UserRole = 'owner' | 'admin' | 'teknisi' | 'viewer';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  is_verified?: boolean;
}

export type ProductCategory =
  | 'CCTV'
  | 'Access Point'
  | 'Instalasi Listrik'
  | 'Kabel LAN'
  | 'Kabel FO'
  | 'Kabel Listrik'
  | 'Cleaning AC'
  | 'Jasa'
  | 'Lainnya';

export type ProductUnit = 'pcs' | 'meter' | 'unit' | 'set' | 'titik' | 'roll' | 'box';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description?: string;
  unit: ProductUnit;
  price: number;
  is_custom_price: boolean;
  stock?: number;
  created_at: string;
  created_by?: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  created_at: string;
  created_by?: string;
}

export type BillStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

export interface BillItem {
  id: string;
  bill_id: string;
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  is_custom_price: boolean;
  sort_order: number;
  product?: Product;
}

export interface Bill {
  id: string;
  bill_number: string;
  client_id: string;
  title: string;
  description?: string;
  status: BillStatus;
  issue_date: string;
  due_date?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  items?: BillItem[];
  creator?: Profile;
}

export interface DashboardStats {
  total_revenue: number;
  total_bills: number;
  total_clients: number;
  paid_bills: number;
  pending_bills: number;
  draft_bills: number;
  monthly_revenue: { month: string; revenue: number }[];
  category_breakdown: { category: string; total: number }[];
}
