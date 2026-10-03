const CV = require("../models/CV");
const Job = require("../models/Job");
const AIAnalysis = require("../models/aiAnalysis");

const {
  generateAIResponse,
} = require("../services/geminiService");

const {
  buildFitCheckPrompt,
} = require("../utils/aiPrompt");

// AI Fit Check
const fitCheck = async (req, res) => {
  try {
    const userId = req.user.sub;

if (!userId) {
  return res.status(401).json({
    message: "User identity not found in authentication token",
  });
}
    const { jobId } = req.params;

    // 1. Find the job
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    // 2. Find the applicant's CV
    const cv = await CV.findOne({
      applicant: userId,
    });

    if (!cv) {
      return res.status(404).json({
        message: "CV not found. Please upload a CV first.",
      });
    }

    // 3. Make sure the CV has been processed
    if (!cv.parsedText) {
      return res.status(400).json({
        message: "CV must be processed before AI analysis.",
      });
    }

    // 4. Prepare the job information for Gemini
    const jobData = {
      title: job.title,
      description: job.description,
     requirements: (job.requirements || []).map((requirement) => ({
        text: requirement.text,
        requirement_type: requirement.requirement_type,
      })),
    };

    // 5. Create the Gemini prompt
    const prompt = buildFitCheckPrompt({
      job: jobData,
      cv: cv.parsedText,
    });

    // 6. Send prompt to Gemini
    const aiText = await generateAIResponse(prompt);

    // 7. Clean Gemini's response
    const cleanedText = aiText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // 8. Convert Gemini response into an object
    let analysis;

    try {
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Gemini JSON parsing error:", parseError);
      console.error("Gemini response:", aiText);

      return res.status(502).json({
        message: "AI returned an invalid response.",
      });
    }

    // 9. Validate the fit score
    if (
      typeof analysis.fitScore !== "number" ||
      analysis.fitScore < 0 ||
      analysis.fitScore > 100
    ) {
      return res.status(502).json({
        message: "AI returned an invalid fit score.",
      });
    }

    // 10. Save the analysis
    const savedAnalysis = await AIAnalysis.create({
      applicant: userId,
      job: job._id,
      type: "fit_check",
      score: analysis.fitScore,
      result: analysis,
      model: "gemini-2.5-flash",
    });

    // 11. Return the result
    return res.status(200).json({
      message: "AI fit check completed successfully",
      analysis: savedAnalysis,
    });
  } catch (error) {
    console.error("AI fit check error:", error);

    return res.status(500).json({
      message: "Failed to perform AI fit check",
      error: error.message,
    });
  }
};

module.exports = {
  fitCheck,
};