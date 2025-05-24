/**
 * @param {import('mongoose').Query} query Mongoose query object
 * @param {number} page Current page number
 * @param {number} limit Number of items per page
 * @returns {Promise<Object>} Paginated results
 */
async function paginate(query, page, limit) {
  // Sanitize page and limit inputs
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const itemsPerPage = Math.max(1, parseInt(limit, 10) || 10);

  // Calculate skip value
  const skipValue = (pageNumber - 1) * itemsPerPage;

  // Clone the query for countDocuments to avoid issues with an already executed query
  const countQuery = query.clone();

  // Execute query with skip and limit
  const data = await query.skip(skipValue).limit(itemsPerPage).exec();

  // Get total count of documents
  const totalItems = await countQuery.countDocuments();

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    data,
    currentPage: pageNumber,
    totalPages,
    totalItems,
    itemsPerPage,
  };
}

module.exports = { paginate };
