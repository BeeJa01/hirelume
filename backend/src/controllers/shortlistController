
const Application = require("../models/Application");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendShortlistEmail } = require("../services/emailService");

const shortlistApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(
      applicationId
    ).populate("job");

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    // Only a recruiter who owns the job can shortlist.
   if (
  req.user.role !== "recruiter" ||
  !application.job ||
  !application.job.recruiter_id ||
  application.job.recruiter_id.toString() !==
    req.user._id.toString()
) {
  return res.status(403).json({
    message: "Not authorized to shortlist this application",
  });
}
if (!applicant || applicant.role !== "job_seeker") {
  return res.status(404).json({
    message: "Applicant not found",
  });
}
    // Avoid sending duplicate emails and notifications.
    if (application.status === "shortlisted") {
      return res.status(200).json({
        message: "Application is already shortlisted",
        application,
      });
    }

    // Update the application.
    application.status = "shortlisted";
    await application.save();

    const applicant = await User.findById(
      application.applicant
    );

    if (!applicant) {
      return res.status(404).json({
        message: "Applicant not found",
      });
    }

    const jobTitle =
      application.job.title ||
      application.job.jobTitle ||
      "the position";

    // Create an in-app notification.
    const notification = await Notification.create({
      recipient: applicant._id,
      application: application._id,
      type: "application_shortlisted",
      title: "Application shortlisted!",
      message: `Your application for ${jobTitle} has been shortlisted.`,
    });

    // Send the email.
    let emailSent = false;

    try {
      await sendShortlistEmail({
        email: applicant.email,
        applicantName: applicant.name || "Applicant",
        jobTitle,
      });

      emailSent = true;
    } catch (emailError) {
      console.error("Shortlist email failed:", emailError);
    }

    return res.status(200).json({
      message: "Application shortlisted successfully",
      application,
      notification,
      emailSent,
    });
  } catch (error) {
    console.error("Shortlisting error:", error);

    return res.status(500).json({
      message: "Failed to shortlist application",
    });
  }
};

module.exports = { shortlistApplication };
