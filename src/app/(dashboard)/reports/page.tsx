import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ReportsClient from './ReportsClient';

export const metadata = { title: 'Laporan' };

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: bills },
    { data: paidBills },
  ] = await Promise.all([
    supabase.from('bills').select('id, status, total, created_at, issue_date'),
    supabase.from('bills').select('total, created_at, issue_date').eq('status', 'paid'),
  ]);

  // Monthly revenue for last 6 months
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    const revenue = (paidBills || [])
      .filter(b => b.issue_date?.startsWith(monthKey))
      .reduce((sum, b) => sum + (b.total || 0), 0);
    return { month: monthName, revenue, monthKey };
  });

  // Status breakdown
  const statusBreakdown = ['draft', 'sent', 'paid', 'cancelled'].map(status => ({
    status,
    count: (bills || []).filter(b => b.status === status).length,
    total: (bills || []).filter(b => b.status === status).reduce((s, b) => s + (b.total || 0), 0),
  }));

  return (
    <ReportsClient
      monthlyData={monthlyData}
      statusBreakdown={statusBreakdown}
      totalBills={(bills || []).length}
      totalRevenue={(paidBills || []).reduce((s, b) => s + (b.total || 0), 0)}
    />
  );
}
