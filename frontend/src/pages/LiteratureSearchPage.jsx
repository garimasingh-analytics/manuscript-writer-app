import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Switch } from '../components/ui/switch';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import {
  Search, Loader2, ArrowRight, ArrowLeft, ExternalLink, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, XCircle, HelpCircle, Tag, Save, Trash2, Eye,
  SortAsc, SortDesc, X, Plus
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const classificationColors = {
  supporting: 'bg-green-100 text-green-700 border-green-200',
  contradicting: 'bg-red-100 text-red-700 border-red-200',
  background: 'bg-blue-100 text-blue-700 border-blue-200'
};
const classificationIcons = { supporting: CheckCircle2, contradicting: XCircle, background: HelpCircle };
const articleTypeLabels = { rct: 'RCT', systematic_review: 'Systematic Review', observational: 'Observational', review: 'Review', guideline: 'Guideline', preprint: 'Preprint', article: 'Article', unknown: 'Unknown' };

export default function LiteratureSearchPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [papers, setPapers] = useState([]);
  const [expandedPaper, setExpandedPaper] = useState(null);
  const [availableDatabases, setAvailableDatabases] = useState({});
  const [keywordSets, setKeywordSets] = useState([]);
  const [saveKeywordDialogOpen, setSaveKeywordDialogOpen] = useState(false);
  const [newKeywordSetName, setNewKeywordSetName] = useState('');
  const [showQueryPreview, setShowQueryPreview] = useState(false);
  const [queryPreviews, setQueryPreviews] = useState({});

  const [mainKeywords, setMainKeywords] = useState([]);
  const [exclusionKeywords, setExclusionKeywords] = useState([]);
  const [meshTerms, setMeshTerms] = useState([]);
  const [customQuery, setCustomQuery] = useState('');
  const [enabledDatabases, setEnabledDatabases] = useState([]);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [articleTypes, setArticleTypes] = useState([]);
  const [language, setLanguage] = useState('english');
  const [openAccessOnly, setOpenAccessOnly] = useState(false);

  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterDb, setFilterDb] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('keywords');

  // Keyword input states
  const [mainKwInput, setMainKwInput] = useState('');
  const [exclusionKwInput, setExclusionKwInput] = useState('');
  const [meshInput, setMeshInput] = useState('');

  useEffect(() => { fetchProject(); fetchDatabases(); }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}`);
      setProject(response.data);
      if (response.data.papers) setPapers(response.data.papers);
      if (response.data.keyword_sets) setKeywordSets(response.data.keyword_sets);
      if (response.data.last_search_config) {
        const c = response.data.last_search_config;
        setMainKeywords(c.main_keywords || []);
        setExclusionKeywords(c.exclusion_keywords || []);
        setMeshTerms(c.mesh_terms || []);
        setCustomQuery(c.custom_query || '');
        if (c.enabled_databases?.length) setEnabledDatabases(c.enabled_databases);
        setYearFrom(c.year_from?.toString() || '');
        setYearTo(c.year_to?.toString() || '');
        setLanguage(c.language || 'english');
        setOpenAccessOnly(c.open_access_only || false);
      }
    } catch { toast.error('Failed to load project'); navigate('/projects'); }
    finally { setLoading(false); }
  };

  const fetchDatabases = async () => {
    try {
      const response = await axios.get(`${API}/projects/databases`);
      setAvailableDatabases(response.data);
      const defaults = Object.entries(response.data).filter(([_, v]) => v.enabled_by_default).map(([k]) => k);
      setEnabledDatabases(defaults);
    } catch { console.error('Failed to load databases'); }
  };

  const buildFilters = () => ({
    main_keywords: mainKeywords, exclusion_keywords: exclusionKeywords, mesh_terms: meshTerms,
    custom_query: customQuery, year_from: yearFrom ? parseInt(yearFrom) : null,
    year_to: yearTo ? parseInt(yearTo) : null, article_types: articleTypes, language,
    open_access_only: openAccessOnly, enabled_databases: enabledDatabases
  });

  const handleSearch = async () => {
    if (mainKeywords.length === 0 && !customQuery) { toast.error('Please enter at least one keyword or custom query'); return; }
    setSearching(true);
    try {
      const response = await axios.post(`${API}/agents/search-literature/${projectId}`, buildFilters());
      setPapers(response.data.papers);
      toast.success(`Found ${response.data.count} papers from ${response.data.databases_searched.length} databases`);
    } catch (error) { toast.error(error.response?.data?.detail || 'Search failed'); }
    finally { setSearching(false); }
  };

  const handleQueryPreview = async () => {
    try {
      const response = await axios.post(`${API}/agents/query-preview/${projectId}`, buildFilters());
      setQueryPreviews(response.data.query_previews);
      setShowQueryPreview(true);
    } catch { toast.error('Failed to generate query preview'); }
  };

  const handleSaveKeywordSet = async () => {
    if (!newKeywordSetName.trim()) { toast.error('Please enter a name'); return; }
    try {
      const ks = { id: crypto.randomUUID(), name: newKeywordSetName, main_keywords: mainKeywords, exclusion_keywords: exclusionKeywords, mesh_terms: meshTerms, custom_query: customQuery };
      await axios.post(`${API}/keywords/${projectId}`, ks);
      setKeywordSets([...keywordSets, ks]);
      toast.success('Keyword set saved');
      setSaveKeywordDialogOpen(false);
      setNewKeywordSetName('');
    } catch { toast.error('Failed to save keyword set'); }
  };

  const deleteKeywordSet = async (ksId) => {
    try {
      await axios.delete(`${API}/keywords/${projectId}/${ksId}`);
      setKeywordSets(keywordSets.filter(ks => ks.id !== ksId));
      toast.success('Keyword set deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const togglePaperSelection = (paperId) => setPapers(papers.map(p => p.id === paperId ? { ...p, selected: !p.selected } : p));
  const updateClassification = (paperId, classification) => setPapers(papers.map(p => p.id === paperId ? { ...p, classification } : p));

  const savePapers = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/agents/papers/${projectId}`, papers);
      toast.success('Papers saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleProceed = async () => {
    if (papers.filter(p => p.selected).length === 0) { toast.error('Please select at least one paper'); return; }
    await savePapers();
    navigate(`/project/${projectId}/manuscript`);
  };

  const addKeyword = (setter, value, list, inputSetter) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) { setter([...list, trimmed]); inputSetter(''); }
  };

  const filteredPapers = useMemo(() => {
    let result = [...papers];
    if (filterDb !== 'all') result = result.filter(p => p.database_source === filterDb || p.databases_found_in?.includes(filterDb));
    if (filterType !== 'all') result = result.filter(p => p.article_type === filterType);
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'relevance') cmp = (a.relevance_score || 0) - (b.relevance_score || 0);
      else if (sortBy === 'year') cmp = parseInt(a.year || '0') - parseInt(b.year || '0');
      else if (sortBy === 'title') cmp = (a.title || '').localeCompare(b.title || '');
      return sortOrder === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [papers, filterDb, filterType, sortBy, sortOrder]);

  const selectedCount = papers.filter(p => p.selected).length;
  const supportingCount = papers.filter(p => p.selected && p.classification === 'supporting').length;
  const contradictingCount = papers.filter(p => p.selected && p.classification === 'contradicting').length;
  const backgroundCount = papers.filter(p => p.selected && p.classification === 'background').length;

  if (loading) return (
    <div className="flex min-h-screen bg-background"><Sidebar />
      <main className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="max-w-full mx-auto w-full flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-4 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <span>Projects</span><span>/</span><span>{project?.title}</span><span>/</span>
                <span className="text-foreground">Literature Search</span>
              </div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Literature Search</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/project/${projectId}/upload`)} className="rounded-full gap-2">
                <ArrowLeft className="w-4 h-4" />Back
              </Button>
              <Button variant="outline" onClick={savePapers} disabled={saving} className="rounded-full gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save
              </Button>
              <Button onClick={handleProceed} disabled={selectedCount === 0} className="rounded-full gap-2">
                Draft Manuscript ({selectedCount})<ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
            {/* Left: Search Config */}
            <div className="col-span-4 overflow-hidden flex flex-col">
              <Card className="flex-1 overflow-hidden flex flex-col">
                <CardHeader className="flex-shrink-0 pb-2">
                  <CardTitle className="font-heading text-base flex items-center gap-2">
                    <Search className="w-4 h-4" />Search Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-3">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full grid grid-cols-3 mb-3">
                      <TabsTrigger value="keywords" className="text-xs">Keywords</TabsTrigger>
                      <TabsTrigger value="databases" className="text-xs">Databases</TabsTrigger>
                      <TabsTrigger value="filters" className="text-xs">Filters</TabsTrigger>
                    </TabsList>

                    <TabsContent value="keywords" className="space-y-4">
                      {/* Main keywords */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Main Keywords</Label>
                        <div className="flex gap-1">
                          <Input value={mainKwInput} onChange={(e) => setMainKwInput(e.target.value)}
                            placeholder="Add keyword..." className="h-7 text-xs"
                            onKeyDown={(e) => e.key === 'Enter' && addKeyword(setMainKeywords, mainKwInput, mainKeywords, setMainKwInput)} />
                          <Button size="sm" className="h-7 px-2" onClick={() => addKeyword(setMainKeywords, mainKwInput, mainKeywords, setMainKwInput)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {mainKeywords.map(kw => (
                            <Badge key={kw} variant="secondary" className="text-xs gap-1">
                              {kw}<X className="w-2 h-2 cursor-pointer" onClick={() => setMainKeywords(mainKeywords.filter(k => k !== kw))} />
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Exclusion keywords */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Exclusion Keywords</Label>
                        <div className="flex gap-1">
                          <Input value={exclusionKwInput} onChange={(e) => setExclusionKwInput(e.target.value)}
                            placeholder="Exclude term..." className="h-7 text-xs"
                            onKeyDown={(e) => e.key === 'Enter' && addKeyword(setExclusionKeywords, exclusionKwInput, exclusionKeywords, setExclusionKwInput)} />
                          <Button size="sm" className="h-7 px-2" onClick={() => addKeyword(setExclusionKeywords, exclusionKwInput, exclusionKeywords, setExclusionKwInput)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {exclusionKeywords.map(kw => (
                            <Badge key={kw} variant="outline" className="text-xs gap-1 text-red-600 border-red-200">
                              NOT {kw}<X className="w-2 h-2 cursor-pointer" onClick={() => setExclusionKeywords(exclusionKeywords.filter(k => k !== kw))} />
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* MeSH terms */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">MeSH Terms</Label>
                        <div className="flex gap-1">
                          <Input value={meshInput} onChange={(e) => setMeshInput(e.target.value)}
                            placeholder="MeSH term..." className="h-7 text-xs"
                            onKeyDown={(e) => e.key === 'Enter' && addKeyword(setMeshTerms, meshInput, meshTerms, setMeshInput)} />
                          <Button size="sm" className="h-7 px-2" onClick={() => addKeyword(setMeshTerms, meshInput, meshTerms, setMeshInput)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {meshTerms.map(kw => (
                            <Badge key={kw} variant="outline" className="text-xs gap-1 text-purple-600 border-purple-200">
                              <Tag className="w-2 h-2" />{kw}<X className="w-2 h-2 cursor-pointer" onClick={() => setMeshTerms(meshTerms.filter(k => k !== kw))} />
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Custom query */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Custom Query</Label>
                        <Textarea value={customQuery} onChange={(e) => setCustomQuery(e.target.value)}
                          placeholder="OR paste a custom search query..." rows={2} className="text-xs" />
                      </div>

                      {/* Saved keyword sets */}
                      {keywordSets.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Saved Keyword Sets</Label>
                          {keywordSets.map(ks => (
                            <div key={ks.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                              <button className="text-left flex-1 hover:text-primary" onClick={() => {
                                setMainKeywords(ks.main_keywords || []);
                                setExclusionKeywords(ks.exclusion_keywords || []);
                                setMeshTerms(ks.mesh_terms || []);
                                setCustomQuery(ks.custom_query || '');
                                toast.success(`Loaded "${ks.name}"`);
                              }}>{ks.name}</button>
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => deleteKeywordSet(ks.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="databases" className="space-y-2">
                      {Object.entries(availableDatabases).map(([key, db]) => (
                        <div key={key} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                          <div>
                            <p className="text-xs font-medium">{db.name}</p>
                            <p className="text-xs text-muted-foreground">{db.description?.slice(0, 50)}...</p>
                          </div>
                          <Switch
                            checked={enabledDatabases.includes(key)}
                            onCheckedChange={(checked) => {
                              if (checked) setEnabledDatabases([...enabledDatabases, key]);
                              else setEnabledDatabases(enabledDatabases.filter(d => d !== key));
                            }}
                          />
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="filters" className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Year From</Label>
                          <Input value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} placeholder="2000" className="h-7 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Year To</Label>
                          <Input value={yearTo} onChange={(e) => setYearTo(e.target.value)} placeholder="2024" className="h-7 text-xs" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Open Access Only</Label>
                        <Switch checked={openAccessOnly} onCheckedChange={setOpenAccessOnly} />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>

                <div className="p-3 border-t flex-shrink-0 space-y-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={handleQueryPreview}>
                      <Eye className="w-3 h-3 mr-1" />Preview
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => setSaveKeywordDialogOpen(true)}>
                      <Save className="w-3 h-3 mr-1" />Save Set
                    </Button>
                  </div>
                  <Button onClick={handleSearch} disabled={searching} className="w-full rounded-full h-8">
                    {searching ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Searching...</>
                      : <><Search className="w-4 h-4 mr-2" />Search Literature</>}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right: Results */}
            <div className="col-span-8 overflow-hidden flex flex-col gap-3">
              {/* Filters bar */}
              {papers.length > 0 && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Select value={filterDb} onValueChange={setFilterDb}>
                    <SelectTrigger className="h-7 text-xs w-36"><SelectValue placeholder="All databases" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All databases</SelectItem>
                      {Object.entries(availableDatabases).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-7 text-xs w-36"><SelectValue placeholder="All types" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {Object.entries(articleTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </Button>
                  <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-600" />{supportingCount}</span>
                    <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-600" />{contradictingCount}</span>
                    <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3 text-blue-600" />{backgroundCount}</span>
                  </div>
                </div>
              )}

              <Card className="flex-1 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1">
                  {papers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 py-16 px-6">
                      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-secondary-foreground" />
                      </div>
                      <h3 className="font-heading text-lg font-semibold mb-2">No results yet</h3>
                      <p className="text-muted-foreground text-center max-w-sm text-sm">
                        Configure your keywords and databases, then click "Search Literature"
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>Paper</TableHead>
                          <TableHead className="w-16">Year</TableHead>
                          <TableHead className="w-28">Type</TableHead>
                          <TableHead className="w-32">Classification</TableHead>
                          <TableHead className="w-20">Source</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPapers.map((paper) => {
                          const Icon = classificationIcons[paper.classification] || HelpCircle;
                          return (
                            <React.Fragment key={paper.id}>
                              <TableRow className={`cursor-pointer transition-colors ${paper.selected ? 'bg-secondary/30' : ''}`}>
                                <TableCell>
                                  <Checkbox checked={paper.selected} onCheckedChange={() => togglePaperSelection(paper.id)} />
                                </TableCell>
                                <TableCell>
                                  <div className="cursor-pointer" onClick={() => setExpandedPaper(expandedPaper === paper.id ? null : paper.id)}>
                                    <div className="flex items-start gap-2">
                                      <p className="font-medium text-foreground line-clamp-2 flex-1 text-sm">{paper.title}</p>
                                      {paper.is_open_access && <Badge variant="outline" className="shrink-0 text-[10px] bg-green-50 text-green-700 border-green-200">OA</Badge>}
                                      {paper.needs_verification && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{paper.authors}</p>
                                    {paper.journal && <p className="text-xs text-muted-foreground mt-0.5">{paper.journal}</p>}
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{paper.year}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-[10px]">{articleTypeLabels[paper.article_type] || paper.article_type}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Select value={paper.classification} onValueChange={(v) => updateClassification(paper.id, v)}>
                                    <SelectTrigger className={`h-7 text-xs ${classificationColors[paper.classification]}`}>
                                      <div className="flex items-center gap-1">
                                        <Icon className="w-3 h-3" /><SelectValue />
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="supporting">Supporting</SelectItem>
                                      <SelectItem value="contradicting">Contradicting</SelectItem>
                                      <SelectItem value="background">Background</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {paper.databases_found_in?.map(db => (
                                      <Badge key={db} variant="secondary" className="text-[10px]">
                                        {availableDatabases[db]?.name?.split(' ')[0] || db}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                              {expandedPaper === paper.id && (
                                <TableRow>
                                  <TableCell colSpan={6} className="bg-muted/30 p-4">
                                    <div className="space-y-3">
                                      {paper.abstract && (
                                        <div>
                                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Abstract</p>
                                          <p className="text-sm">{paper.abstract}</p>
                                        </div>
                                      )}
                                      <div className="flex flex-wrap gap-4 text-sm">
                                        {paper.doi && (
                                          <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center gap-1">
                                            DOI: {paper.doi}<ExternalLink className="w-3 h-3" />
                                          </a>
                                        )}
                                        {paper.pmid && (
                                          <a href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`} target="_blank" rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center gap-1">
                                            PMID: {paper.pmid}<ExternalLink className="w-3 h-3" />
                                          </a>
                                        )}
                                        {paper.url && !paper.doi && !paper.pmid && (
                                          <a href={paper.url} target="_blank" rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center gap-1">
                                            View Paper<ExternalLink className="w-3 h-3" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={saveKeywordDialogOpen} onOpenChange={setSaveKeywordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Keyword Set</DialogTitle>
            <DialogDescription>Save your current keywords for future searches</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Name</Label>
            <Input value={newKeywordSetName} onChange={(e) => setNewKeywordSetName(e.target.value)} placeholder="e.g., T2D_CV_outcomes_query" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveKeywordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveKeywordSet} className="rounded-full">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showQueryPreview} onOpenChange={setShowQueryPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Query Preview</DialogTitle>
            <DialogDescription>How your search will be translated for each database</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4 py-4">
              {Object.entries(queryPreviews).map(([db, query]) => (
                <div key={db} className="space-y-1">
                  <Label className="text-sm font-medium">{availableDatabases[db]?.name || db}</Label>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">{query}</pre>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setShowQueryPreview(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
