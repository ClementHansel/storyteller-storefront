import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getZenvixConfig, saveZenvixConfig, clearZenvixConfig, isZenvixConfigured } from '@/api/zenvix-config';
import { getQueueStats, clearEventQueue, processRetryQueue } from '@/api/zenvix-events';
import { toast } from 'sonner';
import { Settings, Wifi, WifiOff, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';

const AdminConfigPage = () => {
  const [gatewayUrl, setGatewayUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [queueStats, setQueueStats] = useState({ pending: 0, failed: 0, total: 0 });
  const configured = isZenvixConfigured();

  useEffect(() => {
    const cfg = getZenvixConfig();
    setGatewayUrl(cfg.gatewayUrl);
    setApiKey(cfg.apiKey);
    setTenantId(cfg.tenantId);
    setBranchId(cfg.branchId);
    setQueueStats(getQueueStats());
  }, []);

  const handleSave = () => {
    if (!gatewayUrl || !apiKey || !tenantId || !branchId) {
      toast.error('All fields are required');
      return;
    }
    saveZenvixConfig({ gatewayUrl, apiKey, tenantId, branchId });
    toast.success('Gateway configuration saved');
  };

  const handleClear = () => {
    clearZenvixConfig();
    setGatewayUrl('');
    setApiKey('');
    setTenantId('');
    setBranchId('');
    toast.info('Configuration cleared — running in mock mode');
  };

  const handleFlushQueue = async () => {
    await processRetryQueue();
    setQueueStats(getQueueStats());
    toast.success('Queue processed');
  };

  const handleClearQueue = () => {
    clearEventQueue();
    setQueueStats({ pending: 0, failed: 0, total: 0 });
    toast.info('Event queue cleared');
  };

  return (
    <Layout>
      <title>Admin — Gateway Config</title>
      <div className="container max-w-2xl py-12 md:py-20 space-y-8">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-muted-foreground" />
          <h1 className="font-serif text-3xl font-light text-foreground">Gateway Configuration</h1>
        </div>

        {/* Status banner */}
        <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
          {configured ? (
            <>
              <Wifi className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-foreground">Connected to Zenvix</p>
                <p className="text-xs text-muted-foreground">{gatewayUrl}</p>
              </div>
              <Badge variant="outline" className="ml-auto text-accent border-accent/30">Live</Badge>
            </>
          ) : (
            <>
              <WifiOff className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Mock Mode</p>
                <p className="text-xs text-muted-foreground">Using local sample data. Configure a gateway to connect.</p>
              </div>
              <Badge variant="outline" className="ml-auto">Dev</Badge>
            </>
          )}
        </div>

        {/* Config form */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif font-light">Zenvix Retail Gateway</CardTitle>
            <CardDescription>Connect this storefront to your Zenvix instance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="gatewayUrl" className="text-xs uppercase tracking-wider">Gateway URL</Label>
              <Input
                id="gatewayUrl"
                placeholder="https://api.zenvix.com/v1"
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-xs uppercase tracking-wider">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showKey ? 'text' : 'password'}
                  placeholder="zvx_live_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10 text-muted-foreground"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenantId" className="text-xs uppercase tracking-wider">Tenant ID</Label>
                <Input
                  id="tenantId"
                  placeholder="tenant_001"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchId" className="text-xs uppercase tracking-wider">Branch ID</Label>
                <Input
                  id="branchId"
                  placeholder="branch_main"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} className="rounded-none uppercase tracking-widest text-xs">
                Save Configuration
              </Button>
              {configured && (
                <Button variant="outline" onClick={handleClear} className="rounded-none uppercase tracking-widest text-xs">
                  <Trash2 className="mr-2 h-3 w-3" /> Reset to Mock
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Event queue */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif font-light">Event Queue</CardTitle>
            <CardDescription>Pending user activity events waiting to be forwarded to Zenvix.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <p className="text-2xl font-light text-foreground">{queueStats.pending}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-foreground">{queueStats.failed}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Failed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-foreground">{queueStats.total}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={handleFlushQueue} className="rounded-none text-xs uppercase tracking-wider">
                <RefreshCw className="mr-2 h-3 w-3" /> Retry Now
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearQueue} className="rounded-none text-xs uppercase tracking-wider">
                <Trash2 className="mr-2 h-3 w-3" /> Clear Queue
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-[10px] text-center text-muted-foreground tracking-wider uppercase">
          Configuration stored in browser localStorage — move to Cloud secrets for production
        </p>
      </div>
    </Layout>
  );
};

export default AdminConfigPage;
