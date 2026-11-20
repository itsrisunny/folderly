// declared mime -> allowed extensions
const ALLOWED_TYPES = Object.freeze({
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.csv'], // Windows browsers send this for CSV
  'text/plain': ['.txt'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
});

// Types with no magic bytes – validated as plain text instead
const TEXT_TYPES = new Set(['text/csv', 'application/vnd.ms-excel', 'text/plain']);

module.exports = { ALLOWED_TYPES, TEXT_TYPES };
