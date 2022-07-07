'use strict';

const DbService = require('moleculer-db');

const getPagingData = require('../helpers/pagingData');
var apiResponse = require('../helpers/apiResponse');
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
const { ObjectID } = require('bson');

module.exports = {
	name: 'productCategories',
	mixins: [ DbService ],
	adapter: new MongoDBAdapter(
		'mongodb+srv://thangbach:123@cluster0.msdkr.mongodb.net/Product?retryWrites=true&w=majority',
		{ useUnifiedTopology: true }
	),
	collection: 'ProductCategory',
	/**
   * Service settings
   */
	settings: {
		fields: [ '_id', 'name', 'created_at', 'updated_at' ]
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
		getAll: {
			async handler(ctx) {
				let data = await this.adapter.find();
				console.log(data);
				if (data) {
					return apiResponse.successResponseWithData('success', data);
				}

				return apiResponse.badRequestResponse('Not exists');
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
