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
  Pencil, Trash2, Plus, X, Check,
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

function SnapshotCard({ snapshot, onClick }: { snapshot: Snapshot; onClick: () => void }) {
  const isGuest = !snapshot.user_id;
  const date = new Date(snapshot.created_at);
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
            <Monitor className="h-8 w-8 opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <Download className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
        <div className="absolute top-2 left-2">
          <Badge variant={isGuest ? 'secondary' : 'default'} className="text-[10px] px-1.5 py-0 h-4">
            {isGuest ? 'Guest' : 'User'}
          </Badge>
        </div>
      </div>
      <div className="p-3 space-y-1">
        <p className="font-semibold text-sm truncate">{snapshot.screen_name || 'Untitled'}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Grid3x3 className="h-3 w-3" />
            {snapshot.grid_width}×{snapshot.grid_height}
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
  const validTabs = ['maps', 'users', 'tracking', 'products'];
  const defaultTab = validTabs.includes(tabParam ?? '') ? tabParam! : 'maps';

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [products, setProducts] = useState<LedProduct[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
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
      supabase.from('pixel_map_snapshots').select('*').order('created_at', { ascending: false }).limit(300),
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

  const handleDownload = (snapshot: Snapshot) => {
    if (!snapshot.thumbnail) return;
    const link = document.createElement('a');
    link.href = snapshot.thumbnail;
    link.download = `${snapshot.screen_name || 'pixel-map'}-${snapshot.id.slice(0, 8)}.png`;
    link.click();
  };

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

  const filteredSnapshots = snapshots.filter(s =>
    !search ||
    s.screen_name.toLowerCase().includes(search.toLowerCase()) ||
    s.session_id.includes(search) ||
    (s.user_id ?? '').includes(search)
  );

  const filteredUsers = users.filter(u =>
    !userSearch ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.full_name ?? '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.company ?? '').toLowerCase().includes(userSearch.toLowerCase())
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

  const guestCount = snapshots.filter(s => !s.user_id).length;
  const userMapCount = snapshots.filter(s => !!s.user_id).length;

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
        <StatCard label="Total Maps" value={snapshots.length} icon={Monitor} />
        <StatCard label="Guest Maps" value={guestCount} icon={User} />
        <StatCard label="User Maps" value={userMapCount} icon={Package} />
        <StatCard label="Registered Users" value={users.length} icon={Users} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="maps" className="gap-1.5">
            <Monitor className="h-3.5 w-3.5" />
            Pixel Maps
            {snapshots.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 h-4 ml-0.5">{snapshots.length}</Badge>
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
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5">
            <Package className="h-3.5 w-3.5" />
            LED Products
            {products.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 h-4 ml-0.5">{products.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Pixel Maps ── */}
        <TabsContent value="maps" className="mt-4 space-y-4">
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
            <span className="text-sm text-muted-foreground">{filteredSnapshots.length} maps</span>
          </div>
          {filteredSnapshots.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center text-muted-foreground">
                <Monitor className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No pixel maps captured yet</p>
                <p className="text-sm mt-1 max-w-xs mx-auto">Maps are recorded automatically as visitors build LED grids.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredSnapshots.map(s => (
                <SnapshotCard key={s.id} snapshot={s} onClick={() => setSelectedSnapshot(s)} />
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
                      <TableHead>Maps</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => {
                      const mapCount = snapshots.filter(s => s.user_id === u.id).length;
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
                              <Badge className="gap-1 text-xs h-5"><Shield className="h-2.5 w-2.5" /> Admin</Badge>
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
                            <span className="font-mono text-sm font-medium">{mapCount}</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Sessions</p>
                <p className="text-3xl font-bold">{snapshots.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Guest Sessions</p>
                <p className="text-3xl font-bold">{guestCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Authenticated Sessions</p>
                <p className="text-3xl font-bold">{userMapCount}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-0">
              {snapshots.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                  <Activity className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No visitor activity recorded yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Screen Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Grid</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshots.slice(0, 100).map(s => (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedSnapshot(s)}
                      >
                        <TableCell className="font-medium text-sm">{s.screen_name || 'Untitled'}</TableCell>
                        <TableCell>
                          <Badge variant={s.user_id ? 'default' : 'secondary'} className="text-[10px] h-4">
                            {s.user_id ? 'User' : 'Guest'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {s.grid_width}×{s.grid_height}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {s.session_id?.slice(0, 12) || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString()} {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                      </TableRow>
                    ))}
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditProduct(p)}
                            >
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
              <DialogTitle className="truncate">{selectedSnapshot.screen_name || 'Pixel Map'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border rounded-xl overflow-hidden bg-white">
                {selectedSnapshot.thumbnail ? (
                  <img src={selectedSnapshot.thumbnail} alt={selectedSnapshot.screen_name} className="w-full object-contain max-h-[60vh]" />
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">No thumbnail available</div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">Grid Size</p>
                  <p className="font-mono">{selectedSnapshot.grid_width} × {selectedSnapshot.grid_height} tiles</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">User Type</p>
                  <p>{selectedSnapshot.user_id ? 'Registered' : 'Guest'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">Captured</p>
                  <p>{new Date(selectedSnapshot.created_at).toLocaleString()}</p>
                </div>
                {selectedSnapshot.user_id && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">User ID</p>
                    <p className="font-mono text-xs truncate">{selectedSnapshot.user_id}</p>
                  </div>
                )}
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
