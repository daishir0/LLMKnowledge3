import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { knowledgeAPI, recordsAPI, promptsAPI } from '../lib/api';
import { Knowledge, Record, Prompt } from '../types';
import { toast } from 'sonner';
import { Brain, Search, Eye, Trash2, MessageSquare, FileText } from 'lucide-react';

const KnowledgePage: React.FC = () => {
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingKnowledge, setViewingKnowledge] = useState<Knowledge | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<string>('all');
  const [selectedPrompt, setSelectedPrompt] = useState<string>('all');

  useEffect(() => {
    fetchKnowledge();
    fetchRecords();
    fetchPrompts();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const response = await knowledgeAPI.list({
        search: searchTerm || undefined,
        record_id: selectedRecord && selectedRecord !== 'all' ? parseInt(selectedRecord) : undefined,
        prompt_id: selectedPrompt && selectedPrompt !== 'all' ? parseInt(selectedPrompt) : undefined,
      });
      setKnowledge(response.data);
    } catch (error) {
      toast.error('Failed to fetch knowledge');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const response = await recordsAPI.list();
      setRecords(response.data);
    } catch (error) {
      toast.error('Failed to fetch records');
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

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchKnowledge();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedRecord, selectedPrompt]);

  const handleView = (item: Knowledge) => {
    setViewingKnowledge(item);
    setViewDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this knowledge?')) return;
    
    try {
      await knowledgeAPI.delete(id);
      toast.success('Knowledge deleted successfully');
      fetchKnowledge();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete knowledge');
    }
  };

  const getRecordTitle = (recordId: number) => {
    const record = records.find(r => r.id === recordId);
    return record?.title || 'Unknown Record';
  };

  const getPromptName = (promptId: number) => {
    const prompt = prompts.find(p => p.id === promptId);
    return prompt?.name || 'Unknown Prompt';
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
          <h1 className="text-2xl font-bold text-gray-900">Knowledge</h1>
          <p className="text-gray-600">AI-generated knowledge from your records and prompts</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search knowledge..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedRecord} onValueChange={setSelectedRecord}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All records" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All records</SelectItem>
            {records.map((record) => (
              <SelectItem key={record.id} value={record.id.toString()}>
                {record.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedPrompt} onValueChange={setSelectedPrompt}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All prompts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All prompts</SelectItem>
            {prompts.map((prompt) => (
              <SelectItem key={prompt.id} value={prompt.id.toString()}>
                {prompt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {knowledge.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || (selectedRecord && selectedRecord !== 'all') || (selectedPrompt && selectedPrompt !== 'all')
                ? 'No knowledge matches your search' 
                : 'No knowledge generated yet'
              }
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {searchTerm || (selectedRecord && selectedRecord !== 'all') || (selectedPrompt && selectedPrompt !== 'all')
                ? 'Try adjusting your search terms or filters.'
                : 'Create groups with records and prompts, then execute tasks to generate knowledge.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {knowledge.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      {item.question}
                    </CardTitle>
                    <div className="flex space-x-2 mt-2">
                      <Badge variant="outline">
                        <FileText className="mr-1 h-3 w-3" />
                        {getRecordTitle(item.record_id)}
                      </Badge>
                      <Badge variant="secondary">
                        {getPromptName(item.prompt_id)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 line-clamp-3">
                    {item.answer}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Generated: {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Knowledge Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              {viewingKnowledge?.question}
            </DialogTitle>
            <DialogDescription>
              <div className="flex space-x-2 mt-2">
                <Badge variant="outline">
                  <FileText className="mr-1 h-3 w-3" />
                  {viewingKnowledge && getRecordTitle(viewingKnowledge.record_id)}
                </Badge>
                <Badge variant="secondary">
                  {viewingKnowledge && getPromptName(viewingKnowledge.prompt_id)}
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Answer:</h4>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm">
                  {viewingKnowledge?.answer}
                </pre>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Generated: {viewingKnowledge && new Date(viewingKnowledge.created_at).toLocaleString()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgePage;
