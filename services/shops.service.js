"use strict";

const DbService = require("moleculer-db");

const getPagingData = require("../helpers/pagingData");
var apiResponse = require("../helpers/apiResponse");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const { ObjectID } = require("bson");


module.exports = {
  name: "shops",
  mixins: [DbService],
  adapter: new MongoDBAdapter(
    "mongodb+srv://admin1:123@cluster0.msdkr.mongodb.net/Shop?retryWrites=true&w=majority",
    { useUnifiedTopology: true }
  ),
  collection: "Shop",
  /**
   * Service settings
   */
  settings: {
    fields: [
      "_id",
      "name",
      "description",
      "business_cert",
      "bank_account",
      "work_zone",
      "email",
      "phone",
      "review",
      "location",
      "user_id",
      "created_at",
      "updated_at",
    ],
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
				let data = await this.adapter.find({query: {user_id: new ObjectID(ctx.params.id)}})
				
				if (data && data.length > 0) {
					return ctx.params.internal ? data[0] :  apiResponse.successResponseWithData( "success", data[0])
				}

				return apiResponse.badRequestResponse("Not exists")
			}
    },
    getAll: {
      async handler(ctx) {},
    },
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
  stopped() {},
};
