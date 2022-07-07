'use strict';

const DbService = require('moleculer-db');

const getPagingData = require('../helpers/pagingData');
var apiResponse = require('../helpers/apiResponse');
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
const { ObjectID } = require('bson');

module.exports = {
	name: 'shops',
	mixins: [ DbService ],
	adapter: new MongoDBAdapter(
		'mongodb+srv://thangbach:123@cluster0.msdkr.mongodb.net/Shop?retryWrites=true&w=majority',
		{ useUnifiedTopology: true }
	),
	collection: 'Shop',
	/**
   * Service settings
   */
	settings: {
		fields: [
			'_id',
			'name',
			'description',
			'business_cert',
			'bank_account',
			'work_zone',
			'email',
			'phone',
			'review',
			'location',
			'user_id',
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
		getByUserId: {
			async handler(ctx) {
				let data = await this.adapter.find({ query: { user_id: new ObjectID(ctx.params.id) } });
				console.log(data);
				if (data && data.length > 0) {
					return ctx.params.internal ? data[0] : apiResponse.successResponseWithData('success', data[0]);
				}

				return apiResponse.badRequestResponse('Not exists');
			}
		},

		getAll: {
			async handler(ctx) {}
		},

		create: {
			async handler(ctx) {
				try {
					console.log(ctx.params);
					const curDate = new Date();
					const {
						name,
						description,
						business_cert,
						bank_account,
						email,
						phone,
						user_id,
						location,
						review
					} = ctx.params;
					const data = await this.adapter.insert({
						name,
						description,
						business_cert,
						bank_account,
						email,
						phone,
						user_id,
						location,
						review
					});
					return apiResponse.successResponseWithData('successful create new shop', data);
				} catch (err) {
					return apiResponse.badRequestResponse('Cannot create');
				}
			}
		},

		update: {
			async handler(ctx) {
				console.log('in update shop');
				const _id = ctx.meta.user.user_id;
				const payload = JSON.parse(Object.keys(ctx.params)[0]);

				try {
					const shop = await this.adapter.find({ query: { _id: new ObjectID(_id) } });
					console.log(shop);
					console.log('_id: ', _id);
					let result = await this.adapter.updateById(_id, { $set: payload }, { new: true });
					console.log('result: ', result);
					if (result) {
						return apiResponse.successResponseWithData('successfully update a shop', result);
					}
					return apiResponse.ErrorResponse('Cannot update a shop');
				} catch (err) {
					return apiResponse.badRequestResponse('Cannot update a shop');
				}
			}
		},

		insertProduct: {
			async handler(ctx) {
				const shop_id = ctx.meta.user.user_id;
				console.log('shop_id: ', shop_id);
				const payload = JSON.parse(Object.keys(ctx.params)[0]);
				console.log(payload);
				let product = { shop_id, ...payload };
				console.log(product);
				try {
					let newProduct = await ctx.call('products.create', product);
					return apiResponse.successResponseWithData('successfully create a product', newProduct);
					console.log(newProduct);
				} catch (err) {
					return apiResponse.badRequestResponse('Cannot update a product');
				}
			}
		},

		updateProduct: {
			async handler(ctx) {
				const shop_id = ctx.meta.user.user_id;
				console.log('shop_id: ', shop_id);
				const payload = JSON.parse(Object.keys(ctx.params)[0]);
				console.log(payload);
				let product = { shop_id, ...payload };
				console.log(product);
				try {
					let newProduct = await ctx.call('products.update', product);
					return apiResponse.successResponseWithData('successfully update a product', newProduct);
					console.log(newProduct);
				} catch (err) {
					return apiResponse.badRequestResponse('Cannot update a product');
				}
			}
		},

		getOrderById: {
			async handler(ctx) {
				const shop_id = ctx.meta.user.user_id;
				console.log('shop_id: ', shop_id);
				console.log(ctx.params._id);
				try {
					let order = await ctx.call('orders.get', {
						id: ctx.params._id,
						internal: true
					});
					return apiResponse.successResponseWithData('successfully find an order', order);
				} catch (err) {
					return apiResponse.badRequestResponse('Cannot find order');
				}
			}
		},

		getAllProduct: {
			async handler(ctx) {
				const shop_id = ctx.meta.user.user_id;
				console.log('shop_id: ', shop_id);
				console.log(ctx.params._id);
				try {
					let products = await ctx.call('products.getAllProductByShop', {
						id: shop_id,
						internal: true
					});
					return apiResponse.successResponseWithData('successfully find all products', products);
				} catch (err) {
					return apiResponse.badRequestResponse('Cannot find products');
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
