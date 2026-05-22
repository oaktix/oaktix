// src/app/(dashboard)/admin/page.tsx
import type { Metadata } from 'next';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export const generateMetadata = async (): Promise<Metadata> => ({
  title: 'Admin Dashboard – OakTix',
  description: 'Super admin console for monitoring platform health and managing vendors.',
  openGraph: {
    title: 'Admin Dashboard – OakTix',
    description: 'Super admin console for monitoring platform health and managing vendors.',
    images: [{ url: '/logo-header.png', width: 1200, height: 630, alt: 'OakTix' }],
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Admin Dashboard – OakTix',
    description: 'Super admin console for monitoring platform health and managing vendors.',
    images: ['/logo-header.png'],
  },
});

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
