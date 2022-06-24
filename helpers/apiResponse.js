exports.successResponse = ( msg) => {
	let data = {
		success: true,
		message: msg
	};

	return data;
};

exports.successResponseWithData = (msg, data) => {
	let resData = {
		success: true,
		message: msg,
		data: data
	};
	console.log("x", resData)
	return resData;
};
exports.successResponseWithFile = (res, msg, data) => {
	let resData = {
		success: true,
		message: msg
	};

	res.status(200).json(resData);
};

exports.successResponseWithPagingData = (msg, data, page, totalItems) => {

	let resData = {
		success: true,
		message: msg,
		data: {
			items: data,
			current_page: page,
			total_items: totalItems
		}
	};
	return resData;
};

exports.ErrorResponse = function ( msg) {
	let data = {
		success: false,
		message: msg,
	};
	return data;
};

exports.notFoundResponse = function (res, msg) {
	let data = {
		success: false,
		message: msg,
	};
	return res.status(404).json(data);
};

exports.validationErrorWithData = function (res, msg, data) {
	let resData = {
		success: false,
		message: msg,
		data: data
	};
	return res.status(400).json(resData);
};

exports.unauthorizedResponse = function ( msg) {
	let data = {
		success: false,
		message: msg,
	};
	return data;
};

exports.forbiddenResponse = function (res) {
	let data = {
		success: false,
		message: "You don't have permission to access",
	};
	return data;
};

exports.badRequestResponse = function  (msg) {
	let data = {
		success: false,
		message: msg,
	};
	return data;
};

exports.conflictResponse = function (msg) {
	let data = {
		success: false,
		message: msg
	};
	return data;
};

exports.conflictResponseWithData = function (res, msg, data) {
	let resData = {
		success: false,
		message: msg,
		data: data
	};
	return res.status(409).json(resData);
};