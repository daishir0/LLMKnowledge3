import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { recordsAPI, groupsAPI } from '../lib/api';
import { Record, Group } from '../types';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Upload, FileText, Search, Eye } from 'lucide-react';

const Records: React.FC = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [viewingRecord, setViewingRecord] = useState<Record | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    group_id: '',
  });
  const [uploadData, setUploadData] = useState({
    group_id: '',
    file: null as File | null,
  });

  useEffect(() => {
    fetchRecords();
    fetchGroups();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await recordsAPI.list({
        search: searchTerm || undefined,
        group_id: selectedGroup && selectedGroup !== 'all' ? parseInt(selectedGroup) : undefined,
      });
      setRecords(response.data);
    } catch (error) {
      toast.error('Failed to fetch plain knowledge');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await groupsAPI.list();
      setGroups(response.data);
    } catch (error) {
      toast.error('Failed to fetch groups');
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchRecords();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedGroup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        group_id: parseInt(formData.group_id),
      };

      if (editingRecord) {
        await recordsAPI.update(editingRecord.id, data);
        toast.success('Plain knowledge updated successfully');
      } else {
        await recordsAPI.create(data);
        toast.success('Plain knowledge created successfully');
      }
      setDialogOpen(false);
      setEditingRecord(null);
      setFormData({ title: '', content: '', group_id: '' });
      fetchRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save plain knowledge');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.group_id) {
      toast.error('Please select a file and group');
      return;
    }

    try {
      await recordsAPI.upload(parseInt(uploadData.group_id), uploadData.file);
      toast.success('File uploaded successfully');
      setUploadDialogOpen(false);
      setUploadData({ group_id: '', file: null });
      fetchRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload file');
    }
  };

  const handleEdit = (record: Record) => {
    setEditingRecord(record);
    setFormData({
      title: record.title,
      content: record.content,
      group_id: record.group_id.toString(),
    });
    setDialogOpen(true);
  };

  const handleView = (record: Record) => {
    setViewingRecord(record);
    setViewDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this plain knowledge?')) return;
    
    try {
      await recordsAPI.delete(id);
      toast.success('Plain knowledge deleted successfully');
      fetchRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete plain knowledge');
    }
  };

  const openCreateDialog = () => {
    setEditingRecord(null);
    setFormData({ title: '', content: '', group_id: '' });
    setDialogOpen(true);
  };

  const getGroupName = (groupId: number) => {
    const group = groups.find(g => g.id === groupId);
    return group?.name || 'Unknown Group';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plain Knowledge</h1>
          <p className="text-gray-600">Manage your documents and plain knowledge</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
                <DialogDescription>
                  Upload a document to be processed and converted to plain knowledge.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label htmlFor="upload-group">Group</Label>
                  <Select
                    value={uploadData.group_id}
                    onValueChange={(value) => setUploadData({ ...uploadData, group_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="file">File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                    required
                    accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Upload</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create Plain Knowledge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRecord ? 'Edit Plain Knowledge' : 'Create New Plain Knowledge'}
                </DialogTitle>
                <DialogDescription>
                  {editingRecord 
                    ? 'Update the plain knowledge information below.'
                    : 'Create new plain knowledge manually.'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Enter plain knowledge title"
                  />
                </div>
                <div>
                  <Label htmlFor="group">Group</Label>
                  <Select
                    value={formData.group_id}
                    onValueChange={(value) => setFormData({ ...formData, group_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    placeholder="Enter plain knowledge content..."
                    rows={8}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingRecord ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search plain knowledge..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedGroup ? 'No plain knowledge matches your search' : 'No plain knowledge yet'}
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {searchTerm || selectedGroup
                ? 'Try adjusting your search terms or filters.'
                : 'Upload files or create plain knowledge manually to get started.'
              }
            </p>
            {!searchTerm && !selectedGroup && (
              <div className="flex space-x-2">
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Plain Knowledge
                </Button>
                <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{record.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {getGroupName(record.group_id)}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(record)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(record)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 line-clamp-3">
                    {record.content}
                  </div>
                  
                  {record.file_type && (
                    <div className="text-xs text-blue-600">
                      File type: {record.file_type}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Created: {new Date(record.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Record Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingRecord?.title}</DialogTitle>
            <DialogDescription>
              Group: {viewingRecord && getGroupName(viewingRecord.group_id)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm">
                {viewingRecord?.content}
              </pre>
            </div>
            {viewingRecord?.file_path && (
              <div className="text-sm text-gray-600">
                File: {viewingRecord.file_path}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Records;
