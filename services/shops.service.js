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
				const shop_id = ctx.meta.user.user_id;
				console.log('shop_id: ', shop_id);
				try {
					const shop = await this.adapter.find({ query: { _id: new ObjectID(shop_id) } });
					console.log(shop);
					let { _id, ...updateShop } = ctx.params;
					console.log(updateShop);

					let result = await this.adapter.updateById(_id, { $set: updateShop }, { new: true });
					console.log('result: ', result);
					if (result) {
						return apiResponse.successResponseWithData('successfully update a shop', result);
					}
					return apiResponse.ErrorResponse('Cannot update a shop');
				} catch (err) {
					return apiResponse.badRequestResponse('Cannot update a shop');
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
