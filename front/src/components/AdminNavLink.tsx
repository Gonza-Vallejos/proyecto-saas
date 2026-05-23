import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';

interface AdminNavLinkProps {
  to: string;
  active: boolean;
  children: React.ReactNode;
}

export default function AdminNavLink({ to, active, children }: AdminNavLinkProps) {
  return (
    <Link to={to} className={cn('admin-nav-link', active && 'admin-nav-link-active')}>
      {children}
    </Link>
  );
}
