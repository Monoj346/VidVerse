import multer from "multer";
import path from "path";
import crypto from "crypto";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },

  filename: function (req, file, cb) {
    const safeName = path.basename(file.originalname);

    const uniqueName = `${crypto.randomUUID()}-${safeName}`;

    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
});