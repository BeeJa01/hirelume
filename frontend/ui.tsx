import { useEffect, useRef, type ReactNode } from 'react';
import type { ApiError } from '../lib/errors';
import type { Level } from '../lib/types';
import { RECRUITER_LEVEL } from '../lib/scoring';

export function Loading({ text = 'Loading…' }: { text?: string }) {
  return <p className="muted" role="status">{text}</p>;
}

export function ErrorBox({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div className="card error" role="alert">
      <p>{error.message}</p>
      {onRetry && <button className="btn" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card muted">{children}</div>;
}

// Recruiter-facing level badge. Applicants use APPLICANT_LEVEL copy instead.
export function LevelBadge({ level }: { level: Level }) {
  return <span className={`badge badge-${level}`}>{RECRUITER_LEVEL[level]}</span>;
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose?: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="overlay">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}
        onKeyDown={(e) => e.key === 'Escape' && onClose?.()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

export const AI_NOTE = 'The Hirelume AI can be wrong. Please check the CV yourself before you decide.';
