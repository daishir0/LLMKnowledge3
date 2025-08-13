import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { groupsAPI, tasksAPI, matrixAPI } from '../lib/api';
import { Group, TaskStatus } from '../types';
import { Users, FileText, Brain, CheckSquare, Grid3X3, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    groups: 0,
    records: 0,
    knowledge: 0,
    tasks: 0,
  });
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [recentGroups, setRecentGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [groupsRes, tasksRes, taskStatusRes] = await Promise.all([
          groupsAPI.list({ limit: 5 }),
          tasksAPI.list({ limit: 10 }),
          tasksAPI.getStatus(),
        ]);

        setRecentGroups(groupsRes.data);
        setTaskStatus(taskStatusRes.data);
        
        setStats({
          groups: groupsRes.data.length,
          records: 0, // Will be updated with actual count
          knowledge: 0, // Will be updated with actual count
          tasks: tasksRes.data.length,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Groups',
      value: stats.groups,
      icon: Users,
      description: 'Active groups',
      href: '/groups',
    },
    {
      title: 'Plain Knowledge',
      value: stats.records,
      icon: FileText,
      description: 'Total plain knowledge',
      href: '/records',
    },
    {
      title: 'Knowledge',
      value: stats.knowledge,
      icon: Brain,
      description: 'Generated knowledge',
      href: '/knowledge',
    },
    {
      title: 'Tasks',
      value: taskStatus?.total_tasks || 0,
      icon: CheckSquare,
      description: 'Total tasks',
      href: '/tasks',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your knowledge management system.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                <Link to={stat.href}>
                  <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto">
                    View all →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Task Status */}
      {taskStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckSquare className="mr-2 h-5 w-5" />
              Task Status
            </CardTitle>
            <CardDescription>Current status of your AI processing tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {taskStatus.pending_tasks}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {taskStatus.processing_tasks}
                </div>
                <div className="text-sm text-gray-600">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {taskStatus.completed_tasks}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {taskStatus.failed_tasks}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {taskStatus.total_tasks}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Groups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Recent Groups
          </CardTitle>
          <CardDescription>Your recently created or updated groups</CardDescription>
        </CardHeader>
        <CardContent>
          {recentGroups.length > 0 ? (
            <div className="space-y-3">
              {recentGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h4 className="font-medium">{group.name}</h4>
                    {group.description && (
                      <p className="text-sm text-gray-600">{group.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {group.task_executed_at && (
                      <Badge variant="secondary">Processed</Badge>
                    )}
                    <Link to={`/groups`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No groups yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first group.
              </p>
              <Link to="/groups">
                <Button className="mt-4">Create Group</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/groups">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Create New Group
              </Button>
            </Link>
            <Link to="/prompts">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Add Prompt
              </Button>
            </Link>
            <Link to="/matrix">
              <Button variant="outline" className="w-full justify-start">
                <Grid3X3 className="mr-2 h-4 w-4" />
                View Knowledge Matrix
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* API Usage (for regular users) */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              API Usage
            </CardTitle>
            <CardDescription>Your current month's API usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {user.current_month_usage} / {user.monthly_api_limit}
                </div>
                <div className="text-sm text-gray-600">API calls this month</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {Math.round((user.current_month_usage / user.monthly_api_limit) * 100)}% used
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((user.current_month_usage / user.monthly_api_limit) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
