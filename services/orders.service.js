'use strict';

const DbService = require('moleculer-db');

const getPagingData = require('../helpers/pagingData');
var apiResponse = require('../helpers/apiResponse');
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
const { ObjectID } = require('bson');
const { USER_ROLE_SHIPPER, USER_ROLE_SHOP } = require('../constant');
const { MoleculerError } = require('moleculer').Errors;
module.exports = {
	name: 'orders',
	mixins: [ DbService ],
	adapter: new MongoDBAdapter(
		'mongodb+srv://thangbach:123@cluster0.msdkr.mongodb.net/Order?retryWrites=true&w=majority',
		{ useUnifiedTopology: true }
	),
	collection: 'Order',
	/**
   * Service settings
   */
	settings: {
		fields: [
			'_id',
			'payment',
			'review:',
			'customer_id',
			'shipper_id',
			'total_cost',
			'total_product',
			'status',
			'note',
			'product',
			'created_at',
			'updated_at'
		]
	},

	/**
   * Service metadata
   */
	metadata: {},

	/**
   * Service dependencies
   */
	//dependencies: [],

	/**
   * Actions
   */
	actions: {
		get: {
			async handler(ctx) {
				console.log('params._id: ', ctx.params.id);
				let data = await this.getById(new ObjectID(ctx.params.id));
				data = JSON.parse(JSON.stringify(data));
				if (data) {
					return apiResponse.successResponseWithData('success', data);
				}

				return apiResponse.badRequestResponse('Not exists');
			}
		},

		getAllByShipper: {
			async handler(ctx) {
				try {
					const { page, size, status } = ctx.params;
					const shipper_id = ctx.meta.user.user_id;
					const queries = {
						status: status,
						shipper_id: new ObjectID(shipper_id)
					};

					Object.keys(queries).forEach((x) => {
						if (queries[x] === null || queries[x] === undefined) {
							delete queries[x];
						}
					});

					const data = await this.adapter.find({
						query: queries
					});

					const { response, totalItems } = getPagingData(data, page, size);
					return apiResponse.successResponseWithPagingData('success', response, page, totalItems);
				} catch (err) {
					console.log('errrxx', err);
					return apiResponse.ErrorResponse('Cannot get order');
				}
			}
		},
		updateStatus: {
			async handler(ctx) {
				try {
					if (!ctx.meta.user) {
						return new MoleculerError('Unauthorized', 401);
					}

					const { order_id, status } = ctx.params;

					const { role, user_id } = ctx.meta.user;

					const order = await this.getById(new ObjectID(order_id));

					if (!order) {
						return apiResponse.badRequestResponse(res, 'Order not exists');
					}

					switch (role) {
						case USER_ROLE_SHIPPER:
							if (!order.shipper_id.equals(user_id)) {
								return apiResponse.forbiddenResponse();
							}
						case USER_ROLE_SHOP:
							if (!order.shop_id.equals(user_id)) {
								return apiResponse.forbiddenResponse();
							}
					}

					const result = await this._update(new ObjectID(order_id), {
						...order,
						status: status
					});

					if (!result) {
						return apiResponse.ErrorResponse('Update failed');
					}
					return apiResponse.successResponse('Success');
				} catch (err) {
					console.log('errrxx', err);
					return apiResponse.ErrorResponse('Cannot update order');
				}
			}
		},

		getAllByShop: {
			params: {
				limit: { type: 'number', optional: true, convert: true },
				offset: { type: 'number', optional: true, convert: true }
			},
			async handler(ctx) {
				const limit = ctx.params.limit ? Number(ctx.params.limit) : 20;
				const offset = ctx.params.offset ? Number(ctx.params.offset) : 0;
				let shop_id = ctx.meta.user.user_id;
				let params = {
					limit,
					offset,
					sort: [ '-created_at' ]
				};
				let countParams;

				countParams = Object.assign({}, params);
				// Remove pagination params
				if (countParams && countParams.limit) countParams.limit = null;
				if (countParams && countParams.offset) countParams.offset = null;

				const res = await this.Promise.all([
					// Get rows
					this.adapter.find({
						query: { shop_id: new ObjectID(ctx.meta.user.user_id) },
						limit: params.limit,
						offset: params.offset,
						sort: [ '-created_at' ]
					}),
					// this.adapter.find(params),
					// Get count of all rows
					this.adapter.count({ query: { shop_id: new ObjectID(ctx.meta.user.user_id) } })
				]);
				const docs = await this.transformDocuments(ctx, params, res[0]);
				const result = {
					orders: docs,
					orderCount: res[1]
				};
				console.log('result: ', result);

				if (result.orderCount > 0) {
					return apiResponse.successResponseWithData('success', result);
				}
				return apiResponse.badRequestResponse('Not exists');
			}
		},

		getNewOrderByShop: {
			async handler(ctx) {
				try {
					if (!ctx.meta.user || !ctx.meta.user.user_id) {
						return 'Unauthorized';
					}
					const shop_id = ctx.meta.user.user_id;
					const queries = {
						status: 0,
						shop_id: new ObjectID(shop_id)
					};

					Object.keys(queries).forEach((x) => {
						if (queries[x] === null || queries[x] === undefined || queries[x] == 'all') {
							delete queries[x];
						}
					});

					let data = await this.adapter.find({
						query: queries
					});
					console.log('zxc', data);
					if (data && data.length > 0) {
						return apiResponse.successResponseWithData('success', data[0]);
					} else {
						return apiResponse.successResponseWithData('no_data', null);
					}
				} catch (err) {
					console.log('errrxx', err);
					return apiResponse.ErrorResponse('Cannot get order');
				}
			}
		},

		getDetailByShop: {
			async handler(ctx) {
				if (!ctx.meta.user || !ctx.meta.user.user_id) {
					return 'Unauthorized';
				}

				let data = await this.getById(new ObjectID(ctx.params.id));
				data = JSON.parse(JSON.stringify(data));
				console.log('data: ', data);

				if (`${data.shop_id}` !== ctx.meta.user.user_id) {
					return 'Forbidden';
				}

				const productIds = data.product.map((x) => x.product_id);
				console.log('productIds: ', productIds);
				const products = await ctx.call('products.getByIds', productIds);
				console.log('products: ', products);

				data.products = [];
				if (products.length > 0) {
					data.product.forEach((x) => {
						const product = products.find((y) => `${y._id}` === `${x.product_id}`);
						if (product) {
							x = { ...x, ...product };
							data.products.push({ ...product, quantity: x.quantity });
						}
					});
				}

				delete data.product;

				const customer = await ctx.call('customers.getById', {
					id: data.customer_id
				});

				if (customer) {
					data.customer_info = customer;
				}

				const shop = await ctx.call('shops.getById', { id: data.shop_id });

				if (shop) {
					data.shop_info = shop;
				}
				console.log(data);
				if (data) {
					return apiResponse.successResponseWithData('success', data);
				}

				return apiResponse.successResponseWithData('Not exists', null);
			}
		},

		updateOrderWithShipperId: {
			async handler(ctx) {
				try {
					const payload = JSON.parse(Object.keys(ctx.params)[0]);
					const { order_id, shipper_id } = payload;

					const { role, user_id } = ctx.meta.user;

					console.log(order_id, shipper_id, role, user_id);

					const order = await this.getById(new ObjectID(order_id));

					if (!order) {
						return apiResponse.badRequestResponse(null, 'Order not exists');
					}

					switch (role) {
						case USER_ROLE_SHOP:
							if (!order.shop_id.equals(user_id)) {
								return apiResponse.forbiddenResponse();
							}
					}

					const result = await this._update(new ObjectID(order_id), {
						...order,
						status: 1,
						shipper_id: new ObjectID(shipper_id)
					});
					console.log(result);
					if (!result) {
						return apiResponse.ErrorResponse('Update failed');
					}
					return apiResponse.successResponse('Success');
				} catch (err) {
					console.log('errrxx', err);
					return apiResponse.ErrorResponse('Cannot update order');
				}
			}
		}
	},
	/**
   * Events
   */
	events: {},

	/**
   * Methods
   */
	methods: {},

	/**
   * Service created lifecycle event handler
   */
	created() {},

	/**
   * Service started lifecycle event handler
   */
	started() {},

	/**
   * Service stopped lifecycle event handler
   */
	stopped() {}
};
