const generatePhoneSlug = (phoneData) => {
  const slugParts = [];

  if (phoneData.name) {
    const cleanedName = phoneData.name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
    slugParts.push(cleanedName);
  }

  slugParts.push('price-in-india');

  return slugParts.join('-');
};

const generateNewsSlug = (title) => {
  if (!title) return '';

  const stopWords = [
    'a',
    'an',
    'the',
    'in',
    'on',
    'of',
    'for',
    'to',
    'is',
    'are',
    'was',
    'were',
    'includes',
    'and',
    'with',
    'by',
    'as',
    'at',
    'from',
    'its',
    'it',
    'a',
    'deeper',
    'focus',
    'expanding',
  ];

  const cleanedTitle = title
    .toLowerCase()
    .replace(/[:’'s]/g, '') // remove punctuation like :, ', ’s
    .replace(/[^\w\s-]/g, '') // remove remaining non-word chars except spaces and hyphens
    .split(' ') // split into words
    .filter((word) => word && !stopWords.includes(word)) // remove stop words
    .join('-'); // join back with hyphens

  // Truncate to a reasonable number of words to avoid overly long slugs
  const wordLimit = 7;
  const slugWords = cleanedTitle.split('-');
  let finalSlug = cleanedTitle;
  if (slugWords.length > wordLimit) {
    finalSlug = slugWords.slice(0, wordLimit).join('-');
  }

  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${finalSlug}-${randomSuffix}`;
};

module.exports = { generatePhoneSlug, generateNewsSlug };
