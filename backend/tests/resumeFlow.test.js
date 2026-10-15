const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const request = require('supertest');

process.env.SECRET_KEY = 'resume-flow-test-secret';
process.env.OPENAI_API_KEY = 'resume-flow-test-key';

const cvParser = require('../src/services/cvParser');
const fileStorage = require('../src/services/fileStorage');
const resumeAi = require('../src/services/resumeAi');
const generateResumeAnalysis = resumeAi.generateResumeAnalysis;
const { User } = require('../src/models');
const CV = require('../src/models/CV');
const JobDescription = require('../src/models/JobDescription');
const ResumeAnalysis = require('../src/models/ResumeAnalysis');

cvParser.parseCV = async () => 'Experienced candidate with five years of sales, software and customer engagement experience.';
cvParser.parseImageCv = async () => 'Experienced candidate with five years of sales, software and customer engagement experience.';
fileStorage.saveCv = async () => '/private/cvs/test-cv.pdf';
fileStorage.removeCv = async () => {};
resumeAi.generateResumeAnalysis = async () => ({
  score: 82,
  matchLevel: 'strong',
  summary: 'The CV provides relevant experience and skills for this role.',
  breakdown: { skills: 84, experience: 80, education: 75, keywords: 88 },
  matchedKeywords: ['sales', 'customer engagement'],
  missingKeywords: ['CRM'],
  strengths: ['Five years of customer-facing experience.'],
  gaps: ['No CRM tool is listed.'],
  suggestions: ['Add measurable results from sales work.'],
});
resumeAi.generateInterviewQuestions = async () => ([
  { category: 'technical', question: 'How do you qualify a lead?', tip: 'Describe your criteria and give a work example.' },
  { category: 'technical', question: 'Which CRM workflow would you use?', tip: 'Explain how you keep records accurate.' },
  { category: 'technical', question: 'How do you track pipeline health?', tip: 'Mention a metric and review cadence.' },
  { category: 'behavioral', question: 'Tell us about a difficult customer.', tip: 'Use a concise situation-action-result example.' },
  { category: 'behavioral', question: 'How do you handle rejection?', tip: 'Describe how you learn and follow up.' },
  { category: 'behavioral', question: 'How do you collaborate with a team?', tip: 'Share a specific example.' },
  { category: 'cv_gaps', question: 'Which CRM have you used?', tip: 'Be honest and explain how you would learn one.' },
  { category: 'cv_gaps', question: 'What sales result can you quantify?', tip: 'Use a real number and explain your contribution.' },
  { category: 'cv_gaps', question: 'How would you build industry knowledge?', tip: 'Give a practical learning plan.' },
]);

const userId = '64b000000000000000000001';
const cvId = '64b000000000000000000002';
const jobId = '64b000000000000000000003';
const analysisId = '64b000000000000000000004';
const token = jwt.sign({ sub: userId }, process.env.SECRET_KEY);
const { app } = require('../src/app');

test('active CV upload extracts text and returns private file metadata', async () => {
  const originals = {
    findById: User.findById,
    cvFindOne: CV.findOne,
    cvCreate: CV.create,
  };
  User.findById = async () => ({ _id: userId });
  CV.findOne = async () => null;
  CV.create = async (input) => ({ _id: cvId, ...input });

  try {
    const response = await request(app)
      .post('/api/cvs/active')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-test-content'), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      });
    assert.equal(response.status, 201, response.text);
    assert.equal(response.body.success, true);
    assert.equal(response.body.cv.id, cvId);
    assert.equal(response.body.cv.fileName, 'resume.pdf');
    assert.equal(response.body.cv.parsingStatus, 'completed');
    assert.equal(Object.hasOwn(response.body.cv, 'parsedText'), false);
  } finally {
    User.findById = originals.findById;
    CV.findOne = originals.cvFindOne;
    CV.create = originals.cvCreate;
  }
});

test('active CV upload rejects unsupported formats with a standard error', async () => {
  const originalFindById = User.findById;
  User.findById = async () => ({ _id: userId });
  try {
    const response = await request(app)
      .post('/api/cvs/active')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('plain text'), {
        filename: 'resume.txt',
        contentType: 'text/plain',
      });
    assert.equal(response.status, 415);
    assert.deepEqual(response.body.success, false);
    assert.equal(response.body.error.code, 'UNSUPPORTED_FILE_TYPE');
  } finally {
    User.findById = originalFindById;
  }
});

test('analysis and question endpoints return stored structured results', async () => {
  const originals = {
    findById: User.findById,
    cvFindOne: CV.findOne,
    jobFindOne: JobDescription.findOne,
    jobFind: JobDescription.find,
    analysisCreate: ResumeAnalysis.create,
    analysisFindOne: ResumeAnalysis.findOne,
    analysisFind: ResumeAnalysis.find,
  };
  const createdAt = new Date('2026-10-15T12:00:00.000Z');
  const jobDescription = {
    _id: jobId,
    title: 'Business Development Officer',
    company: 'Hirelume Test',
    rawText: 'Find new business customers and build relationships with business clients. Three years sales experience preferred.',
  };
  const analysis = {
    _id: analysisId,
    score: 82,
    matchLevel: 'strong',
    summary: 'The CV provides relevant experience and skills for this role.',
    breakdown: { skills: 84, experience: 80, education: 75, keywords: 88 },
    matchedKeywords: ['sales', 'customer engagement'],
    missingKeywords: ['CRM'],
    strengths: ['Five years of customer-facing experience.'],
    gaps: ['No CRM tool is listed.'],
    suggestions: ['Add measurable results from sales work.'],
    questions: [],
    cv_id: cvId,
    job_description_id: jobId,
    createdAt,
    save: async function save() { return this; },
  };
  User.findById = async () => ({ _id: userId });
  CV.findOne = async () => ({
    _id: cvId,
    parsedText: 'Experienced candidate with five years of sales and customer engagement experience.',
  });
  JobDescription.findOne = async () => jobDescription;
  ResumeAnalysis.create = async (data) => ({ ...analysis, ...data, _id: analysisId });
  ResumeAnalysis.findOne = async () => analysis;
  ResumeAnalysis.find = () => ({
    sort() { return this; },
    limit() { return this; },
    lean: async () => [{ ...analysis }],
  });
  JobDescription.find = () => ({
    select() { return this; },
    lean: async () => [jobDescription],
  });

  try {
    const created = await request(app)
      .post('/api/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({ cvId, jobDescriptionId: jobId });
    assert.equal(created.status, 201, created.text);
    assert.equal(created.body.analysis.score, 82);
    assert.equal(created.body.analysis.breakdown.skills, 84);

    const questions = await request(app)
      .post(`/api/analyses/${analysisId}/questions`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    assert.equal(questions.status, 200, questions.text);
    assert.equal(questions.body.questions.length, 9);
    assert.equal(questions.body.questions.filter((question) => question.category === 'cv_gaps').length, 3);

    const loaded = await request(app)
      .get(`/api/analyses/${analysisId}`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(loaded.status, 200, loaded.text);
    assert.equal(loaded.body.analysis.jobDescription.title, jobDescription.title);
    assert.equal(loaded.body.analysis.questions.length, 9);

    const history = await request(app)
      .get('/api/analyses')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(history.status, 200, history.text);
    assert.equal(history.body.analyses.length, 1);
    assert.equal(history.body.analyses[0].id, analysisId);
  } finally {
    User.findById = originals.findById;
    CV.findOne = originals.cvFindOne;
    JobDescription.findOne = originals.jobFindOne;
    JobDescription.find = originals.jobFind;
    ResumeAnalysis.create = originals.analysisCreate;
    ResumeAnalysis.findOne = originals.analysisFindOne;
    ResumeAnalysis.find = originals.analysisFind;
  }
});

test('AI provider validates structured output and strips personal contact details', async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  let requestBody;
  global.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          score: 72,
          matchLevel: 'good',
          summary: 'Relevant work experience is present.',
          breakdown: { skills: 70, experience: 75, education: 65, keywords: 78 },
          matchedKeywords: ['sales'],
          missingKeywords: ['CRM'],
          strengths: ['Customer-facing sales experience.'],
          gaps: ['CRM experience is not stated.'],
          suggestions: ['Add a real sales result.'],
        }) } }],
      }),
    };
  };
  try {
    const result = await generateResumeAnalysis(
      'Email candidate@example.com or call +234 803 555 0123. Address: 12 Ring Road. Five years in sales.',
      'Sales job requirements.',
    );
    assert.equal(result.score, 72);
    assert.match(requestBody.messages[1].content, /\[EMAIL REMOVED\]/);
    assert.match(requestBody.messages[1].content, /\[PHONE REMOVED\]/);
    assert.match(requestBody.messages[1].content, /\[ADDRESS REMOVED\]/);
    assert.doesNotMatch(requestBody.messages[1].content, /candidate@example\.com/);
    assert.doesNotMatch(requestBody.messages[1].content, /\+234 803 555 0123/);
    assert.doesNotMatch(requestBody.messages[1].content, /12 Ring Road/);
    assert.equal(requestBody.response_format.type, 'json_schema');
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});

test('AI provider retries malformed JSON once and maps provider rate limits', async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  const validContent = JSON.stringify({
    score: 67,
    matchLevel: 'good',
    summary: 'The experience partly matches the role.',
    breakdown: { skills: 66, experience: 70, education: 60, keywords: 68 },
    matchedKeywords: ['sales'],
    missingKeywords: ['CRM'],
    strengths: ['Customer experience.'],
    gaps: ['No CRM evidence.'],
    suggestions: ['Add measurable outcomes.'],
  });
  global.fetch = async () => {
    calls += 1;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: calls === 1 ? '{invalid' : validContent } }],
      }),
    };
  };
  try {
    const result = await generateResumeAnalysis('Sales and customer experience.', 'Sales role.');
    assert.equal(result.score, 67);
    assert.equal(calls, 2);

    global.fetch = async () => ({ ok: false, status: 429 });
    await assert.rejects(
      generateResumeAnalysis('Sales and customer experience.', 'Sales role.'),
      (error) => error.code === 'AI_RATE_LIMITED',
    );
  } finally {
    global.fetch = originalFetch;
  }
});
