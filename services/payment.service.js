'use strict';

const DbService = require('moleculer-db');

const getPagingData = require('../helpers/pagingData');
var apiResponse = require('../helpers/apiResponse');
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
const { ObjectID } = require('bson');

module.exports = {
	name: 'payment',
	mixins: [ DbService ],
	adapter: new MongoDBAdapter(
		'mongodb+srv://thangbach:123@cluster0.msdkr.mongodb.net/Payment?retryWrites=true&w=majority',
		{ useUnifiedTopology: true }
	),
	collection: 'Payment',
	/**
   * Service settings
   */
	settings: {
		fields: [ '_id', 'name', 'create_at', 'update_at' ]
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
		getByPaymentID: {
			async handler(ctx) {
				let data = await this.adapter.find({
					query: { _id: ObjectID(ctx.params.payment_id) }
				});
				data = data[0];
				console.log(ctx.params.payment_id);
				return apiResponse.successResponseWithData('success', data);
			}
		},
		getAll: {
			async handler(ctx) {
				let data = await this.adapter.find();
				data = JSON.parse(JSON.stringify(data));
				if (data) {
					return apiResponse.successResponseWithData('success', data);
				}

				return apiResponse.badRequestResponse('Not exists');
			}
		},
		list: {
			async handler(ctx) {
				return apiResponse.successResponseWithData('success', this.adapter.find());
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
