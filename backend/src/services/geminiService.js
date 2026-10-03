const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

async function generateAIResponse(prompt) {
  try {
    const result = await model.generateContent(prompt);

    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("AI analysis failed");
  }
}

module.exports = {
  generateAIResponse,
};