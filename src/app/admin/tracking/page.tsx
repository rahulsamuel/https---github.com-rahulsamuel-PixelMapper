'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, Download, Users, Monitor, Search, RefreshCw,
  Shield, User, Calendar, Package, Activity,
  Pencil, Trash2, Plus, X, Check, Workflow, MapIcon, Layers,
} from 'lucide-react';

const DOWNLOAD_TYPE_ICON: Record<string, React.ElementType> = {
  'wiring-diagram': Workflow,
  'full-raster-map': MapIcon,
  'raster-slice': Layers,
  'composite-wiring-diagram': Workflow,
  'project-file': Package,
};

const DOWNLOAD_TYPE_LABEL: Record<string, string> = {
  'wiring-diagram': 'Wiring Diagram',
  'full-raster-map': 'Raster Map',
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
  thumbnail: string;
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
            <Badge variant="secondary" className="text-xs">Guest</Badge>
          ) : (
            <Badge variant="default" className="text-xs">User</Badge>
          )}
          {snapshot.download_type && (
            <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
              {DOWNLOAD_TYPE_LABEL[snapshot.download_type] ?? snapshot.download_type}
            </Badge>
          )}
        </div>
      </div>
      <div className="p-3 space-y-1">
        <p className="font-medium text-sm truncate">{snapshot.screen_name || snapshot.filename || 'Unnamed'}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">{userRow?.email ?? (isGuest ? 'Guest' : snapshot.session_id.slice(0, 8))}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 shrink-0" />
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
  const tab = searchParams.get('tab') ?? 'maps';

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [products, setProducts] = useState<LedProduct[]>([]);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [trackingSearch, setTrackingSearch] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);

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

  const userMap = new Map<string, UserRow>(users.map(u => [u.id, u]));

  const deliverableSnapshots = snapshots.filter(s => s.download_type && s.download_type !== 'grid-png' && s.download_type !== '');
  const allSnapshots = snapshots;

  const handleDownload = (snapshot: Snapshot) => {
    if (!snapshot.thumbnail) return;
    const link = document.createElement('a');
    link.href = snapshot.thumbnail;
    link.download = snapshot.filename || snapshot.screen_name || 'download';
    link.click();
  };

  const filteredMaps = deliverableSnapshots.filter(s =>
    !search || s.screen_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.filename?.toLowerCase().includes(search.toLowerCase()) ||
    userMap.get(s.user_id ?? '')?.email?.toLowerCase().includes(search.toLowerCase())
  );

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

  const openEditProduct = (p: LedProduct) => {
    setEditingProduct(p);
    setProductForm({
      manufacturer: p.manufacturer,
      product_name: p.product_name,
      tile_width_px: String(p.tile_width_px),
      tile_height_px: String(p.tile_height_px),
      watts_per_tile: String(p.watts_per_tile),
    });
    setShowAddProduct(true);
    setProductError('');
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm(emptyForm);
    setShowAddProduct(true);
    setProductError('');
  };

  const saveProduct = async () => {
    setProductError('');
    const { manufacturer, product_name, tile_width_px, tile_height_px, watts_per_tile } = productForm;
    if (!manufacturer.trim() || !product_name.trim() || !tile_width_px || !tile_height_px || !watts_per_tile) {
      setProductError('All fields are required.');
      return;
    }
    setSavingProduct(true);
    const payload = {
      manufacturer: manufacturer.trim(),
      product_name: product_name.trim(),
      tile_width_px: Number(tile_width_px),
      tile_height_px: Number(tile_height_px),
      watts_per_tile: Number(watts_per_tile),
    };
    if (editingProduct) {
      await supabase.from('led_products').update(payload).eq('id', editingProduct.id);
    } else {
      await supabase.from('led_products').insert({ ...payload, created_by: user?.id });
    }
    setSavingProduct(false);
    setShowAddProduct(false);
    fetchData();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('led_products').delete().eq('id', id);
    fetchData();
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
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Activity} label="Total Downloads" value={deliverableSnapshots.length} color="bg-primary/10 text-primary" />
          <StatCard icon={Users} label="Registered Users" value={users.length} color="bg-green-500/10 text-green-500" />
          <StatCard icon={Package} label="LED Products" value={products.length} color="bg-orange-500/10 text-orange-500" />
          <StatCard icon={Monitor} label="All Tracked Events" value={allSnapshots.length} color="bg-blue-500/10 text-blue-500" />
        </div>

        <Tabs defaultValue={tab} onValueChange={(v) => router.push(`?tab=${v}`)}>
          <TabsList className="mb-4">
            <TabsTrigger value="maps" className="gap-1.5"><Monitor className="h-3.5 w-3.5" />Pixel Maps</TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5"><Users className="h-3.5 w-3.5" />Users</TabsTrigger>
            <TabsTrigger value="products" className="gap-1.5"><Package className="h-3.5 w-3.5" />LED Products</TabsTrigger>
            <TabsTrigger value="tracking" className="gap-1.5"><Activity className="h-3.5 w-3.5" />Visitor Tracking</TabsTrigger>
          </TabsList>

          {/* Pixel Maps Tab */}
          <TabsContent value="maps" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search maps..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
              <span className="text-sm text-muted-foreground">{filteredMaps.length} maps</span>
            </div>
            {filteredMaps.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Monitor className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No pixel maps found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredMaps.map(s => (
                  <SnapshotCard key={s.id} snapshot={s} userMap={userMap} onClick={() => setSelectedSnapshot(s)} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-9 h-9" />
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
                  {filteredUsers.map(u => (
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
          </TabsContent>

          {/* LED Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-9 h-9" />
              </div>
              <Button size="sm" onClick={openNewProduct} className="gap-1.5 ml-auto">
                <Plus className="h-3.5 w-3.5" />Add Product
              </Button>
            </div>

            {showAddProduct && (
              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{editingProduct ? 'Edit Product' : 'New Product'}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setShowAddProduct(false)}><X className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Manufacturer</Label>
                      <Input value={productForm.manufacturer} onChange={e => setProductForm(f => ({ ...f, manufacturer: e.target.value }))} placeholder="e.g. ROE Visual" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Product Name</Label>
                      <Input value={productForm.product_name} onChange={e => setProductForm(f => ({ ...f, product_name: e.target.value }))} placeholder="e.g. CB5" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tile Width (px)</Label>
                      <Input type="number" value={productForm.tile_width_px} onChange={e => setProductForm(f => ({ ...f, tile_width_px: e.target.value }))} placeholder="e.g. 500" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tile Height (px)</Label>
                      <Input type="number" value={productForm.tile_height_px} onChange={e => setProductForm(f => ({ ...f, tile_height_px: e.target.value }))} placeholder="e.g. 500" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Watts per Tile</Label>
                      <Input type="number" value={productForm.watts_per_tile} onChange={e => setProductForm(f => ({ ...f, watts_per_tile: e.target.value }))} placeholder="e.g. 120" />
                    </div>
                  </div>
                  {productError && <p className="text-sm text-destructive">{productError}</p>}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={saveProduct} disabled={savingProduct} className="gap-1.5">
                      {savingProduct ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      {editingProduct ? 'Update' : 'Add'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowAddProduct(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

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
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{p.manufacturer}</td>
                      <td className="px-4 py-3">{p.product_name}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.tile_width_px}×{p.tile_height_px}px</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.watts_per_tile}W</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditProduct(p)} className="h-7 w-7 p-0">
                            <Pencil className="h-3.5 w-3.5" />
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
          </TabsContent>

          {/* Visitor Tracking Tab */}
          <TabsContent value="tracking" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search by name, IP, session..." value={trackingSearch} onChange={e => setTrackingSearch(e.target.value)} className="pl-9 h-9" />
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
                  {filteredTracking.map(s => {
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
                        <td className="px-4 py-3 text-xs text-muted-foreground">{u?.email ?? (s.user_id ? s.user_id.slice(0, 8) : 'Guest')}</td>
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Snapshot detail modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedSnapshot(null)}>
          <div className="bg-card border rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h2 className="font-bold text-base">{selectedSnapshot.screen_name || selectedSnapshot.filename}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(selectedSnapshot.created_at).toLocaleString()} · {userMap.get(selectedSnapshot.user_id ?? '')?.email ?? 'Guest'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedSnapshot.thumbnail && (
                  <Button size="sm" onClick={() => handleDownload(selectedSnapshot)} className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />Download
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setSelectedSnapshot(null)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
            {selectedSnapshot.thumbnail ? (
              <div className="bg-black flex items-center justify-center" style={{ maxHeight: '60vh' }}>
                <img src={selectedSnapshot.thumbnail} alt={selectedSnapshot.screen_name} className="max-w-full max-h-[60vh] object-contain" />
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground bg-muted">No preview available</div>
            )}
            <div className="px-5 py-3 flex items-center gap-4 text-xs text-muted-foreground border-t">
              <span>Grid: {selectedSnapshot.grid_width}×{selectedSnapshot.grid_height}</span>
              <span>Type: {DOWNLOAD_TYPE_LABEL[selectedSnapshot.download_type] ?? selectedSnapshot.download_type}</span>
              <span>IP: {selectedSnapshot.ip_address || '—'}</span>
            </div>
          </div>
        </div>
      )}
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
