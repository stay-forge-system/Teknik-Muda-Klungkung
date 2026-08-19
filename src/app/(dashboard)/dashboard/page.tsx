import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch stats
  const [
    { count: totalBills },
    { count: totalClients },
    { count: paidBills },
    { count: sentBills },
    { count: draftBills },
    { data: recentBills },
    { data: paidBillsData },
  ] = await Promise.all([
    supabase.from('bills').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('bills').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
    supabase.from('bills').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
    supabase.from('bills').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('bills')
      .select('*, client:clients(name, company)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('bills')
      .select('total, created_at')
      .eq('status', 'paid'),
  ]);

  // Calculate total revenue
  const totalRevenue = paidBillsData?.reduce((sum, bill) => sum + (bill.total || 0), 0) || 0;

  return (
    <DashboardClient
      stats={{
        totalBills: totalBills || 0,
        totalClients: totalClients || 0,
        paidBills: paidBills || 0,
        sentBills: sentBills || 0,
        draftBills: draftBills || 0,
        totalRevenue,
      }}
      recentBills={recentBills || []}
    />
  );
}
