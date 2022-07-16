'use strict';

const DbService = require('moleculer-db');

const getPagingData = require('../helpers/pagingData');
var apiResponse = require('../helpers/apiResponse');
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
const { ObjectID } = require('bson');
const { USER_ROLE_SHIPPER } = require('../constant');
const { MoleculerError } = require('moleculer').Errors;
const { format } = require('date-fns');
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
			'review',
			'customer_id',
			'shipper_id',
			'total_cost',
			'total_product',
			'status',
			'note',
			'product',
			'shop_id',
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
		getDetailByShipper: {
			async handler(ctx) {
				if (!ctx.meta.user || !ctx.meta.user.user_id) {
					return 'Unauthorized';
				}

				let data = await this.getById(new ObjectID(ctx.params.id));
				data = JSON.parse(JSON.stringify(data));

				if (`${data.shipper_id}` !== ctx.meta.user.user_id) {
					return 'Forbidden';
				}

				const productIds = data.product.map((x) => x.product_id);
				const products = await ctx.call('products.getByIds', productIds);
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

				if (data && data.customer_info) {
					return apiResponse.successResponseWithData('success', data);
				}

				return apiResponse.successResponseWithData('Not exists', null);
			}
		},
		getDeliveringOrderByShipper: {
			async handler(ctx) {
				try {
					if (!ctx.meta.user || !ctx.meta.user.user_id) {
						return 'Unauthorized';
					}
					const shipper_id = ctx.meta.user.user_id;
					const queries = {
						status: '2',
						shipper_id: new ObjectID(shipper_id)
					};

					Object.keys(queries).forEach((x) => {
						if (queries[x] === null || queries[x] === undefined || queries[x] == 'all') {
							delete queries[x];
						}
					});

					let data = await this.adapter.find({
						query: queries
					});

					if (data && data.length > 0) {
						const rs = await ctx.call('orders.getDetailByShipper', {
							id: data[0]._id
						});

						if (!rs.success) {
							return apiResponse.successResponseWithData('no_data', null);
						}

						return apiResponse.successResponseWithData('success', rs.data);
					} else {
						return apiResponse.successResponseWithData('no_data', null);
					}
				} catch (err) {
					console.log('errrxx', err);
					return apiResponse.ErrorResponse('Cannot get order');
				}
			}
		},
		getAllByShipper: {
			async handler(ctx) {
				try {
					if (!ctx.meta.user || !ctx.meta.user.user_id) {
						return 'Unauthorized';
					}
					const payload = JSON.parse(Object.keys(ctx.params)[0]);

					const { page, size, status, order_id, from, to } = payload;
					const shipper_id = ctx.meta.user.user_id;
					const queries = {
						status: status,
						shipper_id: new ObjectID(shipper_id)
					};

					Object.keys(queries).forEach((x) => {
						if (queries[x] === null || queries[x] === undefined || queries[x] == 'all') {
							delete queries[x];
						}
					});

					let data = await this.adapter.find({
						query: queries
					});

					const fromDate = from
						? new Date(format(typeof from === 'string' ? new Date(from) : from, 'yyyy-MM-dd'))
						: null;
					const toDate = to
						? new Date(format(typeof to === 'string' ? new Date(to) : to, 'yyyy-MM-dd'))
						: null;

					data = data.filter((x) => {
						return (
							// `${x._id}`.includes(order_id ?? '') &&
							(status !== 'all' || [ '3', '-3', '-2' ].includes(x.status)) &&
							(!fromDate || new Date(format(x.created_at, 'yyyy-MM-dd')) >= fromDate) &&
							(!toDate || new Date(format(x.created_at, 'yyyy-MM-dd')) <= toDate)
						);
					});
					const { response, totalItems } = getPagingData(data, page, size);
					return apiResponse.successResponseWithPagingData('success', response, page, totalItems);
				} catch (err) {
					console.log('errrxx', err);
					return apiResponse.ErrorResponse('Cannot get order');
				}
			}
		},
		getCountByShipperId: {
			async handler(ctx) {
				let params = {
					query: {
						shipper_id: new ObjectID(ctx.params.shipper_id)
					}
				};

				const res = await this.adapter.count(params);

				return res;
			}
		},
		getCountByCustomerId: {
			async handler(ctx) {
				let params = {
					query: {
						customer_id: new ObjectID(ctx.params.customer_id)
					}
				};

				const res = await this.adapter.count(params);

				return res;
			}
		},
		updateStatus: {
			async handler(ctx) {
				try {
					if (!ctx.meta.user) {
						return 'Unauthorized';
					}
					const payload = JSON.parse(Object.keys(ctx.params)[0]);

					const { order_id, status } = payload;

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
							break;
						// case USER_ROLE_SHOP:
						//   if (!order.shop_id?.equals(user_id)) {
						//     return apiResponse.forbiddenResponse();
						//   }
						//   break;
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

		getNewOrderByShipper: {
			async handler(ctx) {
				try {
					if (!ctx.meta.user || !ctx.meta.user.user_id) {
						return 'Unauthorized';
					}
					const shipper_id = ctx.meta.user.user_id;
					const queries = {
						status: '1',
						shipper_id: new ObjectID(shipper_id)
					};

					Object.keys(queries).forEach((x) => {
						if (queries[x] === null || queries[x] === undefined || queries[x] == 'all') {
							delete queries[x];
						}
					});

					let data = await this.adapter.find({
						query: queries
					});
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
						status: '0',
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
				if (data) {
					return apiResponse.successResponseWithData('success', data);
				}

				return apiResponse.successResponseWithData('Not exists', null);
			}
		},

		createOrder: {
			async handler(ctx) {
				try {
					if (!ctx.meta.user) {
						return new apiResponse.unauthorizedResponse('Unauthorized');
					}

					const { user_id } = ctx.meta.user;
					const key = Object.keys(ctx.params)[0];
					const value = '[' + Object.keys(ctx.params[key])[0] + ']';

					const items = JSON.parse(value);

					const products = [];

					const { data: payment } = await ctx.call('payment.getByPaymentID', {
						payment_id: '62555abfe078c36742dcd866'
					});

					for (const item of items) {
						console.log(item);
						const data = await ctx.call('products.get', {
							id: item.id
						});
						const { data: product } = data;

						if (!product) return apiResponse.notFoundResponse({}, `Product ${item.id} not found`);
						if (item.quantity > product.inventory) {
							return apiResponse.badRequestResponse(
								`Insufficient inventory for ${item.id} - ${product.name}`
							);
						}
						products.push({ ...product, quantity: item.quantity });
					}
					const orders = {};

					for (const product of products) {
						console.log(product);
						if (!orders[product.shop_id]) {
							orders[product.shop_id] = {
								created_at: new Date(),
								updated_at: new Date(),
								_id: new ObjectID(),
								product: [],
								customer_id: user_id,
								shipper_id: null,
								total_cost: 0,
								total_product: 0,
								payment: {
									status: false,
									_id: payment._id
								},
								shop_id: product.shop_id
							};
						}

						orders[product.shop_id].product.push({
							product_id: product._id,
							quantity: product.quantity
						});
						orders[product.shop_id].total_cost += product.unit_price * product.quantity;
						orders[product.shop_id].total_product += product.quantity;
					}

					let ordersArr = Object.values(orders);
					console.log(ordersArr);

					let result = await this.adapter.insertMany(ordersArr);

					if (!result) {
						return apiResponse.ErrorResponse('Created Failed');
					}

					return apiResponse.successResponseWithData('Success', result);
				} catch (err) {
					return apiResponse.ErrorResponse(err + '');
				}
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
					const result = await this._update(new ObjectID(order_id), {
						...order,
						status: '1',
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
