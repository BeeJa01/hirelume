import type { Requirement } from '../lib/types';
import React, { type ChangeEvent } from 'react';

// Decision 5: requirements are a list, each marked Required or Nice-to-have.
export function RequirementsEditor({ value, onChange, disabled, error }: {
  value: Requirement[]; onChange: (r: Requirement[]) => void; disabled?: boolean; error?: string;
}) {
  const set = (i: number, patch: Partial<Requirement>) =>
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  return React.createElement(
    'fieldset',
    { className: 'field', disabled },
    React.createElement('legend', null, 'Requirements'),
    ...value.map((r, i) =>
      React.createElement('div', { className: 'req-row', key: i },
        React.createElement('input', {
          'aria-label': `Requirement ${i + 1}`, value: r.text, placeholder: 'e.g. 2 years of B2B sales',
          onChange: (e: ChangeEvent<HTMLInputElement>) => set(i, { text: e.target.value }),
        }),
        React.createElement('select', {
          'aria-label': `Priority for requirement ${i + 1}`, value: r.priority,
          onChange: (e: ChangeEvent<HTMLSelectElement>) => set(i, { priority: e.target.value as Requirement['priority'] }),
        },
          React.createElement('option', { value: 'required' }, 'Required'),
          React.createElement('option', { value: 'nice_to_have' }, 'Nice-to-have'),
        ),
        React.createElement('button', {
          type: 'button', className: 'btn btn-ghost', 'aria-label': `Remove requirement ${i + 1}`,
          disabled: value.length === 1, onClick: () => onChange(value.filter((_, idx) => idx !== i)),
        }, '×'),
      ),
    ),
    React.createElement('button', {
      type: 'button', className: 'btn btn-ghost', onClick: () => onChange([...value, { text: '', priority: 'required' }]),
    }, '+ Add requirement'),
    error && React.createElement('span', { className: 'field-error', role: 'alert' }, error),
  );
}
