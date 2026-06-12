import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { FileText, Loader2, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success('Account created successfully!');
      navigate('/projects');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Manuscript Writer</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Research</p>
            </div>
          </div>

          <Card className="border-border/50 shadow-sm animate-fade-in stagger-1">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="font-heading text-2xl">Create account</CardTitle>
              <CardDescription>Start your research journey today</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" type="text" placeholder="Dr. Jane Smith"
                    value={name} onChange={(e) => setName(e.target.value)} required
                    className="bg-muted/30 border-transparent focus:border-primary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="researcher@institution.edu"
                    value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="bg-muted/30 border-transparent focus:border-primary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                    className="bg-muted/30 border-transparent focus:border-primary" />
                  <p className="text-xs text-muted-foreground">At least 6 characters</p>
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Create account
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground animate-fade-in stagger-2">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1768102365263-4cc0e2c5f411?w=1200)' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <blockquote className="glass rounded-xl p-6">
            <p className="font-manuscript-body text-lg italic text-foreground/80">
              "Join thousands of researchers who streamline their manuscript writing with AI."
            </p>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
