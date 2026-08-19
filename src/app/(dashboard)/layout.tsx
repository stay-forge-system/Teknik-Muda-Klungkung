'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  BarChart3,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Bell,
  User,
  UserCog,
} from 'lucide-react';
import { Profile } from '@/types';

const navItems = [
  {
    label: 'Menu Utama',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/bills', icon: FileText, label: 'Bill & Invoice' },
    ],
  },
  {
    label: 'Manajemen',
    items: [
      { href: '/products', icon: Package, label: 'Produk & Barang' },
      { href: '/clients', icon: Users, label: 'Klien' },
    ],
  },
  {
    label: 'Laporan',
    items: [
      { href: '/reports', icon: BarChart3, label: 'Laporan' },
    ],
  },
  {
    label: 'Pengaturan',
    items: [
      { href: '/users', icon: UserCog, label: 'User & Akses', adminOnly: true },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="brand">TMK</div>
        <div className="tagline">Core System</div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" style={{ flex: 1 }}>
        {navItems.map((section) => {
          const visibleItems = section.items.filter(item =>
            !(item as any).adminOnly || profile?.role === 'owner' || profile?.role === 'admin'
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${active ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="nav-icon" size={17} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {active && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {profile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px',
            borderRadius: 'var(--radius)',
            marginBottom: '8px',
          }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <User size={16} color="var(--accent)" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.full_name}
              </div>
              <div style={{
                fontSize: '11px',
                color: profile.role === 'owner' ? '#D97706' : profile.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)',
                textTransform: 'capitalize',
                fontWeight: profile.role === 'owner' ? '700' : '500',
              }}>
                {profile.role === 'owner' ? '👑 Owner' : profile.role === 'admin' ? 'Admin' : profile.role === 'teknisi' ? 'Teknisi' : 'Viewer'}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="nav-item"
          style={{ color: 'var(--danger)', width: '100%' }}
          id="logout-btn"
        >
          <LogOut size={16} />
          <span>Keluar</span>
        </button>
      </div>
    </>
  );

  const pageTitle = navItems
    .flatMap(s => s.items)
    .find(item => isActive(item.href))?.label || 'TMK';

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 39,
                backdropFilter: 'blur(4px)',
              }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '260px',
                height: '100vh',
                background: 'var(--sidebar-bg)',
                borderRight: '1px solid var(--border)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
              }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSidebarOpen(true)}
            style={{ display: 'none', marginRight: '8px' }}
            id="mobile-menu-btn"
            aria-label="Buka menu"
          >
            <Menu size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {pageTitle}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-ghost btn-icon" aria-label="Notifikasi">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <motion.main
          className="page-content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          key={pathname}
        >
          {children}
        </motion.main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
