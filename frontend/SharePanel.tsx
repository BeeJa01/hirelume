import * as React from 'react';
import { track } from '../lib/events';

const { useState } = React;

// US-2.2: copy the link or share to WhatsApp, LinkedIn and X.
export function SharePanel({ token, title }: { token: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/j/${token}`;
  const text = `We are hiring: ${title}. Apply here:`;
  const channels = [
    { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
    { id: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { id: 'x', label: 'X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user can copy by hand */
    }
    track('link_copied');
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  return React.createElement(
    'div',
    { className: 'card stack' },
    React.createElement('strong', null, 'Share this job'),
    React.createElement('input', {
      readOnly: true,
      value: url,
      'aria-label': 'Job link',
      onFocus: handleFocus,
    }),
    React.createElement(
      'div',
      { className: 'row' },
      React.createElement('button', { className: 'btn', onClick: copy }, copied ? 'Copied' : 'Copy link'),
      ...channels.map((c) =>
        React.createElement(
          'a',
          {
            key: c.id,
            className: 'btn',
            href: c.href,
            target: '_blank',
            rel: 'noreferrer',
            onClick: () => track('link_shared', { channel: c.id }),
          },
          c.label,
        ),
      ),
    ),
  );
}
