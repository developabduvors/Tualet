async function recalculateToiletRating(tx, toiletId) {
  const aggregate = await tx.review.aggregate({
    where: { toiletId },
    _avg: { rating: true }
  });

  await tx.toilet.update({
    where: { id: toiletId },
    data: {
      avg_rating: Number((aggregate._avg.rating || 0).toFixed(1))
    }
  });
}

module.exports = {
  recalculateToiletRating
};
