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
					'GET /orders/get/:id': 'orders.get',
					'GET /orders/getAllByShop': 'orders.getAllByShop',

					'POST /shop/create': 'shops.create',
					'POST /shop/update': 'shops.update',
					'POST /shop/insertProduct': 'shops.insertProduct',
					'POST /shop/updateProduct': 'shops.updateProduct',
					'POST /shop/getOrderById': 'shops.getOrderById',
					'GET /shop/getAllProduct': 'shops.getAllProduct',

					'POST /product/create': 'products.create',
					'PUT /product/update': 'products.update',
					'GET /product/getAll': 'products.getAll',
					'GET /product/getAllProductByShop': 'products.getAllProductByShop',
					'GET /product/getProductByShop': 'products.getProductByShop',

					'GET /productCategory/getAll': 'productCategories.getAll',
					'GET /productCategory/get/:id': 'productCategories.get'
				},
				onBeforeCall(ctx, route, req, res) {
					let accessToken = req.headers['authorization'];
					if (accessToken) {
						var decoded = jwt.decode(accessToken);
						console.log(accessToken);
						console.log(decoded);
						//user_id nay la id cua tung role, vd role shipper
						//thi user_id nay la shipper_id chu khong phai user_id trong bang user
						ctx.meta.user = { role: decoded.role, user_id: decoded.user_id };
					} else {
						return 'Unauthorized';
					}
				},
				bodyParsers: {
					json: true,
					urlencoded: { extended: true }
				}
			}
		]
	}
};
