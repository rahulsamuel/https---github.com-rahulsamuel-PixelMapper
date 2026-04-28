'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Loader2, Download, Users, Monitor, Search, RefreshCw,
  Shield, User, Calendar, Grid3x3, Package, Activity,
  Pencil, Trash2, Plus, X, Check, Workflow, Map, Layers,
} from 'lucide-react';

interface Snapshot {
  id: string;
  user_id: string | null;
  session_id: string;
  screen_name: string;
  grid_width: number;
  grid_height: number;
  thumbnail: string;
  project_data: unknown;
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
  is_admin: boolean;
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

const DOWNLOAD_TYPE_LABELS: Record<string, string> = {
  'wiring-diagram': 'Wiring Diagram',
  'composite-wiring-diagram': 'Composite Wiring',
  'full-raster-map': 'Full Raster Map',
  'raster-slice': 'Raster Slice',
  'project-file': 'Project File',
};

const DOWNLOAD_TYPE_ICON: Record<string, React.ElementType> = {
  'wiring-diagram': Workflow,
  'composite-wiring-diagram': Workflow,
  'full-raster-map': Map,
  'raster-slice': Layers,
  'project-file': Package,
};

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SnapshotCard({
  snapshot,
  userMap,
  onClick,
}: {
  snapshot: Snapshot;
  userMap: Map<string, UserRow>;
  onClick: () => void;
}) {
  const userRow = snapshot.user_id ? userMap.get(snapshot.user_id) : null;
  const isGuest = !snapshot.user_id;
  const date = new Date(snapshot.created_at);
  const TypeIcon = DOWNLOAD_TYPE_ICON[snapshot.download_type] ?? Monitor;

  return (
    <div
      className="group border rounded-xl overflow-hidden bg-card hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-black/20"
      onClick={onClick}
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {snapshot.thumbnail ? (
          <img src={snapshot.thumbnail} alt={snapshot.screen_name} className="w-full h-full object-contain bg-white" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <TypeIcon className="h-8 w-8 opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <Download className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isGuest ? (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Guest</Badge>
          ) : userRow?.is_admin ? (
            <Badge className="text-[10px] px-1.5 py-0 h-4 gap-0.5 bg-amber-500 hover:bg-amber-500">
              <Shield className="h-2.5 w-2.5" /> Admin
            </Badge>
          ) : (
            <Badge className="text-[10px] px-1.5 py-0 h-4">User</Badge>
          )}
        </div>
      </div>
      <div className="p-3 space-y-1">
        <p className="font-semibold text-sm truncate">{snapshot.screen_name || snapshot.filename || 'Untitled'}</p>
        {userRow && (
          <p className="text-[11px] text-primary truncate">{userRow.email}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <TypeIcon className="h-3 w-3" />
            {DOWNLOAD_TYPE_LABELS[snapshot.download_type] ?? snapshot.download_type}
          </span>
          <span>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}

interface ProductFormData {
  manufacturer: string;
  product_name: string;
  tile_width_px: string;
  tile_height_px: string;
  watts_per_tile: string;
}

const emptyForm: ProductFormData = {
  manufacturer: '',
  product_name: '',
  tile_width_px: '',
  tile_height_px: '',
  watts_per_tile: '',
};

function TrackingPageInner() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const validTabs = ['pixel-maps', 'users', 'tracking', 'products'];
  const defaultTab = validTabs.includes(tabParam ?? '') ? tabParam! : 'pixel-maps';

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [products, setProducts] = useState<LedProduct[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [trackingSearch, setTrackingSearch] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);

  // LED product form state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LedProduct | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>(emptyForm);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState('');

  const fetchData = useCallback(async () => {
    setFetching(true);
    const [snapRes, userRes, prodRes] = await Promise.all([
      supabase.from('pixel_map_snapshots').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('users').select('id, email, full_name, company, is_admin, created_at').order('created_at', { ascending: false }),
      supabase.from('led_products').select('*').order('created_at', { ascending: false }),
    ]);
    setSnapshots(snapRes.data ?? []);
    setUsers(userRes.data ?? []);
    setProducts(prodRes.data ?? []);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) { router.replace('/'); return; }
    fetchData();
  }, [user, isAdmin, loading, router, fetchData]);

  // Build userId → UserRow lookup
  const userMap = new Map<string, UserRow>(users.map(u => [u.id, u]));

  // Pixel maps tab: only non-grid-png downloads (the tracked deliverables)
  const deliverableSnapshots = snapshots.filter(s => s.download_type && s.download_type !== 'grid-png' && s.download_type !== '');
  // Visitor tracking: all records
  const allSnapshots = snapshots;

  const handleDownload = (snapshot: Snapshot) => {
    if (!snapshot.thumbnail) return;
    const link = document.createElement('a');
    link.href = snapshot.thumbnail;
    link.download = snapshot.filename || `${snapshot.screen_name || 'download'}-${snapshot.id.slice(0, 8)}.png`;
    link.click();
  };

  const clearSnapshots = async (ids: string[]) => {
    if (ids.length === 0) return;
    await supabase.from('pixel_map_snapshots').delete().in('id', ids);
    await fetchData();
  };

  // LED product helpers
  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm(emptyForm);
    setProductError('');
    setShowAddProduct(true);
  };

  const openEditProduct = (p: LedProduct) => {
    setEditingProduct(p);
    setProductForm({
      manufacturer: p.manufacturer,
      product_name: p.product_name,
      tile_width_px: String(p.tile_width_px),
      tile_height_px: String(p.tile_height_px),
      watts_per_tile: String(p.watts_per_tile),
    });
    setProductError('');
    setShowAddProduct(true);
  };

  const closeProductForm = () => {
    setShowAddProduct(false);
    setEditingProduct(null);
    setProductForm(emptyForm);
    setProductError('');
  };

  const saveProduct = async () => {
    const { manufacturer, product_name, tile_width_px, tile_height_px, watts_per_tile } = productForm;
    if (!manufacturer.trim() || !product_name.trim() || !tile_width_px || !tile_height_px || !watts_per_tile) {
      setProductError('All fields are required.');
      return;
    }
    setSavingProduct(true);
    setProductError('');
    try {
      if (editingProduct) {
        const { error } = await supabase.from('led_products').update({
          manufacturer: manufacturer.toUpperCase(),
          product_name: product_name.toUpperCase(),
          tile_width_px: Number(tile_width_px),
          tile_height_px: Number(tile_height_px),
          watts_per_tile: Number(watts_per_tile),
        }).eq('id', editingProduct.id);
        if (error) { setProductError(error.message); return; }
      } else {
        const { error } = await supabase.from('led_products').insert({
          manufacturer: manufacturer.toUpperCase(),
          product_name: product_name.toUpperCase(),
          tile_width_px: Number(tile_width_px),
          tile_height_px: Number(tile_height_px),
          watts_per_tile: Number(watts_per_tile),
          created_by: user!.id,
        });
        if (error) { setProductError(error.message); return; }
      }
      closeProductForm();
      await fetchData();
    } finally {
      setSavingProduct(false);
    }
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('led_products').delete().eq('id', id);
    await fetchData();
  };

  // Filtered lists
  const filteredDeliverables = deliverableSnapshots.filter(s =>
    !search ||
    (s.screen_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (s.filename ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (s.session_id ?? '').includes(search) ||
    (s.user_id ?? '').includes(search)
  );

  const filteredUsers = users.filter(u =>
    !userSearch ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.full_name ?? '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.company ?? '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredTracking = allSnapshots.filter(s =>
    !trackingSearch ||
    (s.screen_name ?? '').toLowerCase().includes(trackingSearch.toLowerCase()) ||
    (s.session_id ?? '').includes(trackingSearch) ||
    (s.ip_address ?? '').includes(trackingSearch)
  );

  const filteredProducts = products.filter(p =>
    !productSearch ||
    p.manufacturer.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.product_name.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (loading || (user && isAdmin && fetching)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin) return null;

  const guestCount = allSnapshots.filter(s => !s.user_id).length;
  const userMapCount = allSnapshots.filter(s => !!s.user_id).length;

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your application data</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={fetching}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${fetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Downloads" value={allSnapshots.length} icon={Monitor} />
        <StatCard label="Guest Downloads" value={guestCount} icon={User} />
        <StatCard label="User Downloads" value={userMapCount} icon={Package} />
        <StatCard label="Registered Users" value={users.length} icon={Users} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="pixel-maps" className="gap-1.5">
            <Monitor className="h-3.5 w-3.5" />
            Downloads
            {deliverableSnapshots.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 h-4 ml-0.5">{deliverableSnapshots.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            User Management
            {users.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 h-4 ml-0.5">{users.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tracking" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Visitor Tracking
            {allSnapshots.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 h-4 ml-0.5">{allSnapshots.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5">
            <Package className="h-3.5 w-3.5" />
            LED Products
            {products.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 h-4 ml-0.5">{products.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Downloads (Pixel Maps / Wiring / Raster / Deliverables) ── */}
        <TabsContent value="pixel-maps" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, session or user ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <span className="text-sm text-muted-foreground">{filteredDeliverables.length} downloads</span>
            {deliverableSnapshots.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto">
                    <Trash2 className="h-3.5 w-3.5" /> Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all downloads?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {deliverableSnapshots.length} tracked download records. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => clearSnapshots(deliverableSnapshots.map(s => s.id))}>
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          {filteredDeliverables.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center text-muted-foreground">
                <Monitor className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No downloads tracked yet</p>
                <p className="text-sm mt-1 max-w-xs mx-auto">Downloads are recorded automatically when users export wiring diagrams, raster maps, and other deliverables.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredDeliverables.map(s => (
                <SnapshotCard
                  key={s.id}
                  snapshot={s}
                  userMap={userMap}
                  onClick={() => setSelectedSnapshot(s)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── User Management ── */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by email, name or company…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <span className="text-sm text-muted-foreground">{filteredUsers.length} users</span>
          </div>
          <Card>
            <CardContent className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No registered users yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Downloads</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => {
                      const dlCount = allSnapshots.filter(s => s.user_id === u.id).length;
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{u.full_name || '—'}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{u.company || '—'}</TableCell>
                          <TableCell>
                            {u.is_admin ? (
                              <Badge className="gap-1 text-xs h-5 bg-amber-500 hover:bg-amber-500">
                                <Shield className="h-2.5 w-2.5" /> Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs h-5">User</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(u.created_at).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm font-medium">{dlCount}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Visitor Tracking ── */}
        <TabsContent value="tracking" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, session or IP…"
                value={trackingSearch}
                onChange={e => setTrackingSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <span className="text-sm text-muted-foreground">{filteredTracking.length} events</span>
            {allSnapshots.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto">
                    <Trash2 className="h-3.5 w-3.5" /> Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all tracking records?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {allSnapshots.length} visitor tracking records. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => clearSnapshots(allSnapshots.map(s => s.id))}>
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <Card>
            <CardContent className="p-0">
              {filteredTracking.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                  <Activity className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No visitor activity recorded yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name / File</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTracking.slice(0, 200).map(s => {
                      const userRow = s.user_id ? userMap.get(s.user_id) : null;
                      return (
                        <TableRow
                          key={s.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedSnapshot(s)}
                        >
                          <TableCell className="font-medium text-sm max-w-[140px] truncate">
                            {s.screen_name || s.filename || 'Untitled'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] h-4 whitespace-nowrap">
                              {DOWNLOAD_TYPE_LABELS[s.download_type] ?? s.download_type || '—'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {userRow ? (
                              <div>
                                <span className="flex items-center gap-1 text-xs">
                                  {userRow.is_admin && <Shield className="h-2.5 w-2.5 text-amber-500" />}
                                  <span className="font-medium truncate max-w-[120px]">{userRow.email}</span>
                                </span>
                              </div>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] h-4">Guest</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {s.session_id?.slice(0, 10) || '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {s.ip_address || '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(s.created_at).toLocaleDateString()} {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell>
                            {s.thumbnail ? (
                              <div className="w-12 h-8 rounded overflow-hidden border bg-white shrink-0">
                                <img src={s.thumbnail} alt="" className="w-full h-full object-contain" />
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LED Products ── */}
        <TabsContent value="products" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search manufacturer or product name…"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <span className="text-sm text-muted-foreground">{filteredProducts.length} products</span>
            <Button size="sm" className="gap-1.5 ml-auto" onClick={openAddProduct}>
              <Plus className="h-3.5 w-3.5" /> Add Product
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {filteredProducts.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No LED products yet</p>
                  <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={openAddProduct}>
                    <Plus className="h-3.5 w-3.5" /> Add your first product
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Dimensions (px)</TableHead>
                      <TableHead>Watts/Tile</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-sm">{p.manufacturer}</TableCell>
                        <TableCell className="text-sm">{p.product_name}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {p.tile_width_px}×{p.tile_height_px}
                        </TableCell>
                        <TableCell className="text-sm">{p.watts_per_tile}W</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditProduct(p)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete product?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete <strong>{p.manufacturer} {p.product_name}</strong> from the database.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteProduct(p.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Snapshot detail modal ── */}
      {selectedSnapshot && (
        <Dialog open onOpenChange={() => setSelectedSnapshot(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="truncate">
                {selectedSnapshot.screen_name || selectedSnapshot.filename || 'Download'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedSnapshot.thumbnail ? (
                <div className="border rounded-xl overflow-hidden bg-white">
                  <img src={selectedSnapshot.thumbnail} alt="" className="w-full object-contain max-h-[60vh]" />
                </div>
              ) : (
                <div className="border rounded-xl h-32 flex items-center justify-center text-muted-foreground bg-muted">
                  No thumbnail available
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">Type</p>
                  <p>{DOWNLOAD_TYPE_LABELS[selectedSnapshot.download_type] ?? selectedSnapshot.download_type || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">User</p>
                  {selectedSnapshot.user_id ? (
                    <p className="text-xs">{userMap.get(selectedSnapshot.user_id)?.email ?? selectedSnapshot.user_id}</p>
                  ) : (
                    <p>Guest</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">IP Address</p>
                  <p className="font-mono text-xs">{selectedSnapshot.ip_address || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">Grid Size</p>
                  <p className="font-mono">{selectedSnapshot.grid_width} × {selectedSnapshot.grid_height}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">Captured</p>
                  <p>{new Date(selectedSnapshot.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">Session</p>
                  <p className="font-mono text-xs truncate">{selectedSnapshot.session_id?.slice(0, 16) || '—'}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={() => handleDownload(selectedSnapshot)} className="flex-1 gap-2" disabled={!selectedSnapshot.thumbnail}>
                  <Download className="h-4 w-4" /> Download PNG
                </Button>
                <Button variant="outline" onClick={() => setSelectedSnapshot(null)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Add / Edit product modal ── */}
      <Dialog open={showAddProduct} onOpenChange={v => { if (!v) closeProductForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit LED Product' : 'Add LED Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  placeholder="e.g. ROE VISUAL"
                  value={productForm.manufacturer}
                  onChange={e => setProductForm(f => ({ ...f, manufacturer: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product_name">Product Name</Label>
                <Input
                  id="product_name"
                  placeholder="e.g. CB5"
                  value={productForm.product_name}
                  onChange={e => setProductForm(f => ({ ...f, product_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tile_width_px">Width (px)</Label>
                <Input
                  id="tile_width_px"
                  type="number"
                  placeholder="e.g. 500"
                  value={productForm.tile_width_px}
                  onChange={e => setProductForm(f => ({ ...f, tile_width_px: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tile_height_px">Height (px)</Label>
                <Input
                  id="tile_height_px"
                  type="number"
                  placeholder="e.g. 500"
                  value={productForm.tile_height_px}
                  onChange={e => setProductForm(f => ({ ...f, tile_height_px: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="watts_per_tile">Watts/Tile</Label>
                <Input
                  id="watts_per_tile"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 250"
                  value={productForm.watts_per_tile}
                  onChange={e => setProductForm(f => ({ ...f, watts_per_tile: e.target.value }))}
                />
              </div>
            </div>
            {productError && <p className="text-sm text-destructive">{productError}</p>}
            <div className="flex gap-2 pt-1">
              <Button className="flex-1 gap-1.5" onClick={saveProduct} disabled={savingProduct}>
                {savingProduct ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {editingProduct ? 'Save Changes' : 'Add Product'}
              </Button>
              <Button variant="outline" onClick={closeProductForm} disabled={savingProduct}>
                <X className="h-3.5 w-3.5 mr-1.5" /> Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <TrackingPageInner />
    </Suspense>
  );
}
