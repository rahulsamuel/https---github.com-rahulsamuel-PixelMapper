'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Search, RefreshCw, MessageSquare, Trash2, Reply, CheckCircle2, Eye, Mail, Megaphone,
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  bug_report: 'Bug Report',
  feature_request: 'Feature Request',
  suggestion: 'Suggestion',
  correction: 'Correction',
  other: 'Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  bug_report: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  feature_request: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  suggestion: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  correction: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  other: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
};

const DOWNLOAD_TYPE_LABELS: Record<string, string> = {
  grid_png: 'Grid PNG',
  wiring_diagram: 'Wiring Diagram',
  composite_wiring: 'Composite Wiring',
  raster_map: 'Raster Map',
  raster_slices: 'Raster Slices',
  wall_layout: 'Wall Layout',
  equipment_csv: 'Equipment List CSV',
  equipment_png: 'Equipment List PNG',
  equipment_pdf: 'Equipment List PDF',
  deliverables_pdf: 'Deliverables PDF',
  deliverables_html: 'Deliverables HTML',
  deliverables_pixel_map: 'Deliverables Pixel Map',
  rack_png: 'Rack Drawing PNG',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  resolved: 'Resolved',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  reviewed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

interface FeedbackItem {
  id: string;
  category: string;
  download_type: string;
  message: string;
  submitter_name: string | null;
  submitter_email: string | null;
  is_anonymous: boolean;
  user_id: string | null;
  status: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
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

export default function FeedbackAdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [responseText, setResponseText] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('download_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (!error && data) {
      setFeedback(data as FeedbackItem[]);
    }
    setFetching(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) { router.replace('/'); return; }
    fetchData();
  }, [user, isAdmin, loading, router, fetchData]);

  const filtered = feedback.filter(f => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return f.message?.toLowerCase().includes(q) ||
      f.submitter_name?.toLowerCase().includes(q) ||
      f.submitter_email?.toLowerCase().includes(q) ||
      f.download_type?.toLowerCase().includes(q) ||
      f.category?.toLowerCase().includes(q);
  });

  const stats = {
    total: feedback.length,
    new: feedback.filter(f => f.status === 'new').length,
    reviewed: feedback.filter(f => f.status === 'reviewed').length,
    resolved: feedback.filter(f => f.status === 'resolved').length,
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('download_feedback').update({ status }).eq('id', id);
    setFeedback(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev);
  };

  const saveResponse = async () => {
    if (!selected) return;
    setSaving(true);
    await supabase.from('download_feedback').update({ admin_response: responseText || null, status: 'reviewed' }).eq('id', selected.id);
    setFeedback(prev => prev.map(f => f.id === selected.id ? { ...f, admin_response: responseText || null, status: 'reviewed' } : f));
    setSelected(prev => prev?.id === selected.id ? { ...prev, admin_response: responseText || null, status: 'reviewed' } : prev);
    setSaving(false);
  };

  const deleteFeedback = async (id: string) => {
    await supabase.from('download_feedback').delete().eq('id', id);
    setFeedback(prev => prev.filter(f => f.id !== id));
    setSelected(null);
  };

  const openDetail = (item: FeedbackItem) => {
    setSelected(item);
    setResponseText(item.admin_response || '');
    if (item.status === 'new') {
      updateStatus(item.id, 'reviewed');
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Download Feedback</h1>
          <p className="text-sm text-muted-foreground">User feedback submitted after downloads</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Megaphone} label="Total" value={stats.total} color="bg-slate-100 dark:bg-slate-800" />
        <StatCard icon={Mail} label="New" value={stats.new} color="bg-blue-100 dark:bg-blue-900/40" />
        <StatCard icon={Eye} label="Reviewed" value={stats.reviewed} color="bg-amber-100 dark:bg-amber-900/40" />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} color="bg-green-100 dark:bg-green-900/40" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Feedback list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No feedback found.
              </CardContent>
            </Card>
          )}
          {filtered.map((item) => (
            <Card
              key={item.id}
              className={`cursor-pointer transition-all hover:shadow-md ${selected?.id === item.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => openDetail(item)}
            >
              <CardContent className="pt-4 pb-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[item.category] ?? 'bg-slate-100'}`}>
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status] ?? ''}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {DOWNLOAD_TYPE_LABELS[item.download_type] ?? item.download_type}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-foreground line-clamp-2">{item.message}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{item.is_anonymous ? 'Anonymous' : (item.submitter_name || 'Unknown')}</span>
                  {!item.is_anonymous && item.submitter_email && (
                    <span className="truncate">{item.submitter_email}</span>
                  )}
                  {item.admin_response && (
                    <span className="flex items-center gap-1 text-green-600">
                      <Reply className="h-3 w-3" />
                      Responded
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <Card className="lg:sticky lg:top-20 h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Feedback Detail
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(null)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[selected.category] ?? 'bg-slate-100'}`}>
                  {CATEGORY_LABELS[selected.category] ?? selected.category}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status] ?? ''}`}>
                  {STATUS_LABELS[selected.status] ?? selected.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {DOWNLOAD_TYPE_LABELS[selected.download_type] ?? selected.download_type}
                </span>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Submitted</Label>
                <p className="text-sm">{new Date(selected.created_at).toLocaleString()}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">From</Label>
                <p className="text-sm">
                  {selected.is_anonymous
                    ? 'Anonymous'
                    : `${selected.submitter_name || 'Unknown'}${selected.submitter_email ? ` (${selected.submitter_email})` : ''}`}
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Message</Label>
                <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{selected.message}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Admin Response</Label>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type a response (optional)..."
                  rows={3}
                  className="resize-none"
                />
                <Button size="sm" onClick={saveResponse} disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Reply className="h-3.5 w-3.5" />}
                  Save Response
                </Button>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <Label className="text-xs text-muted-foreground">Status:</Label>
                <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)}>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => deleteFeedback(selected.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
