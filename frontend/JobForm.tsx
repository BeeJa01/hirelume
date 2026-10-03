import { useState, type FormEvent } from 'react';
import { ApiError, ERR } from '../lib/errors';
import type { JobInput } from '../lib/types';
import { Field } from './ui';
import { RequirementsEditor } from './RequirementsEditor';

const EMPTY: JobInput = {
  title: '', description: '', requirements: [{ text: '', priority: 'required' }], feedback_enabled: true,
};

// Used for create and edit. After the first application, requirements lock
// (Decision 2); title and description stay editable (US-2.4).
export function JobForm({ initial = EMPTY, lockRequirements = false, submitLabel, onSubmit }: {
  initial?: JobInput; lockRequirements?: boolean; submitLabel: string; onSubmit: (v: JobInput) => Promise<void>;
}) {
  const [v, setV] = useState<JobInput>(initial);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!v.title.trim()) next.title = 'Add a job title.';
    if (!v.description.trim()) next.description = 'Add a short description.';
    if (!lockRequirements && !v.requirements.some((r) => r.text.trim())) next.requirements = 'Add at least one requirement.';
    setErrs(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await onSubmit({ ...v, requirements: v.requirements.filter((r) => r.text.trim()) });
    } catch (err) {
      const e2 = err as ApiError;
      setErrs({ form: e2.code === ERR.REQUIREMENTS_LOCKED
        ? 'Requirements are locked because someone has applied. You can still edit the title and description.'
        : e2.message });
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="stack" noValidate>
      <Field label="Job title" error={errs.title}>
        <input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
      </Field>
      <Field label="Description" error={errs.description}>
        <textarea rows={5} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
      </Field>
      {lockRequirements && <p className="muted">Requirements are locked because applications have arrived.</p>}
      <RequirementsEditor value={v.requirements} disabled={lockRequirements} error={errs.requirements}
        onChange={(requirements) => setV({ ...v, requirements })} />
      <label className="check">
        <input type="checkbox" checked={v.feedback_enabled}
          onChange={(e) => setV({ ...v, feedback_enabled: e.target.checked })} />
        <span>Let applicants choose to see the AI's view of their application</span>
      </label>
      {errs.form && <p className="field-error" role="alert">{errs.form}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
    </form>
  );
}
