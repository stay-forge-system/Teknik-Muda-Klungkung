import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import QuotationDetailClient from './QuotationDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('quotations').select('quotation_number').eq('id', id).single();
  return { title: data?.quotation_number || 'Detail Penawaran' };
}

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quotation } = await supabase
    .from('quotations')
    .select(`
      *,
      client:clients(*),
      items:quotation_items(*, product:products(*)),
      creator:profiles(full_name)
    `)
    .eq('id', id)
    .single();

  if (!quotation) notFound();

  // Sort items by sort_order
  if (quotation.items) {
    quotation.items.sort((a: any, b: any) => a.sort_order - b.sort_order);
  }

  return <QuotationDetailClient quotation={quotation} />;
}
