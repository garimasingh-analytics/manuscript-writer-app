import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Plus, FolderOpen, Loader2, Trash2, Clock, ArrowRight } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusColors = {
  draft: 'bg-muted text-muted-foreground',
  summary_ready: 'bg-blue-100 text-blue-700',
  search_done: 'bg-amber-100 text-amber-700',
  manuscript_ready: 'bg-green-100 text-green-700'
};

const statusLabels = {
  draft: 'Draft',
  summary_ready: 'Summary Ready',
  search_done: 'Search Complete',
  manuscript_ready: 'Manuscript Ready'
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!newProject.title.trim()) { toast.error('Please enter a project title'); return; }
    setCreating(true);
    try {
      const response = await axios.post(`${API}/projects`, newProject);
      toast.success('Project created!');
      setCreateOpen(false);
      setNewProject({ title: '', description: '' });
      navigate(`/project/${response.data.id}/upload`);
    } catch { toast.error('Failed to create project'); }
    finally { setCreating(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/projects/${deleteId}`);
      toast.success('Project deleted');
      setProjects(projects.filter(p => p.id !== deleteId));
    } catch { toast.error('Failed to delete project'); }
    finally { setDeleteId(null); }
  };

  const getNextStep = (project) => {
    switch (project.status) {
      case 'draft': return { label: 'Upload Report', path: `/project/${project.id}/upload` };
      case 'summary_ready': return { label: 'Search Literature', path: `/project/${project.id}/search` };
      case 'search_done': return { label: 'Draft Manuscript', path: `/project/${project.id}/manuscript` };
      case 'manuscript_ready': return { label: 'View Manuscript', path: `/project/${project.id}/manuscript` };
      default: return { label: 'Continue', path: `/project/${project.id}/upload` };
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Projects</h1>
              <p className="text-muted-foreground mt-1">Manage your research manuscripts</p>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full gap-2"><Plus className="w-4 h-4" />New Project</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">Create New Project</DialogTitle>
                  <DialogDescription>Start a new research manuscript project</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Project Title</Label>
                    <Input id="title" placeholder="e.g., Diabetes Treatment Outcomes Study"
                      value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea id="description" placeholder="Brief description..."
                      value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={creating} className="rounded-full">
                    {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Create Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                  <FolderOpen className="w-10 h-10 text-secondary-foreground" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-6">
                  Create your first project to start writing AI-assisted research manuscripts
                </p>
                <Button onClick={() => setCreateOpen(true)} className="rounded-full gap-2">
                  <Plus className="w-4 h-4" />Create Your First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => {
                const nextStep = getNextStep(project);
                return (
                  <Card key={project.id} className="card-hover animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Badge variant="secondary" className={statusColors[project.status]}>
                          {statusLabels[project.status]}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteId(project.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <CardTitle className="font-heading text-lg mt-2 line-clamp-2">{project.title}</CardTitle>
                      {project.description && <CardDescription className="line-clamp-2">{project.description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(project.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-1 mb-4">
                        <div className={`h-1 flex-1 rounded-full ${project.status !== 'draft' ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`h-1 flex-1 rounded-full ${['search_done', 'manuscript_ready'].includes(project.status) ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`h-1 flex-1 rounded-full ${project.status === 'manuscript_ready' ? 'bg-primary' : 'bg-muted'}`} />
                      </div>
                      <Button variant="secondary" className="w-full rounded-full gap-2" onClick={() => navigate(nextStep.path)}>
                        {nextStep.label}<ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. All project data will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
