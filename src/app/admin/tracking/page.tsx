'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, Users, Monitor, Search, RefreshCw,
  Shield, User, Package, Activity,
  Pencil, Trash2, Plus, X,
  Mail, MailOpen, Trash, Receipt as ReceiptIcon, ChevronLeft, ChevronRight,
  Eye, Download, ShoppingCart,
} from 'lucide-react';
import { formatCents } from '@/lib/product-checkout';
import { formatReceiptDate, type Receipt, type ReceiptItem } from '@/lib/receipts';
import { downloadReceiptPdf } from '@/lib/receipt-pdf';
import { ReceiptDetailDialog } from '@/components/receipts/receipt-detail-dialog';

const DOWNLOAD_TYPE_LABEL: Record<string, string> = {
  'wiring-diagram': 'Wiring Diagram',
  'raster-slice': 'Raster Slice',
  'composite-wiring-diagram': 'Composite Wiring',
  'project-file': 'Project File',
};

interface Snapshot {
  id: string;
  user_id: string | null;
  session_id: string;
  screen_name: string;
  grid_width: number;
  grid_height: number;
  thumbnail?: string;
  download_type: string;
  filename: string;
  ip_address: string;
  created_at: string;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  is_admin: boolean | null;
  created_at: string;
}

interface LedProduct {
  id: string;
  manufacturer: string;
  product_name: string;
  tile_width_px: number;
  tile_height_px: number;
  watts_per_tile: number;
  created_at: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  is_read: boolean | null;
}

interface AdminReceiptRow {
  id: string;
  user_id: string;
  receipt_number: string;
  status: string;
  customer_email: string | null;
  items: ReceiptItem[];
  product_fee_cents: number;
  processing_fee_cents: number;
  total_cents: number;
  currency: string;
  paid_at: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

type TabKey = 'users' | 'products' | 'tracking' | 'messages' | 'purchases';

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Pagination({
  page,
  pageCount,
  totalItems,
  label,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  totalItems: number;
  label: string;
  onPageChange: (page: number) => void;
}) {
  if (totalItems === 0) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalItems);
  return (
    <div className="flex items-center justify-between gap-4 pt-3 px-1">
      <p className="text-xs text-muted-foreground">
        Showing {from}–{to} of {totalItems} {label}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="h-3.5 w-3.5" />Previous
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">Page {page} of {pageCount}</span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
          Next<ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function TrackingPageInner() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'users';

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [products, setProducts] = useState<LedProduct[]>([]);
  const [receipts, setReceipts] = useState<AdminReceiptRow[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [trackingSearch, setTrackingSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [receiptSearch, setReceiptSearch] = useState('');

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [viewReceipt, setViewReceipt] = useState<AdminReceiptRow | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [page, setPage] = useState<Record<TabKey, number>>({
    users: 1, products: 1, tracking: 1, messages: 1, purchases: 1,
  });
  const setPageFor = (key: TabKey, value: number) => setPage(prev => ({ ...prev, [key]: value }));

  const fetchData = useCallback(async () => {
    setFetching(true);
    setFetchError(null);
    const [snapRes, userRes, prodRes, msgRes, recRes] = await Promise.all([
      supabase.from('pixel_map_snapshots').select('id, user_id, session_id, screen_name, grid_width, grid_height, download_type, filename, ip_address, created_at').not('user_id', 'is', null).order('created_at', { ascending: false }).limit(500),
      supabase.from('users').select('id, email, full_name, company, is_admin, created_at').order('created_at', { ascending: false }),
      supabase.from('led_products').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('receipts').select('id, user_id, receipt_number, status, customer_email, items, product_fee_cents, processing_fee_cents, total_cents, currency, paid_at, created_at').order('created_at', { ascending: false }),
    ]);
    const firstError = snapRes.error ?? userRes.error ?? prodRes.error ?? msgRes.error ?? recRes.error;
    if (firstError) setFetchError(firstError.message);
    const snapshotRows = snapRes.data ?? [];
    setSnapshots(snapshotRows);
    setUsers(userRes.data ?? []);
    setProducts(prodRes.data ?? []);
    setMessages(msgRes.data ?? []);
    setReceipts((recRes.data ?? []) as AdminReceiptRow[]);

    if (!snapRes.error && snapshotRows.length > 0) {
      const previewIds = snapshotRows.slice(0, 15).map(snapshot => snapshot.id);
      const { data: previews, error: previewError } = await supabase
        .from('pixel_map_snapshots')
        .select('id, thumbnail')
        .in('id', previewIds);
      if (previewError) {
        setFetchError(previewError.message);
      } else if (previews) {
        const previewMap = new Map(previews.map(preview => [preview.id, preview.thumbnail]));
        setSnapshots(current => current.map(snapshot => ({
          ...snapshot,
          thumbnail: previewMap.get(snapshot.id),
        })));
      }
    }
    setFetching(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) { router.replace('/'); return; }
    fetchData();
  }, [user, isAdmin, loading, router, fetchData]);

  const userMap = new Map<string, UserRow>(users.map(u => [u.id, u]));

  const deliverableSnapshots = snapshots.filter(s => s.download_type && s.download_type !== 'grid-png' && s.download_type !== '');
  const allSnapshots = snapshots;

  const filteredUsers = users.filter(u =>
    !userSearch || u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.company?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    !productSearch || p.manufacturer?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.product_name?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredTracking = allSnapshots.filter(s =>
    !trackingSearch || s.screen_name?.toLowerCase().includes(trackingSearch.toLowerCase()) ||
    s.ip_address?.toLowerCase().includes(trackingSearch.toLowerCase()) ||
    s.session_id?.toLowerCase().includes(trackingSearch.toLowerCase())
  );

  const filteredMessages = messages.filter(m =>
    !messageSearch || m.name?.toLowerCase().includes(messageSearch.toLowerCase()) ||
    m.email?.toLowerCase().includes(messageSearch.toLowerCase()) ||
    m.message?.toLowerCase().includes(messageSearch.toLowerCase())
  );

  const filteredReceipts = receipts.filter(r => {
    if (!receiptSearch) return true;
    const buyer = userMap.get(r.user_id);
    const buyerEmail = buyer?.email ?? r.customer_email ?? '';
    const buyerName = buyer?.full_name ?? '';
    const haystack = `${r.receipt_number} ${buyerEmail} ${buyerName}`.toLowerCase();
    return haystack.includes(receiptSearch.toLowerCase()) ||
      r.items?.some(item => `${item.manufacturer} ${item.product_name}`.toLowerCase().includes(receiptSearch.toLowerCase()));
  });

  const paidReceipts = filteredReceipts.filter(r => r.status === 'paid');
  const unreadMessageCount = messages.filter(m => !m.is_read).length;

  const markMessageRead = async (msg: ContactMessage) => {
    if (msg.is_read) return;
    await supabase.from('contact_messages').update({ is_read: true }).eq('id', msg.id);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
    setSelectedMessage(prev => prev?.id === msg.id ? { ...prev, is_read: true } : prev);
  };

  const deleteMessage = async (id: string) => {
    await supabase.from('contact_messages').delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
    setSelectedMessage(null);
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('led_products').delete().eq('id', id);
    fetchData();
  };

  const handleDownloadReceipt = async (receipt: Receipt) => {
    setDownloadingId(receipt.id);
    setDownloadError(null);
    try {
      await downloadReceiptPdf(receipt);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Could not download the receipt.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-14 z-30">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-base">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={fetching} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${fetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {fetchError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Could not load some admin data: {fetchError}
          </div>
        )}
        {downloadError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {downloadError}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Registered Users" value={users.length} color="bg-green-500/10 text-green-500" />
          <StatCard icon={Package} label="LED Products" value={products.length} color="bg-orange-500/10 text-orange-500" />
          <StatCard icon={Monitor} label="All Tracked Events" value={allSnapshots.length} color="bg-blue-500/10 text-blue-500" />
          <StatCard icon={Mail} label="Contact Messages" value={messages.length} color="bg-purple-500/10 text-purple-500" />
        </div>

        <Tabs defaultValue={tab} onValueChange={(v) => router.push(`?tab=${v}`)}>
          <TabsList className="mb-4">
            <TabsTrigger value="users" className="gap-1.5"><Users className="h-3.5 w-3.5" />Users</TabsTrigger>
            <TabsTrigger value="products" className="gap-1.5"><Package className="h-3.5 w-3.5" />LED Products</TabsTrigger>
            <TabsTrigger value="tracking" className="gap-1.5"><Activity className="h-3.5 w-3.5" />Visitor Tracking</TabsTrigger>
            <TabsTrigger value="messages" className="gap-1.5">
              <Mail className="h-3.5 w-3.5" />Messages
              {unreadMessageCount > 0 && <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">{unreadMessageCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="purchases" className="gap-1.5"><ReceiptIcon className="h-3.5 w-3.5" />Purchases</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search users..." value={userSearch} onChange={e => { setUserSearch(e.target.value); setPageFor('users', 1); }} className="pl-9 h-9" />
              </div>
              <span className="text-sm text-muted-foreground">{filteredUsers.length} users</span>
            </div>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Maps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredUsers.slice((page.users - 1) * PAGE_SIZE, page.users * PAGE_SIZE).map(u => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                      <td className="px-4 py-3">{u.full_name ?? <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3">{u.company ?? <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3">
                        {u.is_admin ? (
                          <Badge variant="default" className="gap-1"><Shield className="h-3 w-3" />Admin</Badge>
                        ) : (
                          <Badge variant="secondary"><User className="h-3 w-3 mr-1" />User</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{deliverableSnapshots.filter(s => s.user_id === u.id).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">No users found</div>
              )}
            </div>
            <Pagination
              page={page.users}
              pageCount={Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))}
              totalItems={filteredUsers.length}
              label="users"
              onPageChange={p => setPageFor('users', p)}
            />
          </TabsContent>

          {/* LED Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search products..." value={productSearch} onChange={e => { setProductSearch(e.target.value); setPageFor('products', 1); }} className="pl-9 h-9" />
              </div>
              <Button size="sm" asChild className="gap-1.5 ml-auto">
                <Link href="/admin/add-led">
                  <Plus className="h-3.5 w-3.5" />Add Product
                </Link>
              </Button>
            </div>

            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Manufacturer</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Resolution</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Watts</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredProducts.slice((page.products - 1) * PAGE_SIZE, page.products * PAGE_SIZE).map(p => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{p.manufacturer}</td>
                      <td className="px-4 py-3">{p.product_name}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.tile_width_px}×{p.tile_height_px}px</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.watts_per_tile}W</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
                            <Link href={`/admin/products/${p.id}/edit`} aria-label="Edit product">
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteProduct(p.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">No products found</div>
              )}
            </div>
            <Pagination
              page={page.products}
              pageCount={Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))}
              totalItems={filteredProducts.length}
              label="products"
              onPageChange={p => setPageFor('products', p)}
            />
          </TabsContent>

          {/* Visitor Tracking Tab */}
          <TabsContent value="tracking" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search by name, IP, session..." value={trackingSearch} onChange={e => { setTrackingSearch(e.target.value); setPageFor('tracking', 1); }} className="pl-9 h-9" />
              </div>
              <span className="text-sm text-muted-foreground">{filteredTracking.length} events</span>
            </div>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Screen</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">IP</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredTracking.slice((page.tracking - 1) * PAGE_SIZE, page.tracking * PAGE_SIZE).map(s => {
                    const u = s.user_id ? userMap.get(s.user_id) : null;
                    return (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString()} {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{DOWNLOAD_TYPE_LABEL[s.download_type] ?? (s.download_type || 'Visit')}</Badge>
                        </td>
                        <td className="px-4 py-3 font-medium max-w-[200px] truncate">{s.screen_name || s.filename || '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {u ? (
                            <div>
                              <p>{u.full_name ?? u.email}</p>
                              {u.full_name && <p className="text-[11px]">{u.email}</p>}
                            </div>
                          ) : (
                            s.user_id ? s.user_id.slice(0, 8) : 'Guest'
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.ip_address || '—'}</td>
                        <td className="px-4 py-3">
                          {s.thumbnail ? (
                            <img src={s.thumbnail} alt="" className="h-10 w-16 object-contain bg-white rounded border" />
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredTracking.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">No tracking events found</div>
              )}
            </div>
            <Pagination
              page={page.tracking}
              pageCount={Math.max(1, Math.ceil(filteredTracking.length / PAGE_SIZE))}
              totalItems={filteredTracking.length}
              label="events"
              onPageChange={p => setPageFor('tracking', p)}
            />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search messages..." value={messageSearch} onChange={e => { setMessageSearch(e.target.value); setPageFor('messages', 1); }} className="pl-9 h-9" />
              </div>
              <span className="text-sm text-muted-foreground">{filteredMessages.length} messages</span>
            </div>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Message</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredMessages.slice((page.messages - 1) * PAGE_SIZE, page.messages * PAGE_SIZE).map(m => (
                    <tr key={m.id} className={`hover:bg-muted/30 transition-colors cursor-pointer ${!m.is_read ? 'font-medium' : ''}`} onClick={() => { setSelectedMessage(m); markMessageRead(m); }}>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(m.created_at).toLocaleDateString()} {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 flex items-center gap-1.5">
                        {!m.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        {m.name}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{m.email}</td>
                      <td className="px-4 py-3 max-w-[300px] truncate text-muted-foreground">{m.message}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedMessage(m); markMessageRead(m); }} className="h-7 w-7 p-0">
                            <MailOpen className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteMessage(m.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMessages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>No messages found</p>
                </div>
              )}
            </div>
            <Pagination
              page={page.messages}
              pageCount={Math.max(1, Math.ceil(filteredMessages.length / PAGE_SIZE))}
              totalItems={filteredMessages.length}
              label="messages"
              onPageChange={p => setPageFor('messages', p)}
            />
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search by buyer, receipt no., product..." value={receiptSearch} onChange={e => { setReceiptSearch(e.target.value); setPageFor('purchases', 1); }} className="pl-9 h-9" />
              </div>
              <span className="text-sm text-muted-foreground">
                {filteredReceipts.length} receipts · {paidReceipts.length} paid · {formatCents(paidReceipts.reduce((sum, r) => sum + r.total_cents, 0))} collected
              </span>
            </div>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Buyer</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Products</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Receipt No.</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredReceipts.slice((page.purchases - 1) * PAGE_SIZE, page.purchases * PAGE_SIZE).map(r => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatReceiptDate(r.paid_at ?? r.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{userMap.get(r.user_id)?.full_name ?? r.customer_email ?? '—'}</p>
                        <p className="text-[11px] text-muted-foreground">{userMap.get(r.user_id)?.email ?? r.customer_email ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[220px] truncate text-muted-foreground">
                        {r.items?.length ? r.items.map(item => item.product_name).join(', ') : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{r.receipt_number}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 capitalize ${r.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatCents(r.total_cents)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewReceipt(r)} className="h-7 w-7 p-0" aria-label="View receipt">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {r.status === 'paid' && (
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadReceipt(r)} disabled={downloadingId === r.id} className="h-7 w-7 p-0" aria-label="Download receipt PDF">
                              {downloadingId === r.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Download className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredReceipts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>No purchases found</p>
                </div>
              )}
            </div>
            <Pagination
              page={page.purchases}
              pageCount={Math.max(1, Math.ceil(filteredReceipts.length / PAGE_SIZE))}
              totalItems={filteredReceipts.length}
              label="receipts"
              onPageChange={p => setPageFor('purchases', p)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Message detail modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedMessage(null)}>
          <div className="bg-card border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h2 className="font-bold text-base">{selectedMessage.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedMessage.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMessage(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground mb-3">{new Date(selectedMessage.created_at).toLocaleString()}</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedMessage.message}</p>
            </div>
            <div className="px-5 py-3 border-t flex items-center justify-between">
              <a href={`mailto:${selectedMessage.email}?subject=Re: Your message to MapMyLED`}>
                <Button size="sm" className="gap-1.5"><Mail className="h-3.5 w-3.5" />Reply</Button>
              </a>
              <Button variant="ghost" size="sm" onClick={() => deleteMessage(selectedMessage.id)} className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash className="h-3.5 w-3.5" />Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <ReceiptDetailDialog
        receipt={viewReceipt}
        downloading={viewReceipt !== null && downloadingId === viewReceipt.id}
        onOpenChange={open => { if (!open) setViewReceipt(null); }}
        onDownload={handleDownloadReceipt}
      />
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <TrackingPageInner />
    </Suspense>
  );
}