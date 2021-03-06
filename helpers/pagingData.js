
const getPagination = require("./pagination");
const getPagingData = (data, page, size) => {

	const { limit, offset } = getPagination(page, size);
	
	const response = data.slice(offset, limit + offset);
	const totalItems = data.length;
	return { totalItems, response };
};

module.exports = getPagingData;