import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { groupsAPI, tasksAPI } from '../lib/api';
import { Group } from '../types';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Play, Users } from 'lucide-react';

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await groupsAPI.list();
      setGroups(response.data);
    } catch (error) {
      toast.error('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await groupsAPI.update(editingGroup.id, formData);
        toast.success('Group updated successfully');
      } else {
        await groupsAPI.create(formData);
        toast.success('Group created successfully');
      }
      setDialogOpen(false);
      setEditingGroup(null);
      setFormData({ name: '', description: '' });
      fetchGroups();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save group');
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    
    try {
      await groupsAPI.delete(id);
      toast.success('Group deleted successfully');
      fetchGroups();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete group');
    }
  };

  const handleExecuteTasks = async (groupId: number) => {
    try {
      await tasksAPI.createBulk(groupId);
      toast.success('Tasks created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create tasks');
    }
  };

  const openCreateDialog = () => {
    setEditingGroup(null);
    setFormData({ name: '', description: '' });
    setDialogOpen(true);
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
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600">Organize your records into groups for processing</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? 'Edit Group' : 'Create New Group'}
              </DialogTitle>
              <DialogDescription>
                {editingGroup 
                  ? 'Update the group information below.'
                  : 'Create a new group to organize your records.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter group description (optional)"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingGroup ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Create your first group to start organizing your records and generating knowledge.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    {group.description && (
                      <CardDescription className="mt-1">
                        {group.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(group)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(group.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.task_executed_at && (
                    <Badge variant="secondary">
                      Last processed: {new Date(group.task_executed_at).toLocaleDateString()}
                    </Badge>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExecuteTasks(group.id)}
                      className="flex-1"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Execute Tasks
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Created: {new Date(group.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Groups;
