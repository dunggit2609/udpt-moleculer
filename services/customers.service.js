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
				let data = await this.adapter.find({ query: { user_id: new ObjectID(ctx.params.id) } });

				if (data && data.length > 0) {
					return ctx.params.internal ? data[0] : apiResponse.successResponseWithData('success', data[0]);
				}

				return apiResponse.badRequestResponse('Not exists');
			}
		},
		getAll: {
			async handler(ctx) {}
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
