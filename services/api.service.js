'use strict';

const ApiGateway = require('moleculer-web');
const ApiService = require('moleculer-web');
const jwt = require('jsonwebtoken');

module.exports = {
	name: 'api',
	mixins: [ ApiGateway, ApiService ],

	// More info about settings: http://moleculer.services/docs/moleculer-web.html
	settings: {
		port: process.env.PORT || 3000,

		routes: [
			{
				path: '/api',
				whitelist: [
					// Access to any actions in all services
					'*'
				],
				aliases: {
					'GET /shippers/:id': 'shippers.getByUserId',
					'POST /shippers/update-health': 'shippers.updateHealth',
					'GET /shippers/get/me': 'shippers.getInfo',

					'POST /users/register': 'users.register',
					'POST /users/login': 'users.login',

					'POST /orders/getAllByShipper': 'orders.getAllByShipper',
					'POST /orders/update-status': 'orders.updateStatus',

					'POST /shop/create': 'shops.create',
					'PUT /shop/update': 'shops.update'
				},
				onBeforeCall(ctx, route, req, res) {
					let accessToken = req.headers['authorization'];
					if (accessToken) {
						var decoded = jwt.decode(accessToken);

						//user_id nay la id cua tung role, vd role shipper
						//thi user_id nay la shipper_id chu khong phai user_id trong bang user
						ctx.meta.user = { role: decoded.role, user_id: decoded.user_id };
					} else {
						return 'Unauthorized';
					}
				}
			}
		]
	}
};
