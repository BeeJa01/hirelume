const dns = require('node:dns').promises;
const net = require('node:net');
const http = require('node:http');
const https = require('node:https');
const { createWorker } = require('tesseract.js');
const englishData = require('@tesseract.js-data/eng');

const MAX_JOB_PAGE_BYTES = 1024 * 1024;

function isPrivateAddress(address) {
  if (net.isIPv4(address)) {
    const parts = address.split('.').map(Number);
    return parts[0] === 10 || parts[0] === 127 || parts[0] === 0
      || (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127)
      || (parts[0] === 169 && parts[1] === 254)
      || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
      || (parts[0] === 192 && parts[1] === 168)
      || (parts[0] === 198 && (parts[1] === 18 || parts[1] === 19))
      || parts[0] >= 224;
  }
  if (net.isIPv6(address)) {
    const value = address.toLowerCase();
    const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return value === '::1' || value === '::' || value.startsWith('fc') || value.startsWith('fd')
      || value.startsWith('fe8') || value.startsWith('fe9') || value.startsWith('fea') || value.startsWith('feb')
      || value.startsWith('ff');
  }
  return true;
}

async function assertPublicUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid public URL');
  const addresses = await dns.lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error('Private URL is not allowed');
  return { url, ...addresses[0] };
}

function decodeEntities(text) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const hex = entity[1].toLowerCase() === 'x';
      const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return named[entity.toLowerCase()] ?? match;
  });
}

function htmlToText(html) {
  return decodeEntities(String(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<\/(p|div|section|article|li|h[1-6]|br)>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function requestJobPage(target) {
  return new Promise((resolve, reject) => {
    const transport = target.url.protocol === 'https:' ? https : http;
    const request = transport.request(target.url, {
      method: 'GET',
      servername: target.url.hostname,
      headers: { 'User-Agent': 'HirelumeJobReader/1.0', Accept: 'text/html,text/plain' },
      lookup: (_hostname, _options, callback) => callback(null, target.address, target.family),
    }, (response) => {
      const declared = Number(response.headers['content-length'] || 0);
      if (declared > MAX_JOB_PAGE_BYTES) {
        response.destroy();
        reject(new Error('Job page is too large'));
        return;
      }
      const chunks = [];
      let size = 0;
      response.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_JOB_PAGE_BYTES) response.destroy(new Error('Job page is too large'));
        else chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('end', () => resolve({
        status: response.statusCode || 0,
        headers: response.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    request.setTimeout(8000, () => request.destroy(new Error('Job page timed out')));
    request.on('error', reject);
    request.end();
  });
}

async function extractJobTextFromLink(value) {
  let target = await assertPublicUrl(value);
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await requestJobPage(target);
    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      if (redirects === 3) throw new Error('Too many redirects');
      target = await assertPublicUrl(new URL(response.headers.location, target.url).toString());
      continue;
    }
    if (response.status < 200 || response.status >= 300) throw new Error(`Job page returned ${response.status}`);
    const type = String(response.headers['content-type'] || '').toLowerCase();
    if (!type.includes('text/html') && !type.includes('text/plain')) throw new Error('Job page is not readable text');
    const text = type.includes('html') ? htmlToText(response.body) : response.body.trim();
    if (text.length < 50) throw new Error('Not enough readable job text');
    return text.slice(0, 50000);
  }
  throw new Error('Job page is not readable');
}

let ocrQueue = Promise.resolve();

async function runScreenshotOcr(files) {
  const worker = await createWorker(englishData.code, 1, {
    langPath: englishData.langPath,
    gzip: englishData.gzip,
    cacheMethod: 'none',
  });
  try {
    const text = [];
    for (const file of files) {
      const result = await worker.recognize(file.buffer);
      text.push(result.data.text);
    }
    return text.join('\n');
  } finally {
    await worker.terminate();
  }
}

async function extractJobTextFromScreenshots(files) {
  const task = ocrQueue.then(() => runScreenshotOcr(files));
  ocrQueue = task.catch(() => {});
  const text = String(await task).trim();
  if (text.length < 50) throw new Error('Not enough text was extracted');
  return text.slice(0, 50000);
}

module.exports = { extractJobTextFromLink, extractJobTextFromScreenshots, htmlToText, isPrivateAddress };
