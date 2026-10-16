const Application = require("../models/Application");
const AnalysisResult = require("../models/AnalysisResult");

const getResultByToken = async (req, res) => {
  try {
    const token = req.params.token;

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(404).json({ detail: "RESULT_NOT_FOUND" });
    }

    const application = await Application.findOne({
      privateResultToken: token,
    }).select("_id analysisStatus");

    if (!application) {
      return res.status(404).json({ detail: "RESULT_NOT_FOUND" });
    }

    const response = {
      application_id: String(application._id),
      analysis_status: application.analysisStatus || "pending",
      analysis: null,
    };

    if (application.analysisStatus === "completed") {
      const result = await AnalysisResult.findOne({
        application_id: application._id,
      }).sort({ created_at: -1 }).lean();

      if (result) {
        try {
          response.analysis = JSON.parse(result.result_json);
        } catch {
          return res.status(500).json({ detail: "RESULT_INVALID" });
        }

        response.score = result.score;
        response.match_level = result.match_level;
        response.reason = result.reason;
      } else {
        response.analysis_status = "failed";
      }
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Result lookup failed:", error.message);
    return res.status(500).json({ detail: "RESULT_LOOKUP_FAILED" });
  }
};

module.exports = { getResultByToken };
