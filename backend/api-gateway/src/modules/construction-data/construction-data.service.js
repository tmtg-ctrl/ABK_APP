const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SHEET_ID = '1vTQ6lKTP6rgqk_nPh008MeLr8izgiFWWhY5Ob-NaNrA';
const SHEETS_BY_YEAR = {
  2026: 'QUẢN LÝ CÔNG TRÌNH - 2026',
  2025: 'QUẢN LÝ CÔNG TRÌNH - 2025'
};
const READ_RANGE = 'A1:AL1200';
const PHOTO_STAGE_FOLDERS = {
  documents: { field: null, folder: '1. GIAY TO' },
  threeD: { field: null, folder: '2. 3D' },
  foundation: { field: 'foundation', folder: '3. MONG' },
  floor: { field: 'floor', folder: '4. SAN TANG' },
  rough: { field: 'rough', folder: '5. XAY THO' },
  finishing: { field: 'finishing', folder: '6. HOAN THIEN' }
};

const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const normalize = (value) =>
  clean(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w]+/g, '')
    .toUpperCase();

const cell = (row, index) => clean(row[index]);

const getSheetName = (year = '2026') => {
  const normalizedYear = String(year || '2026');
  const sheetName = SHEETS_BY_YEAR[normalizedYear];

  if (!sheetName) {
    const error = new Error('Unsupported construction sheet year. Use 2026 or 2025.');
    error.status = 400;
    throw error;
  }

  return sheetName;
};

const getGoogleAuth = () => {
  const keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (keyFilePath) {
    if (!fs.existsSync(keyFilePath)) {
      const error = new Error(`Google service account key file not found: ${keyFilePath}`);
      error.status = 501;
      throw error;
    }

    return new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
  }

  if (!clientEmail || !privateKey) {
    const error = new Error('Google Sheets access is not configured. Set GOOGLE_SERVICE_ACCOUNT_KEY_FILE or GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.');
    error.status = 501;
    throw error;
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
};

const getSheetsClient = () => google.sheets({ version: 'v4', auth: getGoogleAuth() });

const columnLetter = (index) => {
  let value = index + 1;
  let letter = '';

  while (value > 0) {
    const remainder = (value - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    value = Math.floor((value - 1) / 26);
  }

  return letter;
};

const fieldAliases = {
  image: ['ẢNH', 'Image'],
  stt: ['STT Tổng'],
  investorName: ['HỌ & TÊN', 'HỌ&TÊN CHỦ ĐẦU TƯ CÔNG TRÌNH'],
  itemDetail: ['CHI TIẾT HẠNG MỤC'],
  websiteUrl: ['link', 'LINK BÀI VIẾT WEB'],
  classification: ['PHÂN LOẠI', 'Phân loại'],
  note: ['GHI CHÚ'],
  savedImageAt: ['NGÀY LƯU ẢNH', 'Lưu DL vào ngày'],
  nextSaveAt: ['NGÀY LƯU KẾ TIẾP'],
  district: ['PHƯỜNG/TỈNH'],
  gdk: ['GĐK'],
  dataLink: ['LINK DỮ LIỆU'],
  zaloGroupName: ['Tên nhóm Zalo'],
  oldAddress: ['Đ/C CŨ'],
  newAddress: ['Đ/C MỚI'],
  shootingStatus: ['QUAY CÔNG TRÌNH'],
  kickoff: ['KHỞI CÔNG', 'Khởi công'],
  foundation: ['MÓNG', 'Móng'],
  floor: ['Sàn / Tầng'],
  roof: ['Cất nóc'],
  rough: ['Xây Thô', 'Thô'],
  finishing: ['Hoàn thiện'],
  actualProgress: ['TIẾN ĐỘ THỰC TẾ CỦA CÔNG TRÌNH'],
  dataStatus: ['Tình trạng dữ liệu'],
  fanpageProgress: ['TIẾN ĐỘ ĐÃ ĐĂNG FANPAGE'],
  imageProgress: ['Tiến độ làm hình'],
  address: ['ĐỊA ĐIỂM THI CÔNG'],
  constructionType: ['HẠNG MỤC THI CÔNG'],
  latestProgressLink: ['LINK TIẾN ĐỘ GẦN NHẤT'],
  websiteProgress: ['TIẾN ĐỘ ĐÃ ĐĂNG WEBSITE'],
  area: ['DIỆN TÍCH XÂY DỰNG'],
  contractValue: ['GIÁ TRỊ HỢP ĐỒNG'],
  alley: ['HẺM RỘNG']
};

const findHeaderIndex = (rows) =>
  rows.findIndex((row) => {
    const headers = row.map(normalize);
    return (
      headers.some((header) => header === normalize('LINK DỮ LIỆU')) &&
      headers.some((header) => header === normalize('GĐK')) &&
      headers.some((header) => header === normalize('Tên nhóm Zalo'))
    );
  });

const buildColumnMap = (headerRow) => {
  const normalizedHeaders = headerRow.map(normalize);

  return Object.entries(fieldAliases).reduce((map, [field, aliases]) => {
    const index = aliases
      .map((alias) => normalizedHeaders.indexOf(normalize(alias)))
      .find((candidate) => candidate >= 0);

    if (index >= 0) {
      map[field] = index;
    }

    return map;
  }, {});
};

const getValue = (row, columns, field) => {
  if (!Object.prototype.hasOwnProperty.call(columns, field)) {
    return '';
  }

  return cell(row, columns[field]);
};

const mapRow = (row, index, headerIndex, columns, year) => ({
  id: `${year}-${headerIndex + index + 2}-${getValue(row, columns, 'investorName')}`,
  year: String(year),
  sheetName: SHEETS_BY_YEAR[String(year)],
  sheetRowNumber: headerIndex + index + 2,
  stt: getValue(row, columns, 'stt'),
  investorName: getValue(row, columns, 'investorName'),
  dataLink: getValue(row, columns, 'dataLink'),
  zaloGroupName: getValue(row, columns, 'zaloGroupName'),
  gdk: getValue(row, columns, 'gdk'),
  oldAddress: getValue(row, columns, 'oldAddress'),
  newAddress: getValue(row, columns, 'newAddress'),
  address: getValue(row, columns, 'address') || getValue(row, columns, 'oldAddress'),
  district: getValue(row, columns, 'district'),
  classification: getValue(row, columns, 'classification'),
  shootingStatus: getValue(row, columns, 'shootingStatus'),
  savedImageAt: getValue(row, columns, 'savedImageAt'),
  nextSaveAt: getValue(row, columns, 'nextSaveAt'),
  kickoff: getValue(row, columns, 'kickoff'),
  foundation: getValue(row, columns, 'foundation'),
  floor: getValue(row, columns, 'floor'),
  roof: getValue(row, columns, 'roof'),
  rough: getValue(row, columns, 'rough'),
  finishing: getValue(row, columns, 'finishing'),
  actualProgress: getValue(row, columns, 'actualProgress'),
  dataStatus: getValue(row, columns, 'dataStatus'),
  fanpageProgress: getValue(row, columns, 'fanpageProgress'),
  imageProgress: getValue(row, columns, 'imageProgress'),
  note: getValue(row, columns, 'note'),
  itemDetail: getValue(row, columns, 'itemDetail'),
  constructionType: getValue(row, columns, 'constructionType'),
  latestProgressLink: getValue(row, columns, 'latestProgressLink'),
  websiteProgress: getValue(row, columns, 'websiteProgress'),
  websiteUrl: getValue(row, columns, 'websiteUrl'),
  area: getValue(row, columns, 'area'),
  contractValue: getValue(row, columns, 'contractValue'),
  alley: getValue(row, columns, 'alley'),
  source: 'google_sheet'
});

const readSheetRows = async (year) => {
  const sheetName = getSheetName(year);
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${sheetName}'!${READ_RANGE}`
  });

  const rows = response.data.values || [];
  const headerIndex = findHeaderIndex(rows);

  if (headerIndex < 0) {
    const error = new Error(`Unable to find construction data header in ${sheetName}`);
    error.status = 422;
    throw error;
  }

  return {
    sheetName,
    rows,
    headerIndex,
    columns: buildColumnMap(rows[headerIndex] || [])
  };
};

const getConstructionData = async ({ limit = 200, search = '', year = '2026' } = {}) => {
  const selectedYear = String(year || '2026');
  const { sheetName, rows, headerIndex, columns } = await readSheetRows(selectedYear);
  const query = clean(search).toLowerCase();
  const records = rows
    .slice(headerIndex + 1)
    .map((row, index) => mapRow(row, index, headerIndex, columns, selectedYear))
    .filter((record) => record.investorName || record.dataLink || record.zaloGroupName)
    .filter((record) => {
      if (!query) {
        return true;
      }

      return [
        record.investorName,
        record.dataLink,
        record.zaloGroupName,
        record.gdk,
        record.oldAddress,
        record.newAddress,
        record.address,
        record.classification,
        record.shootingStatus,
        record.note
      ].some((value) => String(value || '').toLowerCase().includes(query));
    })
    .slice(0, Number(limit) || 200);

  return {
    total: records.length,
    source: 'google_sheet',
    sheetId: SHEET_ID,
    sheetName,
    year: selectedYear,
    availableYears: Object.keys(SHEETS_BY_YEAR),
    columns: Object.keys(columns),
    records
  };
};

const allowedUpdateFields = [
  'investorName',
  'dataLink',
  'zaloGroupName',
  'gdk',
  'oldAddress',
  'newAddress',
  'address',
  'district',
  'classification',
  'shootingStatus',
  'savedImageAt',
  'nextSaveAt',
  'kickoff',
  'foundation',
  'floor',
  'roof',
  'rough',
  'finishing',
  'actualProgress',
  'dataStatus',
  'fanpageProgress',
  'imageProgress',
  'note',
  'itemDetail',
  'constructionType',
  'latestProgressLink',
  'websiteProgress',
  'websiteUrl',
  'area',
  'contractValue',
  'alley'
];

const today = () =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Bangkok'
  }).format(new Date());

const safeFilename = (filename) =>
  path.basename(filename || 'image').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_');

const ensureLocalDataPath = (dataLink) => {
  const folderPath = clean(dataLink);

  if (!folderPath) {
    const error = new Error('This construction row does not have LINK DỮ LIỆU yet.');
    error.status = 400;
    throw error;
  }

  if (/^https?:\/\//i.test(folderPath)) {
    const error = new Error('Photo upload currently supports local Windows folders from LINK DỮ LIỆU, not web links.');
    error.status = 400;
    throw error;
  }

  if (!path.win32.isAbsolute(folderPath)) {
    const error = new Error('LINK DỮ LIỆU must be an absolute Windows folder path.');
    error.status = 400;
    throw error;
  }

  return folderPath;
};

const getRecordBySheetRow = async (rowNumber, year) => {
  const selectedYear = String(year || '2026');
  const { rows, headerIndex, columns } = await readSheetRows(selectedYear);
  const rowIndex = rowNumber - headerIndex - 2;

  if (rowIndex < 0 || rowIndex >= rows.length - headerIndex - 1) {
    const error = new Error('Construction row was not found in the selected sheet year.');
    error.status = 404;
    throw error;
  }

  return mapRow(rows[headerIndex + 1 + rowIndex] || [], rowIndex, headerIndex, columns, selectedYear);
};

const getStageFolderPath = async (sheetRowNumber, { year = '2026', stage = 'foundation' } = {}) => {
  const rowNumber = Number(sheetRowNumber);

  if (!Number.isInteger(rowNumber) || rowNumber < 1) {
    const error = new Error('sheetRowNumber must be a valid Google Sheet row number');
    error.status = 400;
    throw error;
  }

  const stageConfig = PHOTO_STAGE_FOLDERS[stage];

  if (!stageConfig) {
    const error = new Error('Unsupported photo stage.');
    error.status = 400;
    throw error;
  }

  const record = await getRecordBySheetRow(rowNumber, year);
  const baseFolder = ensureLocalDataPath(record.dataLink);

  return {
    record,
    stageConfig,
    targetFolder: path.win32.join(baseFolder, stageConfig.folder)
  };
};

const isImageFile = (filename) => /\.(png|jpe?g|webp|bmp|gif)$/i.test(filename);

const listConstructionPhotos = async (sheetRowNumber, { year = '2026', stage = 'foundation' } = {}) => {
  const { targetFolder, stageConfig } = await getStageFolderPath(sheetRowNumber, { year, stage });

  if (!fs.existsSync(targetFolder)) {
    return {
      year: String(year),
      sheetRowNumber: Number(sheetRowNumber),
      stage,
      stageFolder: stageConfig.folder,
      folderPath: targetFolder,
      files: []
    };
  }

  const files = fs.readdirSync(targetFolder, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isImageFile(entry.name))
    .map((entry) => {
      const filePath = path.win32.join(targetFolder, entry.name);
      const stat = fs.statSync(filePath);

      return {
        name: entry.name,
        size: stat.size,
        modifiedAt: stat.mtime,
        url: `/api/construction-data/${sheetRowNumber}/photos/file?year=${encodeURIComponent(year)}&stage=${encodeURIComponent(stage)}&name=${encodeURIComponent(entry.name)}`
      };
    })
    .sort((left, right) => new Date(right.modifiedAt) - new Date(left.modifiedAt));

  return {
    year: String(year),
    sheetRowNumber: Number(sheetRowNumber),
    stage,
    stageFolder: stageConfig.folder,
    folderPath: targetFolder,
    files
  };
};

const resolveConstructionPhotoPath = async (sheetRowNumber, { year = '2026', stage = 'foundation', name } = {}) => {
  const { targetFolder } = await getStageFolderPath(sheetRowNumber, { year, stage });
  const fileName = path.basename(name || '');
  const filePath = path.win32.join(targetFolder, fileName);
  const resolvedFolder = path.win32.resolve(targetFolder);
  const resolvedFile = path.win32.resolve(filePath);

  if (!resolvedFile.toLowerCase().startsWith(`${resolvedFolder.toLowerCase()}\\`) || !isImageFile(fileName) || !fs.existsSync(resolvedFile)) {
    const error = new Error('Photo file was not found.');
    error.status = 404;
    throw error;
  }

  return resolvedFile;
};

const updateConstructionDataRow = async (sheetRowNumber, updates, { year = '2026' } = {}) => {
  const rowNumber = Number(sheetRowNumber);

  if (!Number.isInteger(rowNumber) || rowNumber < 1) {
    const error = new Error('sheetRowNumber must be a valid Google Sheet row number');
    error.status = 400;
    throw error;
  }

  const selectedYear = String(updates.year || year || '2026');
  const { sheetName, columns } = await readSheetRows(selectedYear);
  const data = allowedUpdateFields
    .filter((field) => Object.prototype.hasOwnProperty.call(updates, field))
    .filter((field) => Object.prototype.hasOwnProperty.call(columns, field))
    .map((field) => ({
      field,
      range: `'${sheetName}'!${columnLetter(columns[field])}${rowNumber}`,
      values: [[updates[field] ?? '']]
    }));

  if (!data.length) {
    const error = new Error('No supported construction fields were provided for update');
    error.status = 400;
    throw error;
  }

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: data.map(({ range, values }) => ({ range, values }))
    }
  });

  return {
    updated: true,
    sheetId: SHEET_ID,
    sheetName,
    year: selectedYear,
    sheetRowNumber: rowNumber,
    fields: data.map(({ field }) => field)
  };
};

const saveConstructionPhotos = async (sheetRowNumber, files = [], { year = '2026', stage = 'foundation' } = {}) => {
  const rowNumber = Number(sheetRowNumber);

  if (!Number.isInteger(rowNumber) || rowNumber < 1) {
    const error = new Error('sheetRowNumber must be a valid Google Sheet row number');
    error.status = 400;
    throw error;
  }

  const stageConfig = PHOTO_STAGE_FOLDERS[stage];

  if (!stageConfig) {
    const error = new Error('Unsupported photo stage.');
    error.status = 400;
    throw error;
  }

  if (!files.length) {
    const error = new Error('At least one photo file is required.');
    error.status = 400;
    throw error;
  }

  const { targetFolder } = await getStageFolderPath(rowNumber, { year, stage });

  fs.mkdirSync(targetFolder, { recursive: true });

  const savedFiles = files.map((file) => {
    const finalName = `${Date.now()}-${safeFilename(file.originalname)}`;
    const finalPath = path.win32.join(targetFolder, finalName);
    fs.renameSync(file.path, finalPath);

    return {
      originalName: file.originalname,
      filename: finalName,
      path: finalPath
    };
  });

  if (stageConfig.field) {
    const updatePayload = {
      year,
      [stageConfig.field]: 'Đã lưu ảnh',
      savedImageAt: today()
    };
    await updateConstructionDataRow(rowNumber, updatePayload, { year });
  }

  return {
    uploaded: true,
    year: String(year),
    sheetRowNumber: rowNumber,
    stage,
    stageFolder: stageConfig.folder,
    folderPath: targetFolder,
    files: savedFiles
  };
};

module.exports = {
  getConstructionData,
  listConstructionPhotos,
  resolveConstructionPhotoPath,
  updateConstructionDataRow,
  saveConstructionPhotos
};
