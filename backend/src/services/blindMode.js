function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyBlindMode(text, identity = {}) {
  let output = String(text || '');
  const nameParts = typeof identity.name === 'string' ? identity.name.trim().split(/\s+/).filter((part) => part.length >= 2) : [];
  const exactValues = [identity.name, identity.email, identity.phone, ...nameParts]
    .filter((value) => typeof value === 'string' && value.trim().length >= 3)
    .sort((a, b) => b.length - a.length);
  for (const value of exactValues) {
    output = output.replace(new RegExp(escapeRegExp(value.trim()), 'gi'), '[REDACTED]');
  }
  return output
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL REDACTED]')
    .replace(/(?:\+?\d[\d ().-]{7,}\d)/g, '[PHONE REDACTED]')
    .replace(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s)]+/gi, '[PROFILE REDACTED]')
    .replace(/https?:\/\/(?:www\.)?(?:github|gitlab)\.com\/[^\s)]+/gi, '[PROFILE REDACTED]');
}

module.exports = { applyBlindMode };
