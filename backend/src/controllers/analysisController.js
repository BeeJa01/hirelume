const { analyzeCV } = require("../services/aiAnalysisService");
const { calculateFinalScore } = require("../utils/scoring");

// Mock Application model - REPLACE with your real model path
// const Application = require("../models/Application");

const analyzeApplication = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { jobDescription, jobTitle } = req.body;

    // 1. Get CV Text - This depends on Dev 2's work. For now we accept cvText directly for demo
    // TODO: Later replace with DB fetch: const app = await Application.findById(applicationId)
    let cvText = req.body.cvText;

    if (!cvText && req.body.applicationId) {
      // If main app already has Application model, uncomment below
      // const application = await Application.findById(applicationId);
      // if (!application) return res.status(404).json({ message: "Application not found" });
      // cvText = application.cvText || application.parsedText;
    }

    if (!cvText) {
      return res.status(400).json({ message: "cvText is required. Send parsed CV text from Dev 2." });
    }

    if (!jobDescription) {
      return res.status(400).json({ message: "jobDescription is required for analysis" });
    }

    // 2. Call AI
    const aiResult = await analyzeCV(cvText, jobDescription, jobTitle);

    // 3. Apply extra scoring rules
    const finalResult = calculateFinalScore(aiResult, {
      isBlindMode: req.query.blind === "true",
    });

    // 4. Save to DB (Ask Admin before enabling this if it changes schema)
    // if you have application model:
    // await Application.findByIdAndUpdate(applicationId, {
    //   analysis: finalResult,
    //   analysisStatus: "completed"
    // });

    res.status(200).json({
      success: true,
      applicationId,
      analysis: finalResult,
    });

  } catch (error) {
    console.error("Analysis Controller Error:", error);
    next(error); // Let Dev 6's error handler handle it
  }
};

// For testing without DB - just analyze raw text
const analyzeRawText = async (req, res, next) => {
  try {
    const { cvText, jobDescription, jobTitle } = req.body;
    const result = await analyzeCV(cvText, jobDescription, jobTitle);
    const finalResult = calculateFinalScore(result);
    res.json({ success: true, analysis: finalResult });
  } catch (error) {
    next(error);
  }
};

module.exports = { analyzeApplication, analyzeRawText };
