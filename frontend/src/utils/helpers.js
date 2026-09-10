/**
 * Format a date string into readable format
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Truncate text to a given maximum length
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Generate user initials from name or email
 */
export const getInitials = (nameOrEmail) => {
  if (!nameOrEmail) return 'U';
  const parts = nameOrEmail.split('@')[0].split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return nameOrEmail.slice(0, 2).toUpperCase();
};
