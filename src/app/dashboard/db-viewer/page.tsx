'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getVisitors, getTemplates, getMessageLogs, getQueuedMessages, getSettings, getServices } from '@/lib/db';
import { Visitor, Template, SmsLog, MessageQueueItem, Settings } from '@/lib/types';

export default function DbViewerPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [queue, setQueue] = useState<MessageQueueItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [v, t, l, q, st, sv] = await Promise.all([
        getVisitors(),
        getTemplates(),
        getMessageLogs(),
        getQueuedMessages(),
        getSettings().catch(() => null),
        getServices()
      ]);
      setVisitors(v);
      setTemplates(t);
      setLogs(l);
      setQueue(q);
      setSettings(st);
      setServices(sv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div>Loading database...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Viewer</h1>
          <p className="text-muted-foreground">View all data in Supabase</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Visitors ({visitors.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {visitors.map(v => (
              <details key={v.id} className="border rounded p-2">
                <summary className="cursor-pointer text-sm">{v.name} - {v.phone}</summary>
                <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(v, null, 2)}</pre>
              </details>
            ))}
            {visitors.length === 0 && <p className="text-muted-foreground">No visitors</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Templates ({templates.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map(t => (
              <details key={t.id} className="border rounded p-2">
                <summary className="cursor-pointer text-sm">{t.name}</summary>
                <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(t, null, 2)}</pre>
              </details>
            ))}
            {templates.length === 0 && <p className="text-muted-foreground">No templates</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Message Logs ({logs.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {logs.map(l => (
              <details key={l.id} className="border rounded p-2">
                <summary className="cursor-pointer text-sm">{l.visitor_name} - {l.status}</summary>
                <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(l, null, 2)}</pre>
              </details>
            ))}
            {logs.length === 0 && <p className="text-muted-foreground">No logs</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Queue ({queue.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {queue.map(q => (
              <details key={q.id} className="border rounded p-2">
                <summary className="cursor-pointer text-sm">{q.visitor_name || q.phone} - {q.status}</summary>
                <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(q, null, 2)}</pre>
              </details>
            ))}
            {queue.length === 0 && <p className="text-muted-foreground">No queued messages</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings & Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {settings && (
              <details className="border rounded p-2">
                <summary className="cursor-pointer text-sm">Settings</summary>
                <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(settings, null, 2)}</pre>
              </details>
            )}
            <details className="border rounded p-2">
              <summary className="cursor-pointer text-sm">Services ({services.length})</summary>
              <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(services, null, 2)}</pre>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
