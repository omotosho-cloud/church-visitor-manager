'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Search, MoreVertical, Filter, ChevronLeft, ChevronRight, X, Download, Send,  } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AddMemberDialog } from '@/components/add-member-dialog';
import { SendSmsToMembersDialog } from '@/components/send-sms-to-members-dialog';
import { BulkUploadMembersDialog } from '@/components/bulk-upload-members-dialog';
import { ViewMemberDialog } from '@/components/view-member-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { getMembers, deleteMember as dbDeleteMember } from '@/lib/db';
import { Member } from '@/lib/types';
import { format } from 'date-fns';
import { toast, Toaster } from 'sonner';
import { getStatusColor, getCategoryColor } from '@/lib/utils';
import { MESSAGES, ITEMS_PER_PAGE } from '@/lib/constants';
import { TableSkeleton } from '@/components/table-skeleton';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = ITEMS_PER_PAGE;
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMaritalStatus, setFilterMaritalStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isSendSmsDialogOpen, setIsSendSmsDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; bulk: boolean } | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await getMembers();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search);
    const matchesStatus = filterStatus === 'all' || m.membership_status === filterStatus;
    const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
    const matchesMaritalStatus = filterMaritalStatus === 'all' || m.marital_status === filterMaritalStatus;
    
    let matchesDate = true;
    if (filterDateFrom || filterDateTo) {
      const createdDate = new Date(m.created_at!);
      if (filterDateFrom) matchesDate = matchesDate && createdDate >= new Date(filterDateFrom);
      if (filterDateTo) matchesDate = matchesDate && createdDate <= new Date(filterDateTo + 'T23:59:59');
    }
    
    return matchesSearch && matchesStatus && matchesCategory && matchesMaritalStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const activeFilters = (filterStatus !== 'all' ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0) + (filterMaritalStatus !== 'all' ? 1 : 0) + (filterDateFrom ? 1 : 0) + (filterDateTo ? 1 : 0);

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterCategory('all');
    setFilterMaritalStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const toggleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(m => m.id!));
    }
  };

  const toggleSelectMember = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const getSelectedMemberObjects = () => {
    return members.filter(m => selectedMembers.includes(m.id!));
  };

  const deleteMember = async (id: string) => {
    setDeleteConfirm({ id, bulk: false });
  };

  const bulkDeleteMembers = async () => {
    setDeleteConfirm({ id: '', bulk: true });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    if (deleteConfirm.bulk) {
      const optimisticMembers = members.filter(m => !selectedMembers.includes(m.id!));
      setMembers(optimisticMembers);
      
      try {
        await Promise.all(selectedMembers.map(id => dbDeleteMember(id)));
        toast.success(`${selectedMembers.length} members deleted successfully`);
        setSelectedMembers([]);
      } catch (error) {
        toast.error('Failed to delete some members');
        fetchMembers();
      }
    } else {
      const optimisticMembers = members.filter(m => m.id !== deleteConfirm.id);
      setMembers(optimisticMembers);
      
      try {
        await dbDeleteMember(deleteConfirm.id);
        toast.success(MESSAGES.SUCCESS.MEMBER_DELETED);
      } catch (error) {
        toast.error(MESSAGES.ERROR.DELETE_FAILED);
        fetchMembers();
      }
    }
    
    setDeleteConfirm(null);
  };

  const exportToCSV = (selectedOnly = false) => {
    const dataToExport = selectedOnly 
      ? members.filter(m => selectedMembers.includes(m.id!))
      : filteredMembers;
    
    const data = dataToExport.map(m => ({
      Name: m.name,
      Phone: m.phone,
      Email: m.email || '',
      Gender: m.gender,
      Category: m.category,
      Status: m.membership_status,
      'Join Date': m.join_date || ''
    }));
    
    const headers = ['Name', 'Phone', 'Email', 'Gender', 'Category', 'Status', 'Join Date'];
    const rows = data.map(row => headers.map(h => row[h as keyof typeof row] || ''));
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members_${selectedOnly ? 'selected_' : ''}${format(Date.now(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(MESSAGES.SUCCESS.CSV_EXPORTED);
  };

return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">Manage church members and their information.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedMembers.length > 0 && (
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
                onClick={bulkDeleteMembers}
              >
                Delete ({selectedMembers.length})
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setIsSendSmsDialogOpen(true)}
              >
                <Send className="h-4 w-4 mr-2" />
                Send SMS ({selectedMembers.length})
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setIsBulkUploadOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToCSV(false)} disabled={filteredMembers.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      <AddMemberDialog 
        open={isAddDialogOpen || !!editingMember} 
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingMember(null);
        }} 
        onSuccess={fetchMembers}
        editMember={editingMember}
      />

      <SendSmsToMembersDialog
        open={isSendSmsDialogOpen}
        onOpenChange={setIsSendSmsDialogOpen}
        selectedMembers={getSelectedMemberObjects()}
        onSuccess={() => setSelectedMembers([])}
      />

      <BulkUploadMembersDialog
        open={isBulkUploadOpen}
        onOpenChange={setIsBulkUploadOpen}
        onSuccess={fetchMembers}
      />

      <ViewMemberDialog
        open={!!viewingMember}
        onOpenChange={(open) => !open && setViewingMember(null)}
        member={viewingMember}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title={deleteConfirm?.bulk ? 'Delete Multiple Members' : 'Delete Member'}
        description={
          deleteConfirm?.bulk
            ? `Are you sure you want to delete ${selectedMembers.length} selected members? This action cannot be undone.`
            : 'Are you sure you want to delete this member? This action cannot be undone.'
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
                    <label className="text-sm font-medium">Status</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="transferred">Transferred</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="adult">Adult</SelectItem>
                        <SelectItem value="youth">Youth</SelectItem>
                        <SelectItem value="children">Children</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Marital Status</label>
                    <Select value={filterMaritalStatus} onValueChange={setFilterMaritalStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12.5">
                    <Checkbox
                      checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Phone</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Birthday</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton rows={5} cols={6} />
                ) : filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedMembers.includes(member.id!)}
                          onCheckedChange={() => toggleSelectMember(member.id!)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div>{member.name}</div>
                          <div className="text-xs text-muted-foreground sm:hidden font-mono">{member.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-xs">{member.phone}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={getCategoryColor(member.category)}>
                          {member.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {member.birth_month && member.birth_day 
                          ? `${new Date(2000, member.birth_month - 1, member.birth_day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className={getStatusColor(member.membership_status)}>
                          {member.membership_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingMember(member)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingMember(member)}>Edit Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteMember(member.id || '')}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length}
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
