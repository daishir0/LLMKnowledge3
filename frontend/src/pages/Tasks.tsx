import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { tasksAPI, recordsAPI, promptsAPI } from '../lib/api';
import { Task, TaskStatus, Record, Prompt } from '../types';
import { toast } from 'sonner';
import { CheckSquare, Clock, Play, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchTasks();
    fetchTaskStatus();
    fetchRecords();
    fetchPrompts();
    
    const interval = setInterval(() => {
      fetchTaskStatus();
      if (selectedStatus === 'processing' || selectedStatus === 'pending') {
        fetchTasks();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await tasksAPI.list({
        status: selectedStatus && selectedStatus !== 'all' ? selectedStatus : undefined,
      });
      setTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskStatus = async () => {
    try {
      const response = await tasksAPI.getStatus();
      setTaskStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch task status:', error);
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
    fetchTasks();
  }, [selectedStatus]);

  const handleCancelTask = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this task?')) return;
    
    try {
      await tasksAPI.cancel(id);
      toast.success('Task cancelled successfully');
      fetchTasks();
      fetchTaskStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to cancel task');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Loader className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Monitor AI processing tasks and their status</p>
        </div>
      </div>

      {/* Task Status Overview */}
      {taskStatus && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskStatus.pending_tasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskStatus.processing_tasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskStatus.completed_tasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskStatus.failed_tasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskStatus.total_tasks}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Bar */}
      {taskStatus && taskStatus.total_tasks > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overall Progress</CardTitle>
            <CardDescription>
              {taskStatus.completed_tasks} of {taskStatus.total_tasks} tasks completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress 
              value={(taskStatus.completed_tasks / taskStatus.total_tasks) * 100} 
              className="w-full"
            />
            <div className="text-sm text-gray-600 mt-2">
              {Math.round((taskStatus.completed_tasks / taskStatus.total_tasks) * 100)}% complete
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex space-x-4">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedStatus ? `No ${selectedStatus} tasks` : 'No tasks yet'}
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {selectedStatus 
                ? `There are no tasks with ${selectedStatus} status.`
                : 'Create groups with records and prompts, then execute tasks to start processing.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center">
                      {getStatusIcon(task.status)}
                      <span className="ml-2">Task #{task.id}</span>
                      <Badge className={`ml-2 ${getStatusColor(task.status)}`}>
                        {task.status}
                      </Badge>
                    </CardTitle>
                    <div className="flex space-x-2 mt-2">
                      <Badge variant="outline">
                        {getRecordTitle(task.record_id)}
                      </Badge>
                      <Badge variant="secondary">
                        {getPromptName(task.prompt_id)}
                      </Badge>
                      {task.ai_provider && (
                        <Badge variant="outline">
                          {task.ai_provider} - {task.ai_model}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {(task.status === 'pending' || task.status === 'processing') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelTask(task.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    Type: {task.type}
                  </div>
                  
                  {task.error_message && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      Error: {task.error_message}
                    </div>
                  )}
                  
                  {task.result_knowledge_id && (
                    <div className="text-sm text-green-600">
                      Generated knowledge ID: {task.result_knowledge_id}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Created: {new Date(task.created_at).toLocaleString()}
                    {task.updated_at !== task.created_at && (
                      <span className="ml-2">
                        Updated: {new Date(task.updated_at).toLocaleString()}
                      </span>
                    )}
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

export default Tasks;
