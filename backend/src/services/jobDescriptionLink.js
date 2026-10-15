const dns = require('node:dns');
const http = require('node:http');
const https = require('node:https');
const ipaddr = require('ipaddr.js');
const cheerio = require('cheerio');

const REQUEST_TIMEOUT_MS = 12000;
const MAX_REDIRECTS = 5;
const MAX_HTML_BYTES = 3 * 1024 * 1024;
const USER_AGENT = 'HirelumeJobDescriptionReader/1.0 (+https://hirelume.com)';

class LinkExtractionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'LinkExtractionError';
    this.code = code;
  }
}

function isPublicAddress(address) {
  try {
    return ipaddr.process(address).range() === 'unicast';
  } catch {
    return false;
  }
}

function validateAndNormalizeUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new LinkExtractionError('INVALID_URL', 'Enter a valid public job-posting URL.');
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase().replace(/\.$/, '');
  if (
    !['http:', 'https:'].includes(url.protocol)
    || !hostname
    || url.username
    || url.password
    || hostname === 'localhost'
    || hostname.endsWith('.localhost')
    || hostname.endsWith('.local')
    || hostname.endsWith('.internal')
    || hostname.endsWith('.test')
  ) {
    throw new LinkExtractionError('INVALID_URL', 'Only public HTTP or HTTPS job-posting URLs are supported.');
  }

  if (ipaddr.isValid(hostname) && !isPublicAddress(hostname)) {
    throw new LinkExtractionError('INVALID_URL', 'Private and internal network addresses are not allowed.');
  }

  url.hash = '';
  return url;
}

function publicAddressLookup(hostname, options, callback) {
  dns.lookup(hostname, { all: true, verbatim: true }, (error, addresses) => {
    if (error) return callback(error);
    if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
      const blocked = new Error('The URL resolves to a private or internal address.');
      blocked.code = 'INVALID_URL';
      return callback(blocked);
    }

    if (options && typeof options === 'object' && options.all) {
      return callback(null, addresses);
    }
    const selected = addresses[0];
    return callback(null, selected.address, selected.family);
  });
}

function requestPage(url, deadline) {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === 'https:' ? https : http;
    const request = transport.get(url, {
      agent: new (url.protocol === 'https:' ? https.Agent : http.Agent)({
        lookup: publicAddressLookup,
      }),
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
    }, (response) => {
      response.on('error', reject);
      const statusCode = response.statusCode || 0;
      const location = response.headers.location;
      if (statusCode >= 300 && statusCode < 400 && location) {
        response.destroy();
        return resolve({ redirect: location, statusCode });
      }
      if (statusCode >= 300 && statusCode < 400) {
        response.destroy();
        return reject(new LinkExtractionError(
          'LINK_UNREACHABLE',
          'The job page returned an invalid redirect.',
        ));
      }
      if (statusCode === 401 || statusCode === 403) {
        response.destroy();
        return reject(new LinkExtractionError(
          'LOGIN_REQUIRED',
          'This job page requires sign-in or blocks access. Paste the text or upload a screenshot instead.',
        ));
      }
      if (statusCode === 404 || statusCode === 410) {
        response.destroy();
        return reject(new LinkExtractionError(
          'CONTENT_NOT_FOUND',
          'The job posting could not be found at that link.',
        ));
      }
      if (statusCode < 200 || statusCode >= 300) {
        response.destroy();
        return reject(new LinkExtractionError(
          'LINK_UNREACHABLE',
          'The job page could not be reached. Check the link and try again.',
        ));
      }

      const contentType = String(response.headers['content-type'] || '').toLowerCase();
      const contentLength = Number(response.headers['content-length'] || 0);
      if (
        (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml'))
        || contentLength > MAX_HTML_BYTES
      ) {
        response.destroy();
        return reject(new LinkExtractionError(
          'CONTENT_NOT_FOUND',
          'This link did not return a readable job-posting page.',
        ));
      }

      const chunks = [];
      let bytes = 0;
      response.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > MAX_HTML_BYTES) {
          response.destroy(new LinkExtractionError(
            'CONTENT_NOT_FOUND',
            'The job page is too large to read.',
          ));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => resolve({ html: Buffer.concat(chunks).toString('utf8'), statusCode }));
    });

    request.on('error', reject);
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      request.destroy(new LinkExtractionError('LINK_TIMEOUT', 'The job page took too long to respond.'));
      return;
    }
    request.setTimeout(remaining, () => {
      request.destroy(new LinkExtractionError('LINK_TIMEOUT', 'The job page took too long to respond.'));
    });
    const deadlineTimer = setTimeout(() => {
      request.destroy(new LinkExtractionError('LINK_TIMEOUT', 'The job page took too long to respond.'));
    }, remaining);
    request.on('close', () => clearTimeout(deadlineTimer));
  });
}

async function fetchHtml(initialUrl) {
  const deadline = Date.now() + REQUEST_TIMEOUT_MS;
  let currentUrl = initialUrl;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    let result;
    try {
      result = await requestPage(currentUrl, deadline);
    } catch (error) {
      if (error instanceof LinkExtractionError) throw error;
      if (error.code === 'INVALID_URL') {
        throw new LinkExtractionError('INVALID_URL', 'Private and internal network addresses are not allowed.');
      }
      if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
        throw new LinkExtractionError('LINK_TIMEOUT', 'The job page took too long to respond.');
      }
      throw new LinkExtractionError(
        'LINK_UNREACHABLE',
        'The job page could not be reached. Check the link and try again.',
      );
    }

    if (!result.redirect) return result.html;
    if (redirects === MAX_REDIRECTS) {
      throw new LinkExtractionError('LINK_UNREACHABLE', 'The job link redirected too many times.');
    }
    let redirectUrl;
    try {
      redirectUrl = validateAndNormalizeUrl(new URL(result.redirect, currentUrl).toString());
    } catch (error) {
      if (error instanceof LinkExtractionError) throw error;
      throw new LinkExtractionError('INVALID_URL', 'The job page redirected to an invalid URL.');
    }
    currentUrl = redirectUrl;
  }

  throw new LinkExtractionError('LINK_UNREACHABLE', 'The job page could not be reached.');
}

function extractMainText(html) {
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, iframe, nav, footer, header, form, button, [aria-hidden="true"]').remove();

  const main = $('main, article, [role="main"]').first();
  const root = main.length ? main : $('body');
  root.find('br').replaceWith('\n');
  root.find('p, h1, h2, h3, h4, h5, h6, li, div, section, article, dt, dd, tr')
    .prepend('\n').append('\n');
  return root.text().replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function looksLikeJobPosting(text) {
  const content = text.toLowerCase();
  const indicators = [
    /\b(job|role|position|career opportunity|job opening|vacancy)\b/.test(content),
    /\b(responsibilities|duties|what you(?:'|’)ll do|key tasks)\b/.test(content),
    /\b(requirements|qualifications|experience|skills|what you(?:'|’)ll need)\b/.test(content),
    /\b(apply now|how to apply|submit your application|application deadline)\b/.test(content),
    /\b(full[- ]time|part[- ]time|employment type|salary|compensation)\b/.test(content),
  ];
  return indicators.filter(Boolean).length >= 2;
}

function isLoginWall(text) {
  return /\b(sign in|log in|login required|create an account)\b.{0,100}\b(view|access|continue|see|apply|job)\b|\b(view|access)\b.{0,80}\b(sign in|log in|login)\b/i
    .test(text);
}

function parseJobPostingHtml(html) {
  const rawText = extractMainText(html);
  if (isLoginWall(rawText)) {
    throw new LinkExtractionError(
      'LOGIN_REQUIRED',
      'This job page requires sign-in. Paste the text or upload a screenshot instead.',
    );
  }
  if (rawText.length < 50) {
    throw new LinkExtractionError(
      'CONTENT_NOT_FOUND',
      'No readable job description was found. The page may require JavaScript or may be empty.',
    );
  }
  if (!looksLikeJobPosting(rawText)) {
    throw new LinkExtractionError(
      'NOT_A_JOB_POSTING',
      'The link does not appear to contain a job posting. Try another link or use a different input method.',
    );
  }
  return rawText.slice(0, 50000);
}

async function extractJobDescriptionFromLink(input) {
  const url = validateAndNormalizeUrl(input);
  const html = await fetchHtml(url);
  return parseJobPostingHtml(html);
}

module.exports = {
  LinkExtractionError,
  extractJobDescriptionFromLink,
  parseJobPostingHtml,
  validateAndNormalizeUrl,
};
