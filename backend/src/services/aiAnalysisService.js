const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

// Initialize clients
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// THE MASTER PROMPT - This does all the work
const buildPrompt = (cvText, jobDescription, jobTitle) => {
  return `
You are an expert ATS and technical recruiter. Analyze the CV against the Job Description.

JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription}

CV TEXT:
${cvText}

Return ONLY a valid JSON object, no markdown, no explanation. Format:
{
  "score": number (0-100),
  "summary": "2-3 sentences overall fit summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["gap 1", "gap 2"],
  "skills_matched": ["skill1", "skill2"],
  "skills_missing": ["skill1", "skill2"],
  "experience_relevance": number (0-100),
  "education_relevance": number (0-100),
  "recommendation": "HIGHLY_RECOMMENDED" | "RECOMMENDED" | "MAYBE" | "NOT_RECOMMENDED"
}

Scoring Rules:
- 80-100 = Highly matches, 60-79 = Good match, 40-59 = Partial, 0-39 = Poor
- Be strict, don't hallucinate skills not in CV
- If CV is empty or unreadable, score 0 and summary = "CV unreadable"
`;
};

const parseAIResponse = (text) => {
  try {
    // Clean markdown ```json if AI adds it
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse AI JSON:", text);
    throw new Error("AI returned invalid JSON format");
  }
};

// GEMINI FUNCTION
const analyzeWithGemini = async (cvText, jobDescription, jobTitle) => {
  if (!genAI) throw new Error("Gemini API key not set");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = buildPrompt(cvText, jobDescription, jobTitle);
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return parseAIResponse(response.text());
};

// GROQ FUNCTION - Very fast, good fallback
const analyzeWithGroq = async (cvText, jobDescription, jobTitle) => {
  if (!groq) throw new Error("Groq API key not set");
  const prompt = buildPrompt(cvText, jobDescription, jobTitle);
  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.1-8b-instant", // fast and cheap, use llama-3.1-70b-versatile for better quality
    temperature: 0.2,
    response_format: { type: "json_object" },
  });
  return parseAIResponse(chatCompletion.choices[0].message.content);
};

// MAIN FUNCTION - Admin fit switch provider
const analyzeCV = async (cvText, jobDescription, jobTitle = "General") => {
  if (!cvText || cvText.trim().length < 50) {
    return {
      score: 0,
      summary: "CV text is too short or unreadable.",
      strengths: [],
      weaknesses: ["CV not readable"],
      skills_matched: [],
      skills_missing: [],
      experience_relevance: 0,
      education_relevance: 0,
      recommendation: "NOT_RECOMMENDED",
      provider: "system",
    };
  }

  const provider = process.env.AI_PROVIDER || "gemini";
  
  try {
    let result;
    if (provider === "groq") {
      result = await analyzeWithGroq(cvText, jobDescription, jobTitle);
      result.provider = "groq";
    } else {
      result = await analyzeWithGemini(cvText, jobDescription, jobTitle);
      result.provider = "gemini";
    }
    result.analyzed_at = new Date();
    return result;
  } catch (error) {
    console.error(`Error with ${provider}:`, error.message);
    // AUTOMATIC FALLBACK: If gemini fails, try groq
    if (provider === "gemini" && groq) {
      console.log("Falling back to Groq...");
      const fallback = await analyzeWithGroq(cvText, jobDescription, jobTitle);
      fallback.provider = "groq-fallback";
      fallback.analyzed_at = new Date();
      return fallback;
    }
    throw error;
  }
};

module.exports = { analyzeCV, analyzeWithGemini, analyzeWithGroq };