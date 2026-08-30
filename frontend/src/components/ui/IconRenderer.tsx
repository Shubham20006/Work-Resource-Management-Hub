import {
  Activity,
  Archive,
  BookOpen,
  Bookmark,
  Bot,
  Box,
  Briefcase,
  CalendarCheck,
  Code2,
  Cpu,
  Database,
  FileSpreadsheet,
  Folder,
  FolderGit2,
  FolderKanban,
  GraduationCap,
  Layers,
  Network,
  Presentation,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Terminal,
} from 'lucide-react';
import React from 'react';

export const AVAILABLE_ICONS = [
  { id: 'FolderKanban', label: 'Kanban', icon: FolderKanban },
  { id: 'Bot', label: 'AI Bot', icon: Bot },
  { id: 'GraduationCap', label: 'Academic', icon: GraduationCap },
  { id: 'CalendarCheck', label: 'Attendance', icon: CalendarCheck },
  { id: 'FolderGit2', label: 'Git Project', icon: FolderGit2 },
  { id: 'FileSpreadsheet', label: 'Spreadsheet', icon: FileSpreadsheet },
  { id: 'Archive', label: 'Archive', icon: Archive },
  { id: 'Code2', label: 'Code', icon: Code2 },
  { id: 'BookOpen', label: 'Research', icon: BookOpen },
  { id: 'Layers', label: 'Layers', icon: Layers },
  { id: 'Sparkles', label: 'Sparkles', icon: Sparkles },
  { id: 'Database', label: 'Database', icon: Database },
  { id: 'Terminal', label: 'Terminal', icon: Terminal },
  { id: 'Rocket', label: 'Launch', icon: Rocket },
  { id: 'Briefcase', label: 'Work', icon: Briefcase },
  { id: 'Folder', label: 'Folder', icon: Folder },
] as const;

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FolderKanban,
  Bot,
  GraduationCap,
  CalendarCheck,
  FolderGit2,
  FileSpreadsheet,
  Archive,
  Code2,
  BookOpen,
  Layers,
  Sparkles,
  Database,
  Terminal,
  Rocket,
  Briefcase,
  Bookmark,
  Star,
  Box,
  Network,
  Cpu,
  Activity,
  Presentation,
  Folder,
};

interface IconRendererProps {
  name: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function IconRenderer({ name, className = 'h-5 w-5', fallback }: IconRendererProps) {
  const Component = ICON_MAP[name] || Folder;
  if (!Component) return <>{fallback || <Folder className={className} />}</>;
  return <Component className={className} />;
}
