const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const {
  privateCvDirectory,
} = require("../services/fileStorage");

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const allowedExtensions = [".pdf", ".doc", ".docx"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, privateCvDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const randomName = crypto
      .randomBytes(32)
      .toString("hex");

    cb(null, `${randomName}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const validMimeType = allowedMimeTypes.includes(
    file.mimetype
  );

  const validExtension =
    allowedExtensions.includes(extension);

  if (!validMimeType || !validExtension) {
    return cb(
      new Error(
        "Invalid CV file. Only PDF, DOC and DOCX files are allowed."
      )
    );
  }

  cb(null, true);
};

const uploadCv = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = uploadCv;
