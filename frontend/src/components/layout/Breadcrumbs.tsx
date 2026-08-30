import { ChevronRight, Home } from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCards } from '../../hooks/useCards';

export function Breadcrumbs() {
  const location = useLocation();
  const { data: cards = [] } = useCards();

  const pathnames = location.pathname.split('/').filter((x) => x);

  // If on home/dashboard
  if (pathnames.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <Home className="h-3.5 w-3.5 text-primary" />
        <span>Dashboard</span>
      </div>
    );
  }

  // Handle workspace route: /workspace/:cardId
  if (pathnames[0] === 'workspace' && pathnames[1]) {
    const currentCard = cards.find((c) => c.id === pathnames[1]);
    const cardTitle = currentCard ? currentCard.name : 'Workspace';

    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Home className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-50" />
        <span className="text-foreground font-semibold truncate max-w-[200px]">{cardTitle}</span>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
      <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
        <span>Dashboard</span>
      </Link>
      {pathnames.map((segment, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const formatted = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            {isLast ? (
              <span className="text-foreground font-semibold">{formatted}</span>
            ) : (
              <Link to={routeTo} className="hover:text-foreground transition-colors">
                {formatted}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
