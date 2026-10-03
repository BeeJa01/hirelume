import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function Layout() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">Hirelume</Link>
        {user && <button className="btn btn-ghost" onClick={logout}>Log out</button>}
      </header>
      <main className="page"><Outlet /></main>
    </>
  );
}

export function RequireRecruiter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'recruiter') return <Navigate to="/seeker" replace />;
  return <Outlet />;
}
