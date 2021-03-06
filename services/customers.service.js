'use strict';

const DbService = require('moleculer-db');

const getPagingData = require('../helpers/pagingData');
var apiResponse = require('../helpers/apiResponse');
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
const { ObjectID } = require('bson');

module.exports = {
	name: 'customers',
	mixins: [ DbService ],
	adapter: new MongoDBAdapter(
		'mongodb+srv://thangbach:123@cluster0.msdkr.mongodb.net/Customer?retryWrites=true&w=majority',
		{ useUnifiedTopology: true }
	),
	collection: 'Customer',
	/**
   * Service settings
   */
	settings: {
		fields: [
			'_id',
			'full_name',
			'address',
			'identity',
			'bank_account',
			'area_zone',
			'email',
			'phone',
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
				let data = await this.adapter.find({
					query: { user_id: new ObjectID(ctx.params.id) }
				});

				if (data && data.length > 0) {
					return ctx.params.internal ? data[0] : apiResponse.successResponseWithData('success', data[0]);
				}

				return apiResponse.badRequestResponse('Not exists');
			}
		},
		list: {
			params: {
				limit: { type: 'number', optional: true, convert: true },
				offset: { type: 'number', optional: true, convert: true },
				search: { type: 'string', optional: true, convert: true }
			},
			async handler(ctx) {
				const limit = ctx.params.limit ? Number(ctx.params.limit) : 20;
				const offset = ctx.params.offset ? Number(ctx.params.offset) : 0;
				// const search = ctx.params.search ?? '';
				let params = {
					limit,
					offset,
					search,
					sort: [ '-created_at' ]
				};
				let countParams;

				countParams = Object.assign({}, params);
				// Remove pagination params
				if (countParams && countParams.limit) countParams.limit = null;
				if (countParams && countParams.offset) countParams.offset = null;

				const res = await this.Promise.all([
					// Get rows
					this.adapter.find(params),

					// Get count of all rows
					this.adapter.count(countParams)
				]);

				const docs = await this.transformDocuments(ctx, params, res[0]);
				const r = await this.transformResult(ctx, docs);
				r.customerCount = res[1];
				if (r.customerCount > 0) {
					return apiResponse.successResponseWithData('success', r);
				}
				return apiResponse.badRequestResponse('Not exists');
			}
		},
		getById: {
			async handler(ctx) {
				let data = await this.getById(new ObjectID(ctx.params.id));

				if (data) {
					return data;
				}
			}
		},
		getInfo: {
			async handler(ctx) {
				let data = await this.getById(new ObjectID(ctx.meta.user.user_id));

				if (data) {
					return apiResponse.successResponseWithData('success', data);
				}

				return apiResponse.badRequestResponse('Not exists');
			}
		},
		create: {
			async handler(ctx) {
				let newCustomer = ctx.params;
				let userPayload = {
					...newCustomer,
					_id: new ObjectID(),
					created_at: new Date(),
					updated_at: new Date()
				};
				const customer = await this.adapter.insert(userPayload);
				if (!customer) {
					return apiResponse.ErrorResponse('Created Failed');
				}

				return apiResponse.successResponseWithData('success', customer);
			}
		},
		updateAddress: {
			async handler(ctx) {
				const { user_id } = ctx.meta.user;

				console.log(user_id);
				try {
					if (!ctx.meta.user) {
						return new apiResponse.unauthorizedResponse('Unauthorized');
					}
					const key = Object.keys(ctx.params)[0];
					const { address, phone } = JSON.parse(key);
					const payload = { address, phone, updated_at: new Date() };
					const customer = this.adapter.updateById(user_id, { $set: payload }, { new: true });
					if (!customer) {
						return apiResponse.ErrorResponse('Updated Failed');
					} else {
						return apiResponse.successResponseWithData('Success', customer);
					}
				} catch (err) {
					console.log('err', err);
					return apiResponse.ErrorResponse('Update failed');
				}
			}
		},
		getCurrentUser: {
			async handler(ctx) {
				const { user_id } = ctx.meta.user;
				if (!user_id) {
					return apiResponse.unauthorizedResponse('Unauthorized');
				}
				let data = await this.getById(new ObjectID(user_id));

				if (data) {
					return apiResponse.successResponseWithData('Success', data);
				}
			}
		},

		getProductById: {
			async handler(ctx) {
				const id = ctx.params.id;
				const data = await ctx.call('products.get', {
					id: id
				});
				const { data: product } = data;
				return apiResponse.successResponseWithData('Success', product);
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
	methods: {
		/**
     * Transform the result entities to follow the RealWorld API spec
     *
     * @param {Context} ctx
     * @param {Array} entities
     * @param {Object} user - Logged in user
     */
		async transformResult(ctx, entities) {
			if (Array.isArray(entities)) {
				const customers = await this.Promise.all(entities.map((item) => this.transformEntity(ctx, item)));
				return { customers };
			} else {
				const customer = await this.transformEntity(ctx, entities);
				return { customer };
			}
		},

		/**
     * Transform a result entity to follow the RealWorld API spec
     *
     * @param {Context} ctx
     * @param {Object} entity
     * @param {Object} user - Logged in user
     */
		async transformEntity(ctx, entity) {
			if (!entity) return this.Promise.resolve();
			const res = await ctx.call('orders.getCountByCustomerId', {
				customer_id: entity._id.toString()
			});
			entity.totalOrders = res;
			return entity;
		}
	},

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
