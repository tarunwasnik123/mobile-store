// Escape user-supplied strings before building RegExp to avoid ReDoS and unintended regex patterns
exports.escapeRegExp = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
