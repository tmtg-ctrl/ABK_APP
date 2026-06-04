const {
  createConstructionDataRow,
  getConstructionData,
  listConstructionPhotos,
  resolveConstructionPhotoPath,
  saveConstructionPhotos,
  updateConstructionDataRow
} = require('./construction-data.service');

exports.listConstructionData = async (req, res, next) => {
  try {
    const data = await getConstructionData({
      limit: req.query.limit,
      search: req.query.search,
      year: req.query.year
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

exports.updateConstructionData = async (req, res, next) => {
  try {
    const result = await updateConstructionDataRow(req.params.sheetRowNumber, req.body, {
      year: req.query.year
    });

    res.status(200).json({
      message: 'Construction sheet row updated successfully',
      result
    });
  } catch (error) {
    next(error);
  }
};

exports.createConstructionData = async (req, res, next) => {
  try {
    const result = await createConstructionDataRow(req.body, {
      year: req.query.year
    });

    res.status(201).json({
      message: 'Construction sheet row created successfully',
      result
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadConstructionPhotos = async (req, res, next) => {
  try {
    const result = await saveConstructionPhotos(req.params.sheetRowNumber, req.files, {
      year: req.query.year || req.body.year,
      stage: req.body.stage
    });

    res.status(201).json({
      message: 'Construction photos uploaded successfully',
      result
    });
  } catch (error) {
    next(error);
  }
};

exports.listConstructionPhotos = async (req, res, next) => {
  try {
    const result = await listConstructionPhotos(req.params.sheetRowNumber, {
      year: req.query.year,
      stage: req.query.stage
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getConstructionPhotoFile = async (req, res, next) => {
  try {
    const filePath = await resolveConstructionPhotoPath(req.params.sheetRowNumber, {
      year: req.query.year,
      stage: req.query.stage,
      name: req.query.name
    });

    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};
