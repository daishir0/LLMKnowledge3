import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { promptsAPI } from '../lib/api';
import { Prompt } from '../types';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, FileText, Search } from 'lucide-react';

const Prompts: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: '',
  });

  const categories = [
    'Summary',
    'Analysis',
    'Evaluation',
    'Extraction',
    'Transformation',
    'Classification',
    'Other',
  ];

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await promptsAPI.list({
        search: searchTerm || undefined,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
      });
      setPrompts(response.data);
    } catch (error) {
      toast.error('Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchPrompts();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPrompt) {
        await promptsAPI.update(editingPrompt.id, formData);
        toast.success('Prompt updated successfully');
      } else {
        await promptsAPI.create(formData);
        toast.success('Prompt created successfully');
      }
      setDialogOpen(false);
      setEditingPrompt(null);
      setFormData({ name: '', content: '', category: '' });
      fetchPrompts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save prompt');
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      content: prompt.content,
      category: prompt.category || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    
    try {
      await promptsAPI.delete(id);
      toast.success('Prompt deleted successfully');
      fetchPrompts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete prompt');
    }
  };

  const openCreateDialog = () => {
    setEditingPrompt(null);
    setFormData({ name: '', content: '', category: '' });
    setDialogOpen(true);
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = !searchTerm || 
      prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Prompts</h1>
          <p className="text-gray-600">Create and manage AI prompts for knowledge generation</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
              </DialogTitle>
              <DialogDescription>
                {editingPrompt 
                  ? 'Update the prompt information below.'
                  : 'Create a new prompt for AI knowledge generation.'
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
                  placeholder="Enter prompt name"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
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
                  placeholder="Enter the prompt content..."
                  rows={8}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPrompt ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredPrompts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {prompts.length === 0 ? 'No prompts yet' : 'No prompts match your search'}
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {prompts.length === 0 
                ? 'Create your first prompt to start generating knowledge from your records.'
                : 'Try adjusting your search terms or filters.'
              }
            </p>
            {prompts.length === 0 && (
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Prompt
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
            <Card key={prompt.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{prompt.name}</CardTitle>
                    {prompt.category && (
                      <Badge variant="secondary" className="mt-2">
                        {prompt.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(prompt)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(prompt.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 line-clamp-3">
                    {prompt.content}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Created: {new Date(prompt.created_at).toLocaleDateString()}
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

export default Prompts;
