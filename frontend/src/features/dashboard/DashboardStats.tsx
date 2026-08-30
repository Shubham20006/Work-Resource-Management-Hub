import {
  ExternalLink,
  FolderKanban,
  Layers,
  Sparkles,
  Star,
} from 'lucide-react';
import React from 'react';
import { Card } from '../../types';

interface DashboardStatsProps {
  cards: Card[];
}

export function DashboardStats({ cards }: DashboardStatsProps) {
  const totalCards = cards.length;
  const totalItems = cards.reduce((acc, c) => acc + c.items.length, 0);
  const totalResources = cards.reduce(
    (acc, c) => acc + c.items.reduce((iAcc, item) => iAcc + item.resources.length, 0),
    0
  );
  const favoriteCards = cards.filter((c) => c.isFavorite).length;

  const stats = [
    {
      title: 'Total Workspaces',
      value: totalCards,
      description: 'Active boards & categories',
      icon: FolderKanban,
      color: 'from-blue-500/20 to-indigo-500/20 text-indigo-500 border-indigo-500/30',
      iconBg: 'bg-indigo-500/10 text-indigo-500',
    },
    {
      title: 'Sub-Projects & Items',
      value: totalItems,
      description: 'Review AI, Attendance, Batches...',
      icon: Layers,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-500 border-emerald-500/30',
      iconBg: 'bg-emerald-500/10 text-emerald-500',
    },
    {
      title: 'Indexed Resources',
      value: totalResources,
      description: 'Google Sheets, Repos, URLs',
      icon: ExternalLink,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-500 border-purple-500/30',
      iconBg: 'bg-purple-500/10 text-purple-500',
    },
    {
      title: 'Starred Hubs',
      value: favoriteCards,
      description: 'Quick access favorites',
      icon: Star,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-500 border-amber-500/30',
      iconBg: 'bg-amber-500/10 text-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 dark:bg-slate-900/40 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${stat.iconBg}`}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {stat.value}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground truncate">{stat.description}</p>
          </div>
        );
      })}
    </div>
  );
}
