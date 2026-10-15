const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  htmlToText, isPrivateAddress, extractJobTextFromLink, extractJobTextFromScreenshots,
} = require('../src/services/flow2Source');

test('Flow 2 link text conversion removes executable markup and keeps readable content', () => {
  const text = htmlToText(`
    <html><style>.hidden { display:none }</style><script>alert('x')</script>
    <main><h1>Backend Engineer</h1><p>Build APIs &amp; maintain services.</p></main></html>
  `);
  assert.match(text, /Backend Engineer/);
  assert.match(text, /Build APIs & maintain services/);
  assert.doesNotMatch(text, /alert|display:none/);
});

test('Flow 2 job links reject loopback and private network destinations', async () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '172.16.1.1', '192.168.1.1', '::1', 'fd00::1']) {
    assert.equal(isPrivateAddress(address), true);
  }
  assert.equal(isPrivateAddress('8.8.8.8'), false);
  await assert.rejects(extractJobTextFromLink('http://127.0.0.1/job'), /Private URL/);
});

test('Flow 2 screenshot OCR runs locally and rejects images without readable job text', async () => {
  const onePixelPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
  await assert.rejects(
    extractJobTextFromScreenshots([{ buffer: onePixelPng, mimetype: 'image/png' }]),
    /Not enough text/,
  );
});
