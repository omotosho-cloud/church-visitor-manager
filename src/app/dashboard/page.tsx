'use client';

import { useEffect, useState } from 'react';
import { Users, MessageSquare, TrendingUp, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getVisitors, getMessageLogs, getMembers, getUpcomingBirthdays } from '@/lib/db';
import { Visitor, SmsLog, Member } from '@/lib/types';
import { format, subDays } from 'date-fns';

export default function DashboardPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const visitorItems = await getVisitors();
        const memberItems = await getMembers();
        const logItems = await getMessageLogs();
        const birthdays = await getUpcomingBirthdays(7);
        
        setVisitors(visitorItems);
        setMembers(memberItems);
        setLogs(logItems);
        setUpcomingBirthdays(birthdays);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredVisitors = visitors.filter(v => {
    const createdAt = new Date(v.created_at!).getTime();
    const from = new Date(startDate).getTime();
    const to = new Date(endDate).setHours(23, 59, 59, 999);
    return createdAt >= from && createdAt <= to;
  });

  const filteredLogs = logs.filter(l => {
    const sentAt = new Date(l.sent_at!).getTime();
    const from = new Date(startDate).getTime();
    const to = new Date(endDate).setHours(23, 59, 59, 999);
    return sentAt >= from && sentAt <= to;
  });

  const last7Days = subDays(Date.now(), 7).getTime();
  const last30Days = subDays(Date.now(), 30).getTime();
  
  const stats = {
    totalVisitors: filteredVisitors.length,
    last7Days: filteredVisitors.filter(v => new Date(v.created_at!).getTime() >= last7Days).length,
    last30Days: filteredVisitors.filter(v => new Date(v.created_at!).getTime() >= last30Days).length,
    messagesSent: filteredLogs.filter(l => l.status === 'sent').length,
    totalMembers: members.length,
    activeMembers: members.filter(m => m.membership_status === 'active').length,
  };

  const recentVisitors = filteredVisitors.slice(0, 5);

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your visitor management system.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex h-9 w-full sm:w-auto rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          />
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex h-9 w-full sm:w-auto rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisitors}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeMembers} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.last7Days}</div>
            <p className="text-xs text-muted-foreground">New visitors this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messagesSent}</div>
            <p className="text-xs text-muted-foreground">Total SMS delivered</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            {recentVisitors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No visitors yet</p>
            ) : (
              <div className="space-y-4">
                {recentVisitors.map((visitor) => (
                  <div key={visitor.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{visitor.name}</p>
                      <p className="text-sm text-muted-foreground">{visitor.phone}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="capitalize">{visitor.gender}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(visitor.created_at!), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Birthdays</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length === 0 ? (
              <p className="text-sm text-muted-foreground">No birthdays in the next 7 days</p>
            ) : (
              <div className="space-y-4">
                {upcomingBirthdays.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.phone}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">🎂</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(2000, member.birth_month! - 1, member.birth_day!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages sent yet</p>
            ) : (
              <div className="space-y-4">
                {filteredLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium font-mono text-xs">{log.phone}</p>
                      <p className="text-sm text-muted-foreground truncate">{log.message.substring(0, 40)}...</p>
                    </div>
                    <div className="text-right ml-2">
                      <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                        {log.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.sent_at!), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Members</span>
                <Badge variant="default">{stats.activeMembers}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Inactive Members</span>
                <Badge variant="outline">{members.filter(m => m.membership_status === 'inactive').length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Transferred</span>
                <Badge variant="outline">{members.filter(m => m.membership_status === 'transferred').length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Adults</span>
                <Badge variant="outline">{members.filter(m => m.category === 'adult').length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Youth</span>
                <Badge variant="outline">{members.filter(m => m.category === 'youth').length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Children</span>
                <Badge variant="outline">{members.filter(m => m.category === 'children').length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
