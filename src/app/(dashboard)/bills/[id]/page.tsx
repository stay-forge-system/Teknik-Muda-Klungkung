import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import BillDetailClient from './BillDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('bills').select('bill_number').eq('id', id).single();
  return { title: data?.bill_number || 'Detail Bill' };
}

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: bill } = await supabase
    .from('bills')
    .select(`
      *,
      client:clients(*),
      items:bill_items(*, product:products(*))
    `)
    .eq('id', id)
    .single();

  if (!bill) notFound();

  // Sort items by sort_order
  if (bill.items) {
    bill.items.sort((a: any, b: any) => a.sort_order - b.sort_order);
  }

  return <BillDetailClient bill={bill} />;
}
