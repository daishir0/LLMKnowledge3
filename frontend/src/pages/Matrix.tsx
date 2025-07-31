import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { matrixAPI, groupsAPI } from '../lib/api';
import { KnowledgeMatrix, Group } from '../types';
import { toast } from 'sonner';
import { Grid3X3, Download, Search, Filter } from 'lucide-react';

const Matrix: React.FC = () => {
  const [matrix, setMatrix] = useState<KnowledgeMatrix | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMatrix();
    fetchGroups();
  }, []);

  const fetchMatrix = async () => {
    try {
      const response = await matrixAPI.get(selectedGroups && selectedGroups !== 'all' ? selectedGroups : undefined);
      setMatrix(response.data);
    } catch (error) {
      toast.error('Failed to fetch knowledge matrix');
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
      fetchMatrix();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [selectedGroups]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const response = await matrixAPI.exportExcel(selectedGroups && selectedGroups !== 'all' ? selectedGroups : undefined);
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `knowledge_matrix_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Knowledge matrix exported successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to export knowledge matrix');
    } finally {
      setExporting(false);
    }
  };

  const filteredItems = matrix?.items.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.group_name.toLowerCase().includes(searchLower) ||
      item.record_title.toLowerCase().includes(searchLower) ||
      item.prompt_name.toLowerCase().includes(searchLower) ||
      item.question.toLowerCase().includes(searchLower) ||
      item.answer.toLowerCase().includes(searchLower)
    );
  }) || [];

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
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Matrix</h1>
          <p className="text-gray-600">View and export your knowledge matrix</p>
        </div>
        <Button onClick={handleExportExcel} disabled={exporting || !matrix?.items.length}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export Excel'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search knowledge matrix..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedGroups} onValueChange={setSelectedGroups}>
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

      {/* Summary Stats */}
      {matrix && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Knowledge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matrix.total_count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredItems.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unique Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(filteredItems.map(item => item.group_name)).size}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Knowledge Matrix Table */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Grid3X3 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {matrix?.total_count === 0 
                ? 'No knowledge generated yet' 
                : 'No knowledge matches your search'
              }
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {matrix?.total_count === 0
                ? 'Create groups with records and prompts, then execute tasks to generate knowledge.'
                : 'Try adjusting your search terms or filters.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Grid3X3 className="mr-2 h-5 w-5" />
              Knowledge Matrix
            </CardTitle>
            <CardDescription>
              Showing {filteredItems.length} of {matrix?.total_count} knowledge entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group</TableHead>
                    <TableHead>Record</TableHead>
                    <TableHead>Prompt</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Answer</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {item.group_name}
                      </TableCell>
                      <TableCell>{item.record_title}</TableCell>
                      <TableCell>{item.prompt_name}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={item.question}>
                          {item.question}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={item.answer}>
                          {item.answer}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Matrix;
