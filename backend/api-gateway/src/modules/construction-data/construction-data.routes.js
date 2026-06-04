const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const constructionDataController = require('./construction-data.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');

const uploadTempDir = path.join(process.cwd(), 'uploads', 'construction-photos');
fs.mkdirSync(uploadTempDir, { recursive: true });

const upload = multer({
  dest: uploadTempDir,
  limits: {
    fileSize: 200 * 1024 * 1024,
    files: 80
  },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error('Only image files are supported.'));
  }
});

router.use(authenticate);

router.get('/', constructionDataController.listConstructionData);
router.put('/:sheetRowNumber', constructionDataController.updateConstructionData);
router.get('/:sheetRowNumber/photos', constructionDataController.listConstructionPhotos);
router.get('/:sheetRowNumber/photos/file', constructionDataController.getConstructionPhotoFile);
router.post('/:sheetRowNumber/photos', upload.array('photos', 80), constructionDataController.uploadConstructionPhotos);

module.exports = router;
