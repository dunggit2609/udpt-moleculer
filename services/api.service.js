'use strict';

const ApiGateway = require('moleculer-web');
const ApiService = require('moleculer-web');
const jwt = require('jsonwebtoken');
module.exports = {
  name: 'api',
  mixins: [ApiGateway, ApiService],

  // More info about settings: http://moleculer.services/docs/moleculer-web.html
  settings: {
    port: process.env.PORT || 3000,
    cors: {
      // Configures the Access-Control-Allow-Origin CORS header.
      origin: 'http://localhost:8888',
      // Configures the Access-Control-Allow-Methods CORS header.
      methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
      // Configures the Access-Control-Allow-Headers CORS header.
      allowedHeaders: [],
      // Configures the Access-Control-Expose-Headers CORS header.
      exposedHeaders: [],
      // Configures the Access-Control-Allow-Credentials CORS header.
      credentials: false,
      // Configures the Access-Control-Max-Age CORS header.
      maxAge: 3600,
    },
    routes: [
      {
        path: '/api',
        whitelist: [
          // Access to any actions in all services
          '*',
        ],
        aliases: {
          'GET /shippers/:id': 'shippers.getByUserId',
          'POST /shippers/update-health': 'shippers.updateHealth',
          'GET /shippers/get/me': 'shippers.getInfo',
          'GET /shippers': 'shippers.list',
					'GET /shippers/listShipper': 'shippers.listShipper',

          'GET /customers': 'customers.list',
          'POST /shippers/getHealthHistory': 'shippers.getHealthHistory',

          'POST /users/register': 'users.register',
          'POST /users/login': 'users.login',

          'POST /orders/getAllByShipper': 'orders.getAllByShipper',
          'GET /orders/getDetailByShipper': 'orders.getDetailByShipper',
          'GET /orders/getDeliveringOrderByShipper':
            'orders.getDeliveringOrderByShipper',
          'GET /orders/getNewOrderByShipper': 'orders.getNewOrderByShipper',
          'POST /orders/update-status': 'orders.updateStatus',

         
					'GET /orders/get/:id': 'orders.get',
					'GET /orders/getAllByShop': 'orders.getAllByShop',
					'GET /orders/getNewOrderByShop': 'orders.getNewOrderByShop',
					'GET /orders/getDetailByShop': 'orders.getDetailByShop',
					'POST /orders/updateOrderWithShipperId': 'orders.updateOrderWithShipperId',

          'GET /reviews/get/:id': 'reviews.get',
          'POST /reviews/create': 'reviews.create',
          'GET /reviews/getAll/:productID': 'reviews.listByProduct',
          'GET /reviews': 'reviews.list',
          'PUT /reviews/update/:id': 'reviews.update',
          'PUT /reviews/reply/:id': 'reviews.reply',

          "GET /shops": "shops.list",
          "PUT /shops/update-status/:id": "shops.updateShopStatus",
          'GET /shops/listShop': 'shops.listShop',
          'POST /products/cusGetAllProductByShop': 'products.cusGetAllProductByShop',
          'GET /products/cusGetAllByIds': 'products.cusGetAllByIds',

          'POST /orders': 'orders.createOrder',

          'GET /reviews/:productID': 'reviews.getByProductID',
          'POST /reviews/': 'reviews.customerCreate',

          'GET /customers/me': 'customers.getCurrentUser',
          'POST customers/shipping-info': 'customers.updateAddress',

          'GET /products/search': 'products.searchAndFilter',

          'POST /shop/create': 'shops.create',
          'POST /shop/update': 'shops.update',
          'POST /shop/insertProduct': 'shops.insertProduct',
          'POST /shop/updateProduct': 'shops.updateProduct',
          'POST /shop/getOrderById': 'shops.getOrderById',
          'GET /shop/getAllProduct': 'shops.getAllProduct',
         
			
					'GET /shop/getById': 'shops.getById',

          'POST /product/create': 'products.create',
          'PUT /product/update': 'products.update',
          'GET /product/getAll': 'products.getAll',
          'GET /product/getAllProductByShop': 'products.getAllProductByShop',

					'GET /product/getByIds': 'products.getByIds',
					'POST /product/create': 'products.create',
					'PUT /product/update': 'products.update',
					'GET /product/getAll': 'products.getAll',
					'GET /product/getAllProductByShop': 'products.getAllProductByShop',
					'GET /product/getProductByShop': 'products.getProductByShop',

					'GET /productCategory/getAll': 'productCategories.getAll',
					'GET /productCategory/get/:id': 'productCategories.get',

					'GET /customer/getById': 'customers.getById',
          "GET /system-reviews/get/:id": "systemReviews.get",
          "POST /system-reviews/create": "systemReviews.create",
          "GET /system-reviews": "systemReviews.list",
          "POST /system-reviews/reply/:id": "systemReviews.reply",
					'GET /payments': 'payments.list'
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
				},
				bodyParsers: {
					json: true,
					urlencoded: { extended: true }
				}
			}
		]
	}
};
