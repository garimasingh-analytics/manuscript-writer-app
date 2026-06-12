import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import {
  PenTool, Loader2, ArrowLeft, Download, Save, Sparkles, BookOpen,
  CheckCircle2, XCircle, HelpCircle, ExternalLink, Settings, ChevronDown, ChevronUp
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ManuscriptPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [activeSection, setActiveSection] = useState('abstract');
  const [showSettings, setShowSettings] = useState(false);
  const [wordCounts, setWordCounts] = useState({ abstract: 250, introduction: 400, methods: 350, results: 300, evidence_comparison: 300, discussion: 400, conclusion: 150 });
  const [manuscript, setManuscript] = useState({
    title: '', abstract: '', introduction: '', methods: '', results: '',
    evidence_comparison: '', discussion: '', conclusion: '',
    tables_figures: '', tables: [], figures: [], charts: [], references: [], reference_mapping: {}
  });

  useEffect(() => { fetchProject(); }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}`);
      setProject(response.data);
      if (response.data.manuscript) setManuscript(response.data.manuscript);
    } catch { toast.error('Failed to load project'); navigate('/projects'); }
    finally { setLoading(false); }
  };

  const pollForCompletion = async (jobId) => {
    const maxAttempts = 60;
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`${API}/agents/generation-status/${jobId}`);
        const { status, manuscript: result, error } = response.data;
        if (status === 'completed') { setManuscript(result); toast.success('Manuscript generated!'); return true; }
        if (status === 'failed') { toast.error(error || 'Generation failed'); return false; }
        await new Promise(r => setTimeout(r, 2000));
        attempts++;
      } catch {
        await new Promise(r => setTimeout(r, 2000));
        attempts++;
      }
    }
    toast.error('Generation timed out. Please try again.');
    return false;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(`${API}/agents/generate-manuscript/${projectId}`, { word_counts: wordCounts }, { params: { citation_style: 'endnote' } });
      toast.info('Generating manuscript... This may take up to a minute.');
      await pollForCompletion(response.data.job_id);
    } catch (error) {
      const detail = error.response?.data?.detail || 'Failed to start generation';
      if (detail.includes('No papers selected')) toast.error('Please select at least one paper from Literature Search first.');
      else if (detail.includes('Study summary required')) toast.error('Please upload and parse a report first.');
      else toast.error(detail);
    } finally { setGenerating(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/agents/manuscript/${projectId}`, manuscript);
      toast.success('Manuscript saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleExport = async (format) => {
    if (!hasManuscript) { toast.error('Please generate a manuscript first'); return; }
    setExporting(format);
    try {
      const response = await axios.get(`${API}/export/${format}/${projectId}`, { responseType: 'blob' });
      const extension = format === 'markdown' ? 'md' : format;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `manuscript_${projectId}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${format.toUpperCase()}`);
    } catch (error) { toast.error(error.response?.data?.detail || `Failed to export ${format}`); }
    finally { setExporting(null); }
  };

  const handleExportReferences = async (format) => {
    if (!hasManuscript) { toast.error('Please generate a manuscript first'); return; }
    setExporting(`refs-${format}`);
    try {
      const extension = format === 'endnote' ? 'enw' : format;
      const response = await axios.get(`${API}/export/references/${projectId}?format=${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `references_${projectId}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`References downloaded as ${format.toUpperCase()}`);
    } catch { toast.error('Failed to export references'); }
    finally { setExporting(null); }
  };

  const updateSection = (section, value) => setManuscript(prev => ({ ...prev, [section]: value }));

  const sections = [
    { id: 'abstract', label: 'Abstract' }, { id: 'introduction', label: 'Introduction' },
    { id: 'methods', label: 'Methods' }, { id: 'results', label: 'Results' },
    { id: 'evidence_comparison', label: 'Evidence Comparison' }, { id: 'discussion', label: 'Discussion' },
    { id: 'conclusion', label: 'Conclusion' }, { id: 'tables_figures', label: 'Tables & Figures' },
    { id: 'references', label: 'References' },
  ];

  const selectedPapers = project?.papers?.filter(p => p.selected) || [];
  const supportingPapers = selectedPapers.filter(p => p.classification === 'supporting');
  const contradictingPapers = selectedPapers.filter(p => p.classification === 'contradicting');
  const backgroundPapers = selectedPapers.filter(p => p.classification === 'background');
  const hasManuscript = manuscript.title || manuscript.abstract;

  if (loading) return (
    <div className="flex min-h-screen bg-background"><Sidebar />
      <main className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-xl px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <span>Projects</span><span>/</span><span>{project?.title}</span><span>/</span>
                  <span className="text-foreground">Manuscript</span>
                </div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Manuscript Drafting</h1>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate(`/project/${projectId}/search`)} className="rounded-full gap-2">
                  <ArrowLeft className="w-4 h-4" />Back
                </Button>
                <Button variant="outline" onClick={handleSave} disabled={saving || !hasManuscript} className="rounded-full gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
            {/* Left: Selected Papers */}
            <div className="col-span-3 border-r border-border bg-card/30 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border flex-shrink-0">
                <h3 className="font-heading font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />Selected Papers ({selectedPapers.length})
                </h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {[
                    { label: 'Supporting', papers: supportingPapers, offset: 0, color: 'bg-green-50 border-green-100', Icon: CheckCircle2, iconColor: 'text-green-600' },
                    { label: 'Contradicting', papers: contradictingPapers, offset: supportingPapers.length, color: 'bg-red-50 border-red-100', Icon: XCircle, iconColor: 'text-red-600' },
                    { label: 'Background', papers: backgroundPapers, offset: supportingPapers.length + contradictingPapers.length, color: 'bg-blue-50 border-blue-100', Icon: HelpCircle, iconColor: 'text-blue-600' },
                  ].map(({ label, papers: group, offset, color, Icon, iconColor }) => group.length > 0 && (
                    <div key={label}>
                      <p className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1`}>
                        <Icon className={`w-3 h-3 ${iconColor}`} />{label} ({group.length})
                      </p>
                      <div className="space-y-2">
                        {group.map((paper, i) => (
                          <div key={paper.id} className={`p-2 rounded-lg ${color} border`}>
                            <p className="text-sm font-medium text-foreground line-clamp-2">[{offset + i + 1}] {paper.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{paper.authors?.split(',')[0]} et al., {paper.year}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Word Count Settings */}
              <div className="border-t border-border flex-shrink-0">
                <button onClick={() => setShowSettings(!showSettings)}
                  className="w-full p-3 flex items-center justify-between text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                  <span className="flex items-center gap-2"><Settings className="w-4 h-4" />Word Count Settings</span>
                  {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showSettings && (
                  <div className="p-3 pt-0 space-y-2 bg-muted/20">
                    {Object.entries(wordCounts).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground capitalize">{key.replace('_', ' ')}</label>
                        <select value={val} onChange={(e) => setWordCounts(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                          className="text-xs border rounded px-2 py-1 bg-background">
                          {[100, 150, 200, 250, 300, 400, 500, 750, 1000].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border flex-shrink-0">
                <Button onClick={handleGenerate} disabled={generating || selectedPapers.length === 0} className="w-full rounded-full">
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</>
                    : <><Sparkles className="w-4 h-4 mr-2" />Generate Manuscript</>}
                </Button>
              </div>
            </div>

            {/* Center: Editor */}
            <div className="col-span-6 overflow-hidden flex flex-col bg-background">
              {!hasManuscript ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                    <PenTool className="w-10 h-10 text-secondary-foreground" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-2">Ready to Draft</h3>
                  <p className="text-muted-foreground text-center max-w-sm mb-6">
                    Click "Generate Manuscript" to create a draft based on your study summary and selected papers
                  </p>
                  {selectedPapers.length === 0 && (
                    <p className="text-sm text-amber-600 text-center">
                      ⚠️ No papers selected. Go back to Literature Search and select papers first.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-border flex-shrink-0">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</Label>
                    <Input value={manuscript.title} onChange={(e) => updateSection('title', e.target.value)}
                      placeholder="Manuscript title..."
                      className="mt-2 font-manuscript text-xl border-none shadow-none p-0 h-auto focus-visible:ring-0" />
                  </div>

                  <Tabs value={activeSection} onValueChange={setActiveSection} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="flex-shrink-0 w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0 overflow-x-auto">
                      {sections.map((section) => (
                        <TabsTrigger key={section.id} value={section.id}
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-3 text-xs whitespace-nowrap">
                          {section.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <div className="flex-1 overflow-hidden">
                      {sections.map((section) => (
                        <TabsContent key={section.id} value={section.id} className="h-full m-0 p-0 data-[state=inactive]:hidden">
                          <ScrollArea className="h-full">
                            <div className="p-6 manuscript-preview">
                              {section.id === 'references' ? (
                                <div className="space-y-4">
                                  <h3 className="font-semibold text-lg mb-4">References (EndNote Format)</h3>
                                  {manuscript.references?.length > 0 ? (
                                    <ol className="list-decimal list-inside space-y-3">
                                      {manuscript.references.map((ref, idx) => (
                                        <li key={idx} className="text-sm leading-relaxed pl-2">
                                          <span className="font-medium">{ref.endnote_format || `${ref.authors}. ${ref.title}. ${ref.journal}. ${ref.year}.`}</span>
                                          {ref.classification && (
                                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${ref.classification === 'supporting' ? 'bg-green-100 text-green-700' : ref.classification === 'contradicting' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                              {ref.classification}
                                            </span>
                                          )}
                                        </li>
                                      ))}
                                    </ol>
                                  ) : <p className="text-muted-foreground">No references yet. Generate manuscript to populate.</p>}
                                </div>
                              ) : section.id === 'tables_figures' ? (
                                <div className="space-y-6">
                                  <h3 className="font-semibold text-lg mb-4">Tables, Figures & Charts</h3>
                                  {manuscript.tables?.length > 0 && (
                                    <div className="space-y-4">
                                      <h4 className="font-medium border-b pb-2">Tables ({manuscript.tables.length})</h4>
                                      {manuscript.tables.map((table, idx) => (
                                        <div key={idx} className="border rounded-lg p-4 bg-muted/20">
                                          <h5 className="font-semibold">{table.label || `Table ${idx + 1}`}</h5>
                                          {table.caption && <p className="text-sm text-muted-foreground mb-2">{table.caption}</p>}
                                          <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm border-collapse">
                                              {table.headers?.length > 0 && (
                                                <thead><tr className="bg-muted">
                                                  {table.headers.map((h, i) => <th key={i} className="border px-3 py-2 text-left font-medium">{h}</th>)}
                                                </tr></thead>
                                              )}
                                              <tbody>
                                                {table.rows?.map((row, rIdx) => (
                                                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                                                    {row.map((cell, cIdx) => <td key={cIdx} className="border px-3 py-2">{cell}</td>)}
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {manuscript.figures?.length > 0 && (
                                    <div className="space-y-4">
                                      <h4 className="font-medium border-b pb-2">Figures ({manuscript.figures.length})</h4>
                                      {manuscript.figures.map((fig, idx) => (
                                        <div key={idx} className="border rounded-lg p-4 bg-muted/20">
                                          <h5 className="font-semibold">{fig.label || `Figure ${idx + 1}`}</h5>
                                          {fig.caption && <p className="text-sm font-medium mb-2">{fig.caption}</p>}
                                          {fig.description && <p className="text-sm text-muted-foreground">{fig.description}</p>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {(!manuscript.tables?.length && !manuscript.figures?.length) && (
                                    manuscript.tables_figures
                                      ? <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">{manuscript.tables_figures}</pre>
                                      : <p className="text-muted-foreground">No tables or figures extracted from the report.</p>
                                  )}
                                </div>
                              ) : (
                                <Textarea value={manuscript[section.id] || ''} onChange={(e) => updateSection(section.id, e.target.value)}
                                  placeholder={`Write your ${section.label.toLowerCase()} here...`}
                                  className="min-h-[400px] font-manuscript-body text-base leading-relaxed border-none shadow-none resize-none focus-visible:ring-0 p-0" />
                              )}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      ))}
                    </div>
                  </Tabs>
                </>
              )}
            </div>

            {/* Right: Export & References */}
            <div className="col-span-3 border-l border-border bg-card/30 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border flex-shrink-0">
                <h3 className="font-heading font-semibold flex items-center gap-2"><Download className="w-4 h-4" />Export</h3>
              </div>
              <div className="p-4 space-y-4 flex-shrink-0">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Manuscript</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[['pdf', 'PDF'], ['docx', 'Word'], ['markdown', 'MD']].map(([fmt, label]) => (
                      <Button key={fmt} variant="outline" size="sm" onClick={() => handleExport(fmt)}
                        disabled={!hasManuscript || exporting === fmt} className="rounded-lg">
                        {exporting === fmt ? <Loader2 className="w-4 h-4 animate-spin" /> : label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">References</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[['endnote', 'ENW'], ['json', 'JSON'], ['csv', 'CSV']].map(([fmt, label]) => (
                      <Button key={fmt} variant="outline" size="sm" onClick={() => handleExportReferences(fmt)}
                        disabled={!hasManuscript || exporting === `refs-${fmt}`} className="rounded-lg">
                        {exporting === `refs-${fmt}` ? <Loader2 className="w-4 h-4 animate-spin" /> : label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />
              <div className="p-4 border-b border-border flex-shrink-0">
                <h3 className="font-heading font-semibold">References</h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {manuscript.references?.length > 0 ? (
                    manuscript.references.map((ref, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/30 text-sm">
                        <p className="font-medium text-foreground">[{ref.number}] {ref.authors?.split(',')[0]} et al. ({ref.year})</p>
                        <p className="text-muted-foreground line-clamp-2 mt-1">{ref.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{ref.journal}</p>
                        {ref.doi && (
                          <a href={`https://doi.org/${ref.doi}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                            {ref.doi}<ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      References will appear here after generating the manuscript
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
