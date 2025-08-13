import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { matrixAPI, groupsAPI } from '../lib/api';
import { Group, Matrix as MatrixType, MatrixExportData } from '../types';
import { toast } from 'sonner';
import { Grid3X3, Download, Search, Plus, Edit, Trash2, Eye } from 'lucide-react';

const Matrix: React.FC = () => {
  
  // ステート管理
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // マトリックス定義用のステート
  const [matrixDefinitions, setMatrixDefinitions] = useState<MatrixType[]>([]);
  const [selectedMatrix, setSelectedMatrix] = useState<number | null>(null);
  const [matrixData, setMatrixData] = useState<MatrixExportData | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMatrix, setEditingMatrix] = useState<MatrixType | null>(null);
  const [includePlainKnowledge, setIncludePlainKnowledge] = useState(false);
  
  // フォーム用のステート
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedGroupIds: [] as number[]
  });

  useEffect(() => {
    fetchMatrixDefinitions();
    fetchGroups();
  }, []);

  const fetchMatrixDefinitions = async () => {
    try {
      const response = await matrixAPI.getDefinitions();
      console.log('Matrix definitions response:', response.data);
      setMatrixDefinitions(response.data);
    } catch (error) {
      console.error('Error fetching matrix definitions:', error);
      toast.error('Failed to fetch matrix definitions');
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

  const fetchMatrixData = async (matrixId: number) => {
    try {
      setLoading(true);
      const response = await matrixAPI.viewMatrix(matrixId, includePlainKnowledge);
      console.log('Matrix data response:', response.data);
      console.log('includePlainKnowledge:', includePlainKnowledge);
      console.log('plain_knowledge exists:', !!response.data.plain_knowledge);
      setMatrixData(response.data);
      setSelectedMatrix(matrixId);
    } catch (error) {
      toast.error('Failed to fetch matrix data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatrix = async () => {
    if (!formData.name || formData.selectedGroupIds.length === 0) {
      toast.error('Please enter matrix name and select at least one group');
      return;
    }

    try {
      await matrixAPI.createDefinition({
        name: formData.name,
        description: formData.description,
        group_ids: formData.selectedGroupIds.join(',')
      });
      
      toast.success('Matrix definition created successfully');
      setShowCreateDialog(false);
      resetForm();
      fetchMatrixDefinitions();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create matrix definition');
    }
  };

  const handleUpdateMatrix = async () => {
    if (!editingMatrix || !formData.name || formData.selectedGroupIds.length === 0) {
      toast.error('Please enter matrix name and select at least one group');
      return;
    }

    try {
      await matrixAPI.updateDefinition(editingMatrix.id, {
        name: formData.name,
        description: formData.description,
        group_ids: formData.selectedGroupIds.join(',')
      });
      
      toast.success('Matrix definition updated successfully');
      setShowEditDialog(false);
      resetForm();
      fetchMatrixDefinitions();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update matrix definition');
    }
  };

  const handleDeleteMatrix = async (matrixId: number) => {
    if (!confirm('Are you sure you want to delete this matrix definition?')) {
      return;
    }

    try {
      await matrixAPI.deleteDefinition(matrixId);
      toast.success('Matrix definition deleted successfully');
      fetchMatrixDefinitions();
      
      // 削除されたマトリックスが選択されていた場合はクリア
      if (selectedMatrix === matrixId) {
        setSelectedMatrix(null);
        setMatrixData(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete matrix definition');
    }
  };

  const handleExportExcel = async (matrixId: number) => {
    setExporting(true);
    try {
      const response = await matrixAPI.exportMatrixExcel(matrixId, includePlainKnowledge);
      
      const matrixDef = matrixDefinitions.find(m => m.id === matrixId);
      const filename = `${matrixDef?.name || 'matrix'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      selectedGroupIds: []
    });
    setEditingMatrix(null);
  };

  const openEditDialog = (matrix: MatrixType) => {
    setEditingMatrix(matrix);
    setFormData({
      name: matrix.name,
      description: matrix.description || '',
      selectedGroupIds: matrix.group_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    });
    setShowEditDialog(true);
  };

  const handleGroupToggle = (groupId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedGroupIds: checked
        ? [...prev.selectedGroupIds, groupId]
        : prev.selectedGroupIds.filter(id => id !== groupId)
    }));
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
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Matrix</h1>
          <p className="text-gray-600">Manage matrix definitions and view knowledge matrices</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Matrix
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Matrix Definition</DialogTitle>
              <DialogDescription>
                Define which groups should be combined into a knowledge matrix
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Matrix Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter matrix name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description"
                />
              </div>
              <div className="grid gap-2">
                <Label>Select Groups</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                  {groups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2 py-2">
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={formData.selectedGroupIds.includes(group.id)}
                        onCheckedChange={(checked) => handleGroupToggle(group.id, !!checked)}
                      />
                      <Label htmlFor={`group-${group.id}`} className="flex-1">
                        {group.name}
                        {group.description && (
                          <span className="text-sm text-gray-500 block">{group.description}</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMatrix}>Create Matrix</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Matrix Definition</DialogTitle>
            <DialogDescription>
              Update the matrix definition settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Matrix Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter matrix name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
              />
            </div>
            <div className="grid gap-2">
              <Label>Select Groups</Label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center space-x-2 py-2">
                    <Checkbox
                      id={`edit-group-${group.id}`}
                      checked={formData.selectedGroupIds.includes(group.id)}
                      onCheckedChange={(checked) => handleGroupToggle(group.id, !!checked)}
                    />
                    <Label htmlFor={`edit-group-${group.id}`} className="flex-1">
                      {group.name}
                      {group.description && (
                        <span className="text-sm text-gray-500 block">{group.description}</span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMatrix}>Update Matrix</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Matrix Definitions */}
      <Card>
        <CardHeader>
          <CardTitle>Matrix Definitions</CardTitle>
          <CardDescription>
            Manage your knowledge matrix definitions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {matrixDefinitions.length === 0 ? (
            <div className="text-center py-8">
              <Grid3X3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matrix definitions yet</h3>
              <p className="text-gray-600 mb-4">Create a matrix definition to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matrixDefinitions.map((matrix) => (
                <div key={matrix.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{matrix.name}</h3>
                      {matrix.description && (
                        <p className="text-sm text-gray-600 mt-1">{matrix.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        Groups: {matrix.group_ids.split(',').map(id => {
                          const group = groups.find(g => g.id === parseInt(id.trim()));
                          return group?.name;
                        }).filter(Boolean).join(', ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(matrix.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchMatrixData(matrix.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(matrix)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportExcel(matrix.id)}
                        disabled={exporting}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteMatrix(matrix.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matrix Display */}
      {matrixData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Grid3X3 className="mr-2 h-5 w-5" />
                {matrixData.matrix_name} - Knowledge Matrix
              </span>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-plain"
                    checked={includePlainKnowledge}
                    onCheckedChange={async (checked) => {
                      console.log('Checkbox changed:', checked);
                      setIncludePlainKnowledge(!!checked);
                      if (selectedMatrix) {
                        // ステート更新後にfetchを実行するため、直接パラメータを渡す
                        try {
                          setLoading(true);
                          const response = await matrixAPI.viewMatrix(selectedMatrix, !!checked);
                          console.log('Matrix data response with checkbox:', response.data);
                          console.log('includePlainKnowledge after change:', !!checked);
                          console.log('plain_knowledge exists after change:', !!response.data.plain_knowledge);
                          setMatrixData(response.data);
                        } catch (error) {
                          toast.error('Failed to fetch matrix data');
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                  />
                  <Label htmlFor="include-plain" className="text-sm">
                    Include plain knowledge
                  </Label>
                </div>
                <Button
                  size="sm"
                  onClick={() => selectedMatrix && handleExportExcel(selectedMatrix)}
                  disabled={exporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Plain Knowledge: {matrixData.records.length}, Prompts: {matrixData.prompts.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto" style={{ maxHeight: '70vh', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <Table className="matrix-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky-column bg-white w-48 min-w-48 border-r-2 border-gray-200 font-semibold">
                      Plain Knowledge Title
                    </TableHead>
                    {matrixData.prompts.map((prompt, index) => (
                      <TableHead 
                        key={prompt} 
                        className="bg-white min-w-64 px-4 font-semibold border-r border-gray-100"
                        style={{
                          borderRight: index === matrixData.prompts.length - 1 && (!includePlainKnowledge || !matrixData.plain_knowledge) ? 'none' : undefined
                        }}
                      >
                        <div className="truncate" title={prompt}>
                          {prompt}
                        </div>
                      </TableHead>
                    ))}
                    {includePlainKnowledge && matrixData.plain_knowledge && (
                      <TableHead className="bg-white min-w-64 px-4 font-semibold">
                        元テキスト
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrixData.records.map((recordTitle, recordIndex) => (
                    <TableRow 
                      key={recordTitle}
                      className={recordIndex % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}
                    >
                      <TableCell className="sticky-column bg-white font-medium w-48 min-w-48 border-r-2 border-gray-200 px-4">
                        <div className="truncate" title={recordTitle}>
                          {recordTitle}
                        </div>
                      </TableCell>
                      {matrixData.prompts.map((prompt, index) => (
                        <TableCell 
                          key={`${recordTitle}-${prompt}`} 
                          className="min-w-64 max-w-64 px-4 border-r border-gray-100 align-top" 
                          style={{
                            backgroundColor: recordIndex % 2 === 0 ? '#f9fafb' : '#ffffff',
                            borderRight: index === matrixData.prompts.length - 1 && (!includePlainKnowledge || !matrixData.plain_knowledge) ? 'none' : undefined
                          }}
                        >
                          <div 
                            className="cell-content whitespace-pre-wrap text-sm leading-relaxed overflow-hidden"
                            style={{
                              maxHeight: '200px',
                              overflowY: 'auto'
                            }}
                            title={matrixData.knowledge_data[recordTitle]?.[prompt] || ''}
                          >
                            {matrixData.knowledge_data[recordTitle]?.[prompt] || ''}
                          </div>
                        </TableCell>
                      ))}
                      {includePlainKnowledge && matrixData.plain_knowledge && (
                        <TableCell 
                          className="min-w-64 max-w-64 px-4 align-top"
                          style={{
                            backgroundColor: recordIndex % 2 === 0 ? '#f9fafb' : '#ffffff'
                          }}
                        >
                          <div 
                            className="cell-content whitespace-pre-wrap text-sm leading-relaxed overflow-hidden"
                            style={{
                              maxHeight: '200px',
                              overflowY: 'auto'
                            }}
                            title={matrixData.plain_knowledge[recordTitle] || ''}
                          >
                            {matrixData.plain_knowledge[recordTitle] || ''}
                          </div>
                        </TableCell>
                      )}
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