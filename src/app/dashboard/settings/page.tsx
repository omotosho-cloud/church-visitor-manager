'use client';

import { useEffect, useState } from 'react';
import { Save, Building2, MessageSquare, Info, Upload, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSettings, updateSettings as dbUpdateSettings, getServices, createService, deleteService, uploadFile } from '@/lib/db';
import { Settings } from '@/lib/types';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    church_name: 'RCCG Victory Center',
    theme_color: '#008800',
    sender_id: 'RCCGVC',
    automation_enabled: true,
    sms_provider: 'termii',
    whatsapp_provider: 'termii-whatsapp',
    message_channel: 'sms',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [services, setServices] = useState<string[]>(['Sunday Service', 'Digging Deep', 'Faith Clinic']);
  const [newService, setNewService] = useState('');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploading(true);
      const result = await uploadFile(file) as { url?: string } | { url?: string }[];
      const url = Array.isArray(result) ? result[0]?.url : result?.url;
      if (url) {
        setSettings({ ...settings, logo: url });
        toast.success('Logo uploaded successfully');
      } else {
        toast.error('Failed to get logo URL');
      }
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settingsData = await getSettings();
        setSettings(settingsData);
        
        const servicesData = await getServices();
        setServices(servicesData);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const saveSettings = async () => {
    try {
      setSaving(true);
      await dbUpdateSettings(settings);
      
      // Update services - delete removed, add new
      const currentServices = await getServices();
      for (const svc of currentServices) {
        if (!services.includes(svc)) {
          await deleteService(svc);
        }
      }
      for (const svc of services) {
        if (!currentServices.includes(svc)) {
          await createService(svc);
        }
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <Toaster position="top-right" richColors />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage church profile and system preferences.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Church Profile</CardTitle>
            </div>
            <CardDescription>Basic information about your organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="church-name">Church Name</Label>
              <Input 
                id="church-name" 
                value={settings.church_name}
                onChange={(e) => setSettings({ ...settings, church_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logo">Logo</Label>
              <Button 
                type="button" 
                variant="outline" 
                disabled={uploading}
                onClick={() => document.getElementById('logo-upload')?.click()}
                className="w-fit"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Logo'}
              </Button>
              <input 
                id="logo-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleLogoUpload}
              />
              {settings.logo && (
                <img src={settings.logo} alt="Logo preview" className="h-16 w-16 object-contain border rounded" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>Messaging Configuration</CardTitle>
            </div>
            <CardDescription>Configure SMS and WhatsApp messaging.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="channel">Message Channel</Label>
              <Select 
                value={settings.message_channel || 'sms'} 
                onValueChange={(value: 'sms' | 'whatsapp' | 'both') => setSettings({ ...settings, message_channel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS Only</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp Only</SelectItem>
                  <SelectItem value="both">Both SMS & WhatsApp</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose how to send messages to visitors.
              </p>
            </div>

            {(settings.message_channel === 'sms' || settings.message_channel === 'both') && (
              <div className="grid gap-2">
                <Label htmlFor="provider">SMS Provider</Label>
                <Select 
                  value={settings.sms_provider || 'termii'} 
                  onValueChange={(value: 'termii' | 'twilio') => setSettings({ ...settings, sms_provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="termii">Termii </SelectItem>
                    <SelectItem value="twilio">Twilio </SelectItem>
                  </SelectContent>
                </Select>              
              </div>
            )}

            {(settings.message_channel === 'whatsapp' || settings.message_channel === 'both') && (
              <div className="grid gap-2">
                <Label htmlFor="whatsapp-provider">WhatsApp Provider</Label>
                <Select 
                  value={settings.whatsapp_provider || 'termii-whatsapp'} 
                  onValueChange={(value: 'twilio-whatsapp' | 'termii-whatsapp') => setSettings({ ...settings, whatsapp_provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="termii-whatsapp">Termii WhatsApp </SelectItem>
                    <SelectItem value="twilio-whatsapp">Twilio WhatsApp </SelectItem>
                  </SelectContent>
                </Select>              
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="sender-id">Sender ID</Label>
              <Input 
                id="sender-id" 
                value={settings.sender_id}
                onChange={(e) => setSettings({ ...settings, sender_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">This ID will appear as the sender on recipients&apos; phones.</p>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-base">Automation Enabled</Label>
                <p className="text-sm text-muted-foreground">Trigger follow-ups automatically.</p>
              </div>
              <Switch 
                checked={settings.automation_enabled}
                onCheckedChange={(checked: boolean) => setSettings({ ...settings, automation_enabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Times</CardTitle>
            <CardDescription>Manage available service options for visitors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Add new service..." 
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newService.trim()) {
                    setServices([...services, newService.trim()]);
                    setNewService('');
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={() => {
                  if (newService.trim()) {
                    setServices([...services, newService.trim()]);
                    setNewService('');
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {services.map((service, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-sm">
                  {service}
                  <button 
                    onClick={() => setServices(services.filter((_, i) => i !== idx))}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-primary">API Credentials</h4>
                        <p className="text-sm text-muted-foreground mt-1 mb-2">
                            API keys are managed via environment variables (.env.local):
                        </p>
                        <div className="text-xs font-mono bg-background/50 p-2 rounded space-y-1">
                            {settings.message_channel === 'sms' && settings.sms_provider === 'twilio' && (
                                <>
                                    <div>NEXT_PUBLIC_TWILIO_ACCOUNT_SID</div>
                                    <div>NEXT_PUBLIC_TWILIO_AUTH_TOKEN</div>
                                    <div>NEXT_PUBLIC_TWILIO_PHONE_NUMBER</div>
                                </>
                            )}
                            {settings.message_channel === 'sms' && settings.sms_provider === 'termii' && (
                                <>
                                    <div>NEXT_PUBLIC_TERMII_API_KEY</div>
                                    <div>NEXT_PUBLIC_TERMII_SENDER_ID</div>
                                </>
                            )}
                            {settings.message_channel === 'whatsapp' && settings.whatsapp_provider === 'twilio-whatsapp' && (
                                <>
                                    <div>NEXT_PUBLIC_TWILIO_ACCOUNT_SID</div>
                                    <div>NEXT_PUBLIC_TWILIO_AUTH_TOKEN</div>
                                    <div>NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER (optional)</div>
                                </>
                            )}
                            {settings.message_channel === 'whatsapp' && settings.whatsapp_provider === 'termii-whatsapp' && (
                                <>
                                    <div>NEXT_PUBLIC_TERMII_API_KEY</div>
                                </>
                            )}
                            {settings.message_channel === 'both' && (
                                <>
                                    <div className="font-semibold mt-2">SMS:</div>
                                    {settings.sms_provider === 'twilio' ? (
                                        <>
                                            <div>NEXT_PUBLIC_TWILIO_ACCOUNT_SID</div>
                                            <div>NEXT_PUBLIC_TWILIO_AUTH_TOKEN</div>
                                            <div>NEXT_PUBLIC_TWILIO_PHONE_NUMBER</div>
                                        </>
                                    ) : (
                                        <>
                                            <div>NEXT_PUBLIC_TERMII_API_KEY</div>
                                            <div>NEXT_PUBLIC_TERMII_SENDER_ID</div>
                                        </>
                                    )}
                                    <div className="font-semibold mt-2">WhatsApp:</div>
                                    {settings.whatsapp_provider === 'termii-whatsapp' ? (
                                        <>
                                            <div>NEXT_PUBLIC_TERMII_API_KEY</div>
                                        </>
                                    ) : (
                                        <>
                                            <div>NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER (optional)</div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={saving} className="min-w-30">
            {saving ? 'Saving...' : (
                <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
