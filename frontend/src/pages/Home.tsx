import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  FileText, 
  Database, 
  Brain, 
  CheckSquare, 
  Grid3X3,
  ArrowRight,
  Play,
  Upload,
  MessageSquare,
  Lightbulb,
  Target
} from 'lucide-react';

const Home: React.FC = () => {
  const steps = [
    {
      number: '1',
      title: 'Create Groups',
      description: 'Create groups to organize related documents together',
      icon: Users,
      color: 'bg-blue-500',
      href: '/groups'
    },
    {
      number: '2', 
      title: 'Prepare Prompts',
      description: 'Set up what questions you want to ask the AI in advance',
      icon: MessageSquare,
      color: 'bg-green-500',
      href: '/prompts'
    },
    {
      number: '3',
      title: 'Upload Plain Knowledge',
      description: 'Upload PDF or text files to the system',
      icon: Upload,
      color: 'bg-purple-500',
      href: '/records'
    },
    {
      number: '4',
      title: 'Execute Tasks',
      description: 'AI reads your documents and answers your questions',
      icon: Play,
      color: 'bg-orange-500',
      href: '/tasks'
    },
    {
      number: '5',
      title: 'Utilize Knowledge',
      description: 'Search and utilize the generated knowledge',
      icon: Lightbulb,
      color: 'bg-yellow-500',
      href: '/knowledge'
    }
  ];

  const features = [
    {
      icon: Database,
      title: 'Plain Knowledge Management',
      description: 'Easily upload and manage PDF or text files',
      href: '/records'
    },
    {
      icon: Brain,
      title: 'AI Knowledge Generation',
      description: 'AI automatically extracts and generates knowledge from uploaded documents',
      href: '/knowledge'
    },
    {
      icon: Grid3X3,
      title: 'Knowledge Matrix',
      description: 'Visualize generated knowledge in matrix format',
      href: '/matrix'
    },
    {
      icon: CheckSquare,
      title: 'Task Management',
      description: 'Monitor AI processing progress in real-time',
      href: '/tasks'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to LLMKnowledge3
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          AI-powered knowledge management system that automatically extracts valuable insights from your documents.
          <br />
          Achieve efficient information management with simple operations.
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/groups">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Target className="mr-2 h-5 w-5" />
              Get Started
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline">
              View Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Getting Started Steps */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Get Started in 5 Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.number} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`${step.color} p-3 rounded-full text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <Badge variant="secondary" className="w-8 h-8 rounded-full mx-auto mb-2">
                    {step.number}
                  </Badge>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 text-sm">
                    {step.description}
                  </CardDescription>
                  <Link to={step.href}>
                    <Button variant="outline" size="sm" className="w-full">
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="h-6 w-6 text-gray-700" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {feature.description}
                  </CardDescription>
                  <Link to={feature.href}>
                    <Button variant="ghost" size="sm">
                      Try it out →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Usage Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-center">Basic Usage Flow</CardTitle>
          <CardDescription className="text-center">
            Easy to get started, even for beginners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">1. Create Groups</h3>
                <p className="text-gray-600">
                  First, create groups to organize related documents together.
                  Examples: "Project A", "Technical Documents", "Meeting Minutes", etc.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 p-2 rounded-full">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">2. Configure Prompts</h3>
                <p className="text-gray-600">
                  Set up what questions you want to ask the AI in advance.
                  Examples: "Summarize key points", "Extract risks", "What are the action items?"
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 p-2 rounded-full">
                <Database className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">3. Upload Plain Knowledge</h3>
                <p className="text-gray-600">
                  Upload PDF or text files and assign them to the created groups.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 p-2 rounded-full">
                <CheckSquare className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">4. Execute AI Processing</h3>
                <p className="text-gray-600">
                  Click "Execute Tasks" from the Groups page to start AI knowledge extraction.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-yellow-100 p-2 rounded-full">
                <Brain className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold">5. Review & Utilize Results</h3>
                <p className="text-gray-600">
                  Check the generated knowledge on the "Knowledge" page and visualize it on the "Matrix" page.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start CTA */}
      <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <CardContent className="py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-blue-100 mb-6">
            Let's create your first group and upload your first document
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/groups">
              <Button size="lg" variant="secondary">
                <Users className="mr-2 h-5 w-5" />
                Create a Group
              </Button>
            </Link>
            <Link to="/prompts">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-indigo-600">
                <MessageSquare className="mr-2 h-5 w-5" />
                Configure Prompts
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;