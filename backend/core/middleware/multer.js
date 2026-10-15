import multer from "multer";

const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    console.log("📁 MULTER: Processing file:", file.originalname);
    callback(null, file.originalname);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, callback) => {
    console.log("🔍 MULTER: File filter check:", file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
    } else {
      console.error("❌ MULTER: Invalid file type:", file.mimetype);
      callback(new Error('Only image files are allowed'), false);
    }
  }
});

export default upload;
