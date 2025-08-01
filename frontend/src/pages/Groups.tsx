import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { groupsAPI, tasksAPI, promptsAPI } from '../lib/api';
import { Group, Prompt, GroupDetail } from '../types';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Play, Users, Settings, Link, Unlink, Eye, FileText, Brain, Clock, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [managingGroup, setManagingGroup] = useState<Group | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [groupPrompts, setGroupPrompts] = useState<Prompt[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchGroups();
    fetchPrompts();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await groupsAPI.list();
      const groupsData = response.data;
      
      // 各グループのプロンプト数を取得
      const groupsWithPrompts = await Promise.all(
        groupsData.map(async (group: Group) => {
          try {
            const promptsResponse = await groupsAPI.getPrompts(group.id);
            return { ...group, prompts: promptsResponse.data };
          } catch (error) {
            return { ...group, prompts: [] };
          }
        })
      );
      
      setGroups(groupsWithPrompts);
    } catch (error) {
      toast.error('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrompts = async () => {
    try {
      const response = await promptsAPI.list();
      setPrompts(response.data);
    } catch (error) {
      toast.error('Failed to fetch prompts');
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

  const handleExecuteTasks = async (groupId: number, force: boolean = false) => {
    try {
      await tasksAPI.createBulk(groupId, force);
      if (force) {
        toast.success('Tasks re-executed successfully (forced)');  
      } else {
        toast.success('Tasks created successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create tasks');
    }
  };

  const handleManagePrompts = async (group: Group) => {
    setManagingGroup(group);
    setSelectedPromptId('');
    setPromptsLoading(true);
    
    try {
      const response = await groupsAPI.getPrompts(group.id);
      setGroupPrompts(response.data);
    } catch (error) {
      toast.error('Failed to fetch group prompts');
      setGroupPrompts([]);
    } finally {
      setPromptsLoading(false);
    }
    
    setPromptDialogOpen(true);
  };

  const handleAddPrompt = async () => {
    if (!managingGroup || !selectedPromptId) return;

    try {
      await groupsAPI.addPrompt(managingGroup.id, parseInt(selectedPromptId));
      toast.success('Prompt added to group successfully');
      setSelectedPromptId('');
      
      // グループプロンプト一覧を更新
      const response = await groupsAPI.getPrompts(managingGroup.id);
      setGroupPrompts(response.data);
      
      // グループ一覧を更新
      fetchGroups();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add prompt to group');
    }
  };

  const handleRemovePrompt = async (groupId: number, promptId: number) => {
    if (!confirm('Are you sure you want to remove this prompt from the group?')) return;

    try {
      await groupsAPI.removePrompt(groupId, promptId);
      toast.success('Prompt removed from group successfully');
      
      // プロンプト管理ダイアログが開いている場合は更新
      if (managingGroup && managingGroup.id === groupId) {
        const response = await groupsAPI.getPrompts(groupId);
        setGroupPrompts(response.data);
      }
      
      fetchGroups();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to remove prompt from group');
    }
  };

  const handleShowDetail = async (group: Group) => {
    setDetailLoading(true);
    setDetailDialogOpen(true);
    
    try {
      const response = await groupsAPI.getDetail(group.id);
      setGroupDetail(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to fetch group details');
      setGroupDetail(null);
    } finally {
      setDetailLoading(false);
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
            <Card key={group.id} className="hover:shadow-md transition-shadow relative">
              <CardHeader className="pb-4">
                {/* Action buttons - fixed in top right */}
                <div className="absolute top-4 right-4 flex space-x-1 z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShowDetail(group)}
                    title="View Details"
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleManagePrompts(group)}
                    title="Manage Prompts"
                    className="h-8 w-8 p-0"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(group)}
                    title="Edit Group"
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(group.id)}
                    title="Delete Group"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Title and description - with proper spacing for buttons */}
                <div className="pr-36">
                  <CardTitle className="text-lg leading-tight">{group.name}</CardTitle>
                  {group.description && (
                    <CardDescription className="mt-2 text-sm">
                      {group.description}
                    </CardDescription>
                  )}
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
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleExecuteTasks(group.id, true)}
                      title="Force re-execute all tasks (ignore existing results)"
                    >
                      <Play className="mr-1 h-3 w-3" />
                      Force
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

      {/* Prompt Management Dialog */}
      <Dialog open={promptDialogOpen} onOpenChange={setPromptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Prompts - {managingGroup?.name}</DialogTitle>
            <DialogDescription>
              Add or remove prompts for this group. Prompts will be applied to all records in the group when executing tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* 現在のプロンプト一覧 */}
            <div>
              <Label className="text-sm font-medium">Current Prompts</Label>
              {promptsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {groupPrompts.length > 0 ? (
                    groupPrompts.map((prompt) => (
                      <div key={prompt.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{prompt.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePrompt(managingGroup!.id, prompt.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Unlink className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 py-2">No prompts assigned</p>
                  )}
                </div>
              )}
            </div>
            
            {/* プロンプト追加 */}
            <div>
              <Label htmlFor="prompt">Add New Prompt</Label>
              <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a prompt to add" />
                </SelectTrigger>
                <SelectContent>
                  {prompts
                    .filter(prompt => !groupPrompts.some(gp => gp.id === prompt.id))
                    .map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id.toString()}>
                        {prompt.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setPromptDialogOpen(false)}
              >
                Close
              </Button>
              <Button 
                onClick={handleAddPrompt}
                disabled={!selectedPromptId}
                size="sm"
              >
                <Link className="mr-2 h-4 w-4" />
                Add Prompt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Group Details - {groupDetail?.group.name}</DialogTitle>
            <DialogDescription>
              Comprehensive view of records, generated knowledge, and task status for this group.
            </DialogDescription>
          </DialogHeader>
          
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : groupDetail ? (
            <div className="space-y-6">
              {/* Task Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Task Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{groupDetail.task_stats.total}</div>
                      <div className="text-sm text-gray-600">Total Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{groupDetail.task_stats.completed}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{groupDetail.task_stats.failed}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{groupDetail.task_stats.processing}</div>
                      <div className="text-sm text-gray-600">Processing</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{groupDetail.task_stats.completion_rate}%</div>
                      <div className="text-sm text-gray-600">Completion Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Associated Prompts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Associated Prompts ({groupDetail.prompts.length} prompts)
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    These prompts will be applied to all records in this group during task execution
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {groupDetail.prompts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {groupDetail.prompts.map((prompt) => (
                          <div key={prompt.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900">{prompt.name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {prompt.category}
                                </Badge>
                              </div>
                              <span className="text-xs text-gray-500">
                                ID: {prompt.id}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p className="max-h-16 overflow-hidden">
                                {prompt.content.length > 150 
                                  ? `${prompt.content.substring(0, 150)}...`
                                  : prompt.content
                                }
                              </p>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Created: {new Date(prompt.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No prompts associated with this group</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Use the prompt management dialog to add prompts
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Plain Knowledge (Records) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Plain Knowledge ({groupDetail.records.length} records)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {groupDetail.records.length > 0 ? (
                      groupDetail.records.map((record) => (
                        <div key={record.id} className="border rounded p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{record.title}</h4>
                            <div className="flex gap-2">
                              {record.file_type && (
                                <Badge variant="outline" className="text-xs">
                                  {record.file_type}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                {new Date(record.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{record.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No records found</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Generated Knowledge */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Generated Knowledge ({groupDetail.knowledge.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {groupDetail.knowledge.length > 0 ? (
                      groupDetail.knowledge.map((knowledge) => (
                        <div key={knowledge.id} className="border rounded p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {knowledge.record_title}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {knowledge.prompt_name}
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(knowledge.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-xs font-medium text-gray-700">Q: </span>
                              <span className="text-sm">{knowledge.question}</span>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-700">A: </span>
                              <span className="text-sm text-gray-600">{knowledge.answer}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No generated knowledge found</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pending/Failed Tasks */}
              {groupDetail.pending_tasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Pending Tasks ({groupDetail.pending_tasks.length} items)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {groupDetail.pending_tasks.map((task) => (
                        <div key={task.id} className="border rounded p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {task.record_title}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {task.prompt_name}
                              </Badge>
                              <Badge 
                                variant={task.status === 'failed' ? 'destructive' : 'default'} 
                                className="text-xs"
                              >
                                {task.status}
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(task.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {task.error_message && (
                            <p className="text-sm text-red-600 mt-2">{task.error_message}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">Failed to load group details</p>
          )}
          
          <div className="flex justify-end pt-4">
            <Button onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Groups;
