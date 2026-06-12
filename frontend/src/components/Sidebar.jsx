import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { FileText, FolderOpen, LogOut, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../components/ui/avatar';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-foreground">Manuscript Writer</h1>
            <p className="text-xs text-muted-foreground">AI Research Assistant</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <NavLink
          to="/projects"
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200',
            isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <FolderOpen className="w-5 h-5" />
          Projects
        </NavLink>

        <div className="pt-4 border-t border-border/50 mt-4">
          <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workflow</p>
          <div className="space-y-1 mt-2">
            {[
              { step: '1', label: 'Upload Report' },
              { step: '2', label: 'Literature Search' },
              { step: '3', label: 'Draft Manuscript' },
              { step: '4', label: 'Export' },
            ].map(({ step, label }) => (
              <div key={step} className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">{step}</div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-3 px-3 hover:bg-muted">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="gap-2"><User className="w-4 h-4" />Profile</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};
