const multer = require("multer");
const path = require("path");
const fs = require("fs");

const userUploadDir = "uploads/users";
const horseUploadDir = "uploads/horses";

if (!fs.existsSync(userUploadDir)) {
  fs.mkdirSync(userUploadDir, { recursive: true });
}

if (!fs.existsSync(horseUploadDir)) {
  fs.mkdirSync(horseUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.baseUrl.includes("users")) {
      cb(null, userUploadDir);
    } else if (req.baseUrl.includes("horses")) {
      cb(null, horseUploadDir);
    } else {
      cb(new Error("Ismeretlen feltöltési útvonal."));
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    if (req.baseUrl.includes("users")) {
      cb(null, `user-${req.user.felhasznalo_id}-${Date.now()}${ext}`);
    } else if (req.baseUrl.includes("horses")) {
      cb(null, `horse-${req.params.id}-${Date.now()}${ext}`);
    } else {
      cb(null, `${Date.now()}${ext}`);
    }
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Csak képfájl tölthető fel."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

module.exports = upload;