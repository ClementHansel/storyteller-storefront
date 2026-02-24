import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Plus,
  RefreshCw,
  Trash2,
  RotateCcw,
  WifiOff,
  Wifi,
  ShieldOff,
  Copy,
  ChevronRight,
  Globe,
  Settings,
  Activity,
} from 'lucide-react';
import {
  listConnectors,
  createConnector,
  updateConnector,
  deleteConnector,
  rotateConnectorKey,
  testConnector,
  type EcommerceConnectorRecord,
  type CreateConnectorPayload,
} from '@/api/ecommerce-hub-api';
import { isZenvixConfigured } from '@/api/zenvix-config';

// ── Platform meta ──────────────────────────────────────────────

const PLATFORMS: { value: string; label: string; color: string; icon: string }[] = [
  { value: 'bambusilver', label: 'BambuSilver', color: 'bg-amber-500', icon: '🌿' },
  { value: 'shopee',      label: 'Shopee',      color: 'bg-orange-500', icon: '🛒' },
  { value: 'tokopedia',   label: 'Tokopedia',   color: 'bg-green-500',  icon: '🟢' },
  { value: 'lazada',      label: 'Lazada',      color: 'bg-blue-600',   icon: '🔵' },
  { value: 'tiktok_shop', label: 'TikTok Shop', color: 'bg-black',      icon: '🎵' },
  { value: 'woocommerce', label: 'WooCommerce', color: 'bg-purple-600', icon: '🛍️' },
  { value: 'shopify',     label: 'Shopify',     color: 'bg-emerald-600',icon: '⚡' },
  { value: 'custom',      label: 'Custom',      color: 'bg-slate-500',  icon: '⚙️' },
];

function platformMeta(platform: string) {
  return PLATFORMS.find((p) => p.value === platform) ?? PLATFORMS[PLATFORMS.length - 1];
}

// ── Status badge ───────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'text-emerald-600 border-emerald-300 bg-emerald-50',
    revoked: 'text-red-600 border-red-300 bg-red-50',
    suspended: 'text-amber-600 border-amber-300 bg-amber-50',
  };
  return (
    <Badge variant="outline" className={`text-[10px] uppercase tracking-widest ${map[status] ?? 'text-muted-foreground'}`}>
      {status}
    </Badge>
  );
}

// ── One-time credentials reveal dialog ────────────────────────

interface CredsDialogProps {
  open: boolean;
  onClose: () => void;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
}

function CredentialRevealDialog({ open, onClose, apiKey, clientId, clientSecret }: CredsDialogProps) {
  const copy = (val: string) => {
    navigator.clipboard.writeText(val);
    toast.success('Copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif font-light text-xl">🔐 Save Your Credentials</DialogTitle>
          <DialogDescription>
            These credentials are shown <strong>only once</strong>. Store them securely before closing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {apiKey && (
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-widest">API Key</Label>
              <div className="flex gap-2">
                <Input readOnly value={apiKey} className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={() => copy(apiKey)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
          {clientId && (
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-widest">Client ID</Label>
              <div className="flex gap-2">
                <Input readOnly value={clientId} className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={() => copy(clientId)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
          {clientSecret && (
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-widest">Client Secret</Label>
              <div className="flex gap-2">
                <Input readOnly value={clientSecret} className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={() => copy(clientSecret)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 leading-relaxed">
            ⚠️ These values cannot be retrieved again. If lost, use <strong>Rotate Key</strong> to generate new ones.
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="rounded-none uppercase tracking-widest text-xs w-full">
            I've saved these credentials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add/Edit connector dialog ──────────────────────────────────

interface ConnectorFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing?: EcommerceConnectorRecord | null;
}

function ConnectorFormDialog({ open, onClose, onSaved, editing }: ConnectorFormDialogProps) {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('bambusilver');
  const [domain, setDomain] = useState('');
  const [saving, setSaving] = useState(false);

  // When opening for add or edit, seed form
  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '');
      setPlatform(editing?.platform ?? 'bambusilver');
      setDomain(editing?.domain ?? '');
    }
  }, [open, editing]);

  const handleSubmit = async () => {
    if (!name.trim() || !domain.trim()) {
      toast.error('Name and domain are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateConnector(editing.id, { name, platform, domain });
        toast.success('Connector updated');
        onSaved();
      } else {
        const payload: CreateConnectorPayload = { name, platform, domain };
        const result = await createConnector(payload);
        toast.success('Connector created');
        onSaved();
        // Trigger credential reveal
        onClose();
        // Parent handles the reveal dialog
        (window as any).__hubCredsCallback?.(result.plainApiKey, undefined, undefined);
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save connector');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif font-light text-xl">
            {editing ? 'Edit Connector' : 'Add Ecommerce Connector'}
          </DialogTitle>
          <DialogDescription>
            {editing ? 'Update connector details.' : 'Connect a new ecommerce channel to Zenvix Retail.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest">Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <span className="flex items-center gap-2">
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest">Connector Name</Label>
            <Input
              placeholder="e.g. BambuSilver Production"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest">Store Domain</Label>
            <Input
              placeholder="store.example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Without protocol — e.g. <code>bambusilver.com</code>
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-none text-xs uppercase tracking-widest">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-none text-xs uppercase tracking-widest"
          >
            {saving ? 'Saving…' : editing ? 'Update' : 'Create Connector'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────

const EcommerceHubPage = () => {
  const { isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated; // Stub: treat all authenticated users as admin for now
  const configured = isZenvixConfigured();

  const [connectors, setConnectors] = useState<EcommerceConnectorRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EcommerceConnectorRecord | null>(null);
  const [credsOpen, setCredsOpen] = useState(false);
  const [creds, setCreds] = useState<{ apiKey?: string }>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<EcommerceConnectorRecord | null>(null);

  const load = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    try {
      const data = await listConnectors();
      setConnectors(data);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load connectors');
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    load();
    // Register the one-time callback invoked by the form dialog after create
    (window as any).__hubCredsCallback = (apiKey?: string) => {
      setCreds({ apiKey });
      setCredsOpen(true);
    };
    return () => {
      delete (window as any).__hubCredsCallback;
    };
  }, [load]);

  const handleTest = async (connector: EcommerceConnectorRecord) => {
    setTestingId(connector.id);
    try {
      const result = await testConnector(connector.id);
      if (result.reachable) {
        toast.success(`✓ ${connector.name} is reachable (${result.latencyMs}ms)`);
      } else {
        toast.error(`✗ ${connector.name} unreachable: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Test failed');
    } finally {
      setTestingId(null);
    }
  };

  const handleRotate = async (connector: EcommerceConnectorRecord) => {
    setRotatingId(connector.id);
    try {
      const result = await rotateConnectorKey(connector.id);
      setCreds({ apiKey: result.plainApiKey });
      setCredsOpen(true);
      toast.info('API key rotated — save new key from the dialog');
    } catch (err: any) {
      toast.error(err?.message ?? 'Rotation failed');
    } finally {
      setRotatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      await deleteConnector(confirmDelete.id);
      toast.success(`${confirmDelete.name} removed`);
      setConfirmDelete(null);
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Access guards ────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <Layout>
        <title>EcommerceHub – Admin</title>
        <div className="container max-w-lg py-20">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif font-light">Admin Access Required</CardTitle>
              <CardDescription>Sign in to manage EcommerceHub connections.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <title>EcommerceHub – Admin</title>
        <div className="container max-w-lg py-20">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif font-light">Access Restricted</CardTitle>
              <CardDescription>Admin or superadmin access is required.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  const activeCount = connectors.filter((c) => c.status === 'active').length;

  return (
    <Layout>
      <title>EcommerceHub – Zenvix Connections</title>

      <div className="container max-w-4xl py-12 md:py-16 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-muted-foreground" />
            <div>
              <h1 className="font-serif text-3xl font-light">EcommerceHub</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                Manage ecommerce channel connections to Zenvix Retail
              </p>
            </div>
          </div>
          <Button
            onClick={() => { setEditTarget(null); setFormOpen(true); }}
            className="rounded-none uppercase tracking-widest text-xs gap-2"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Connector
          </Button>
        </div>

        {/* Gateway not configured warning */}
        {!configured && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <WifiOff className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Gateway not configured</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Configure the Zenvix gateway first in{' '}
                <a href="/admin/config" className="underline">Admin Settings</a>{' '}
                before managing connectors.
              </p>
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: connectors.length },
            { label: 'Active', value: activeCount },
            { label: 'Inactive', value: connectors.length - activeCount },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-light tracking-tight">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Platform quick-add pills */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Quick add by platform
          </p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setEditTarget(null);
                  setFormOpen(true);
                  // Pre-select platform — handled inside dialog via editing=null + initial state
                  setTimeout(() => {
                    (window as any).__hubSetPlatform?.(p.value);
                  }, 50);
                }}
                className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-xs hover:border-foreground/30 hover:bg-muted/40 transition-colors"
              >
                <span>{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Connector list */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="font-serif font-light">Connectors</CardTitle>
              <CardDescription>
                Each connector holds its own API key and per-platform settings.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={load}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {connectors.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No connectors yet.</p>
                <p className="text-xs mt-1">Click <strong>Add Connector</strong> to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {connectors.map((connector) => {
                  const meta = platformMeta(connector.platform);
                  return (
                    <div
                      key={connector.id}
                      className="flex items-center gap-4 py-3.5 group"
                    >
                      {/* Platform icon */}
                      <div className={`h-9 w-9 rounded-lg ${meta.color} flex items-center justify-center text-white text-base shrink-0`}>
                        {meta.icon}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{connector.name}</p>
                          <StatusBadge status={connector.status} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{connector.domain}</p>
                      </div>

                      {/* Platform label */}
                      <span className="hidden sm:block text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">
                        {meta.label}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Test */}
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={testingId === connector.id}
                          onClick={() => handleTest(connector)}
                          title="Test connection"
                          className="h-7 w-7"
                        >
                          {testingId === connector.id
                            ? <Activity className="h-3.5 w-3.5 animate-pulse text-blue-500" />
                            : <Wifi className="h-3.5 w-3.5" />}
                        </Button>
                        {/* Edit */}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { setEditTarget(connector); setFormOpen(true); }}
                          title="Edit"
                          className="h-7 w-7"
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                        {/* Rotate key */}
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={rotatingId === connector.id}
                          onClick={() => handleRotate(connector)}
                          title="Rotate API key"
                          className="h-7 w-7"
                        >
                          <RotateCcw className={`h-3.5 w-3.5 ${rotatingId === connector.id ? 'animate-spin' : ''}`} />
                        </Button>
                        {/* Delete */}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setConfirmDelete(connector)}
                          title="Remove connector"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info footer */}
        <p className="text-[10px] text-center text-muted-foreground tracking-wider uppercase">
          API keys are hashed server-side — shown only on create / rotate.
          Secrets are stored in Zenvix backend, not in localStorage.
        </p>
      </div>

      {/* Dialogs */}
      <ConnectorFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        editing={editTarget}
      />

      <CredentialRevealDialog
        open={credsOpen}
        onClose={() => setCredsOpen(false)}
        apiKey={creds.apiKey}
      />

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif font-light">Remove Connector?</DialogTitle>
            <DialogDescription>
              <strong>{confirmDelete?.name}</strong> will be soft-deleted and its API key revoked.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} className="rounded-none text-xs uppercase">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!!deletingId}
              className="rounded-none text-xs uppercase"
            >
              {deletingId ? 'Removing…' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default EcommerceHubPage;
