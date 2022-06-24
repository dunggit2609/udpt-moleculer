const getPagination = (page, size) => {
  if (page <= 0) {
    page = 1;
  }
  const limit = size ? +size : 10;
  const offset = page ? (+page - 1) * limit : 0;
  return { limit, offset };
};

module.exports = getPagination;