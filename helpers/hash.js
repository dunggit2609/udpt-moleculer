let bcrypt = require("bcrypt");

module.exports.hash = {
	hash: (data, salt) => {
		return new Promise((resolve, reject) => {
			bcrypt.hash(data, salt, (err, hash) => {
				if (err) {
					reject(err);
				} else {
					resolve(hash);
				}
			});
		});
	},

	compare: (data, origin) => {
		return new Promise((resolve, reject) => {
			bcrypt.compare(data, origin, (err, same) => {
				if (err) {
					reject(err)
				} else {
					resolve(same)
				}
			})
		})
	}
};
