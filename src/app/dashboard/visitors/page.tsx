'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Search, MoreVertical, MessageSquare, Filter, ChevronLeft, ChevronRight, X, Download, Send } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AddVisitorDialog } from '@/components/add-visitor-dialog';
import { ScheduleSmsDialog } from '@/components/schedule-sms-dialog';
import { BulkUploadDialog } from '@/components/bulk-upload-dialog';
import { SendSmsToSelectedDialog } from '@/components/send-sms-to-selected-dialog';
import { PromoteToMemberDialog } from '@/components/promote-to-member-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { getVisitors, deleteVisitor as dbDeleteVisitor, getServices } from '@/lib/db';
import { Visitor } from '@/lib/types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { MESSAGES, ITEMS_PER_PAGE } from '@/lib/constants';
import { TableSkeleton } from '@/components/table-skeleton';

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = ITEMS_PER_PAGE;
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [services, setServices] = useState<string[]>([]);
  const [selectedVisitors, setSelectedVisitors] = useState<string[]>([]);
  const [isSendSmsDialogOpen, setIsSendSmsDialogOpen] = useState(false);
  const [promoteVisitor, setPromoteVisitor] = useState<Visitor | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; bulk: boolean } | null>(null);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const data = await getVisitors();
      setVisitors(data);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      toast.error('Failed to fetch visitors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
    const fetchServicesData = async () => {
      try {
        const data = await getServices();
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
    fetchServicesData();
  }, []);

  const filteredVisitors = visitors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.phone.includes(search);
    const matchesGender = filterGender === 'all' || v.gender === filterGender;
    const matchesService = filterService === 'all' || v.service === filterService;
    
    let matchesDate = true;
    if (filterDateFrom || filterDateTo) {
      const createdDate = new Date(v.created_at!);
      if (filterDateFrom) matchesDate = matchesDate && createdDate >= new Date(filterDateFrom);
      if (filterDateTo) matchesDate = matchesDate && createdDate <= new Date(filterDateTo + 'T23:59:59');
    }
    
    return matchesSearch && matchesGender && matchesService && matchesDate;
  });

  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);
  const paginatedVisitors = filteredVisitors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const activeFilters = (filterGender !== 'all' ? 1 : 0) + (filterService !== 'all' ? 1 : 0) + (filterDateFrom ? 1 : 0) + (filterDateTo ? 1 : 0);

  const clearFilters = () => {
    setFilterGender('all');
    setFilterService('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const toggleSelectAll = () => {
    if (selectedVisitors.length === filteredVisitors.length) {
      setSelectedVisitors([]);
    } else {
      setSelectedVisitors(filteredVisitors.map(v => v.id!));
    }
  };

  const toggleSelectVisitor = (id: string) => {
    setSelectedVisitors(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const getSelectedVisitorObjects = () => {
    return visitors.filter(v => selectedVisitors.includes(v.id!));
  };

  const deleteVisitor = async (id: string) => {
    setDeleteConfirm({ id, bulk: false });
  };

  const bulkDeleteVisitors = async () => {
    setDeleteConfirm({ id: '', bulk: true });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    if (deleteConfirm.bulk) {
      const optimisticVisitors = visitors.filter(v => !selectedVisitors.includes(v.id!));
      setVisitors(optimisticVisitors);
      
      try {
        await Promise.all(selectedVisitors.map(id => dbDeleteVisitor(id)));
        toast.success(`${selectedVisitors.length} visitors deleted successfully`);
        setSelectedVisitors([]);
      } catch (error) {
        toast.error('Failed to delete some visitors');
        fetchVisitors();
      }
    } else {
      const optimisticVisitors = visitors.filter(v => v.id !== deleteConfirm.id);
      setVisitors(optimisticVisitors);
      
      try {
        await dbDeleteVisitor(deleteConfirm.id);
        toast.success(MESSAGES.SUCCESS.VISITOR_DELETED);
      } catch (error) {
        toast.error(MESSAGES.ERROR.DELETE_FAILED);
        fetchVisitors();
      }
    }
    
    setDeleteConfirm(null);
  };

  const exportToCSV = (selectedOnly = false) => {
    const dataToExport = selectedOnly 
      ? visitors.filter(v => selectedVisitors.includes(v.id!))
      : filteredVisitors;
    
    const headers = ['Name', 'Phone', 'Gender', 'Service', 'Notes', 'Date Added'];
    const rows = dataToExport.map(v => [
      v.name,
      v.phone,
      v.gender,
      v.service || '',
      v.notes || '',
      format(new Date(v.created_at!), 'yyyy-MM-dd HH:mm:ss')
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitors_${selectedOnly ? 'selected_' : ''}${format(Date.now(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(MESSAGES.SUCCESS.CSV_EXPORTED);
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visitors</h1>
          <p className="text-muted-foreground">Manage first-time visitors and their follow-up status.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
            {selectedVisitors.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToCSV(true)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={bulkDeleteVisitors}
                >
                  Delete ({selectedVisitors.length})
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setIsSendSmsDialogOpen(true)}
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Send SMS</span> ({selectedVisitors.length})
                </Button>
              </>
            )}
            <Button 
                variant="outline" 
                size="sm"
                className="hidden sm:flex items-center gap-2"
                onClick={() => setIsBulkUploadOpen(true)}
            >
                <Download className="h-4 w-4" />
                Bulk Upload
            </Button>
            <Button 
                variant="outline" 
                size="sm"
                className="hidden sm:flex items-center gap-2"
                onClick={() => exportToCSV(false)}
                disabled={filteredVisitors.length === 0}
            >
                <Download className="h-4 w-4" />
                Export CSV
            </Button>
            <Button 
                variant="outline" 
                size="sm"
                className="hidden sm:flex items-center gap-2"
                onClick={() => setIsScheduleDialogOpen(true)}
            >
                <MessageSquare className="h-4 w-4" />
                Broadcast
            </Button>
            <Button 
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setIsAddDialogOpen(true)}
            >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Visitor</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="sm:hidden">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsBulkUploadOpen(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Bulk Upload
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToCSV(false)} disabled={filteredVisitors.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsScheduleDialogOpen(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Broadcast SMS
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <AddVisitorDialog 
        open={isAddDialogOpen || !!editingVisitor} 
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingVisitor(null);
        }} 
        onSuccess={fetchVisitors}
        editVisitor={editingVisitor}
      />

      <ScheduleSmsDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        onSuccess={() => {}}
      />

      <BulkUploadDialog
        open={isBulkUploadOpen}
        onOpenChange={setIsBulkUploadOpen}
        onSuccess={fetchVisitors}
      />

      <SendSmsToSelectedDialog
        open={isSendSmsDialogOpen}
        onOpenChange={setIsSendSmsDialogOpen}
        selectedVisitors={getSelectedVisitorObjects()}
        onSuccess={() => setSelectedVisitors([])}
      />

      <PromoteToMemberDialog
        open={!!promoteVisitor}
        onOpenChange={(open) => !open && setPromoteVisitor(null)}
        visitor={promoteVisitor}
        onSuccess={fetchVisitors}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title={deleteConfirm?.bulk ? 'Delete Multiple Visitors' : 'Delete Visitor'}
        description={
          deleteConfirm?.bulk
            ? `Are you sure you want to delete ${selectedVisitors.length} selected visitors? This action cannot be undone.`
            : 'Are you sure you want to delete this visitor? This action cannot be undone.'
        }
      />

      <Card>
        <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name or phone..." 
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                      {activeFilters > 0 && (
                        <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          {activeFilters}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Filters</h4>
                        {activeFilters > 0 && (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            <X className="h-4 w-4 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Gender</label>
                        <Select value={filterGender} onValueChange={setFilterGender}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Service</label>
                        <Select value={filterService} onValueChange={setFilterService}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {services.map((service) => (
                              <SelectItem key={service} value={service}>{service}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date From</label>
                        <Input 
                          type="date" 
                          value={filterDateFrom} 
                          onChange={(e) => setFilterDateFrom(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date To</label>
                        <Input 
                          type="date" 
                          value={filterDateTo} 
                          onChange={(e) => setFilterDateTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
            </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <div className="min-w-150">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12.5">
                    <Checkbox
                      checked={selectedVisitors.length === filteredVisitors.length && filteredVisitors.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Visitor Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Phone</TableHead>
                  <TableHead className="hidden md:table-cell">Gender</TableHead>
                  <TableHead className="hidden lg:table-cell">Birthday</TableHead>
                  <TableHead className="hidden lg:table-cell">Date Added</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton rows={5} cols={7} />
                ) : filteredVisitors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No visitors found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVisitors.map((visitor) => (
                    <TableRow key={visitor.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedVisitors.includes(visitor.id!)}
                          onCheckedChange={() => toggleSelectVisitor(visitor.id!)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div>{visitor.name}</div>
                          <div className="text-xs text-muted-foreground sm:hidden font-mono">{visitor.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-xs">{visitor.phone}</TableCell>
                      <TableCell className="hidden md:table-cell capitalize">
                        <Badge variant="outline" className="font-normal">
                          {visitor.gender}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {visitor.birth_month && visitor.birth_day 
                          ? `${new Date(2000, visitor.birth_month - 1, visitor.birth_day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs whitespace-nowrap">
                        {format(new Date(visitor.created_at!), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingVisitor(visitor)}>Edit Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPromoteVisitor(visitor)}>Promote to Member</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteVisitor(visitor.id || '')}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredVisitors.length)} of {filteredVisitors.length}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
