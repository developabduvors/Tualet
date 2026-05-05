function safeJsonParse(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { password, ...safeUser } = user;
  return safeUser;
}

function formatToilet(toilet) {
  if (!toilet) {
    return null;
  }

  return {
    ...toilet,
    images: safeJsonParse(toilet.images, [])
  };
}

function formatReview(review) {
  if (!review) {
    return null;
  }

  return {
    ...review,
    quick_feedback: safeJsonParse(review.quick_feedback, [])
  };
}

module.exports = {
  sanitizeUser,
  formatToilet,
  formatReview
};
