import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Upload, FileText, Loader2, ArrowRight, Check, X } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function UploadPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [studySummary, setStudySummary] = useState({
    population_setting: '', sample_size: '', study_design: '',
    inclusion_criteria: '', exclusion_criteria: '', interventions: '',
    comparators: '', outcomes: '', effect_sizes: '', follow_up: '', conclusions: ''
  });

  useEffect(() => { fetchProject(); }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}`);
      setProject(response.data);
      if (response.data.study_summary) setStudySummary(response.data.study_summary);
    } catch { toast.error('Failed to load project'); navigate('/projects'); }
    finally { setLoading(false); }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const f = e.dataTransfer.files[0];
      if (f.type === 'application/pdf' || f.type === 'text/plain') setFile(f);
      else toast.error('Please upload a PDF or text file');
    }
  }, []);

  const handleUpload = async () => {
    if (!file && !textContent.trim()) { toast.error('Please upload a file or paste text'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (textContent.trim()) formData.append('text_content', textContent);
      const response = await axios.post(`${API}/agents/parse-report/${projectId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setStudySummary(response.data.study_summary);
      toast.success('Report parsed successfully!');
      fetchProject();
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to parse report'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/projects/${projectId}`, { study_summary: studySummary, status: 'summary_ready' });
      toast.success('Study summary saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleProceed = async () => { await handleSave(); navigate(`/project/${projectId}/search`); };
  const updateField = (field, value) => setStudySummary(prev => ({ ...prev, [field]: value }));

  if (loading) return (
    <div className="flex min-h-screen bg-background"><Sidebar />
      <main className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></main>
    </div>
  );

  const hasStudySummary = project?.study_summary && Object.values(project.study_summary).some(v => v);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>Projects</span><span>/</span><span className="text-foreground">{project?.title}</span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Upload & Study Summary</h1>
            <p className="text-muted-foreground mt-1">Upload your analysis report to extract the study summary</p>
          </div>

          <Card className="mb-8 animate-fade-in">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2"><Upload className="w-5 h-5" />Upload Report</CardTitle>
              <CardDescription>Upload a PDF or paste text from your HEOR/RWE analysis report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={`dropzone cursor-pointer ${dragActive ? 'active' : ''} ${file ? 'border-primary bg-secondary/30' : ''}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
              >
                <input id="file-input" type="file" accept=".pdf,.txt" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} className="hidden" />
                {file ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="font-medium text-foreground mb-1">Drop your report here or click to browse</p>
                    <p className="text-sm text-muted-foreground">Supports PDF and TXT files</p>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Separator className="flex-1" /><span className="text-sm text-muted-foreground">OR</span><Separator className="flex-1" />
              </div>

              <div className="space-y-2">
                <Label>Paste Report Text</Label>
                <Textarea placeholder="Paste your analysis report text here..." value={textContent}
                  onChange={(e) => setTextContent(e.target.value)} rows={6} className="font-mono text-sm" />
              </div>

              <Button onClick={handleUpload} disabled={uploading || (!file && !textContent.trim())} className="w-full rounded-full">
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Parsing with AI...</>
                  : <><FileText className="w-4 h-4 mr-2" />Parse Report</>}
              </Button>
            </CardContent>
          </Card>

          <Card className="animate-fade-in stagger-1">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Check className="w-5 h-5" />Study Summary
                {hasStudySummary && <span className="ml-2 text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-full">Extracted</span>}
              </CardTitle>
              <CardDescription>Review and edit the extracted study information before proceeding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: 'population_setting', label: 'Population & Setting', rows: 3, placeholder: 'Description of study population and setting...' },
                  { key: 'sample_size', label: 'Sample Size', rows: 1, placeholder: 'e.g., 10,234 patients' },
                  { key: 'study_design', label: 'Study Design', rows: 1, placeholder: 'e.g., Retrospective cohort study' },
                  { key: 'follow_up', label: 'Follow-up Period', rows: 1, placeholder: 'e.g., 2 years' },
                  { key: 'inclusion_criteria', label: 'Inclusion Criteria', rows: 2, placeholder: 'Patient inclusion criteria...', full: true },
                  { key: 'exclusion_criteria', label: 'Exclusion Criteria', rows: 2, placeholder: 'Patient exclusion criteria...', full: true },
                  { key: 'interventions', label: 'Intervention(s) / Exposure(s)', rows: 3, placeholder: 'Intervention or exposure studied...' },
                  { key: 'comparators', label: 'Comparator(s)', rows: 3, placeholder: 'Comparator groups...' },
                  { key: 'outcomes', label: 'Outcomes', rows: 3, placeholder: 'Primary and secondary outcomes...', full: true },
                  { key: 'effect_sizes', label: 'Effect Sizes & Confidence Intervals', rows: 3, placeholder: 'HR, OR, RR with 95% CI...', full: true },
                  { key: 'conclusions', label: 'Key Conclusions', rows: 3, placeholder: 'Main findings and conclusions...', full: true },
                ].map(({ key, label, rows, placeholder, full }) => (
                  <div key={key} className={`space-y-2 ${full ? 'md:col-span-2' : ''}`}>
                    <Label>{label}</Label>
                    {rows === 1
                      ? <Input value={studySummary[key] || ''} onChange={(e) => updateField(key, e.target.value)} placeholder={placeholder} />
                      : <Textarea value={studySummary[key] || ''} onChange={(e) => updateField(key, e.target.value)} placeholder={placeholder} rows={rows} />
                    }
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleSave} disabled={saving} className="rounded-full">
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save Progress
                </Button>
                <Button onClick={handleProceed} disabled={saving || !Object.values(studySummary).some(v => v)} className="flex-1 rounded-full">
                  Confirm & Search Literature<ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
