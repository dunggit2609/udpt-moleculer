"use strict";

const DbService = require("moleculer-db");

const getPagingData = require("../helpers/pagingData");
var apiResponse = require("../helpers/apiResponse");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const { ObjectID } = require("bson");

module.exports = {
  name: "products",
  mixins: [DbService],
  adapter: new MongoDBAdapter(
    "mongodb+srv://admin1:123@cluster0.msdkr.mongodb.net/Product?retryWrites=true&w=majority",
    { useUnifiedTopology: true }
  ),
  collection: "Product",
  /**
   * Service settings
   */
  settings: {
    fields: [],
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
        let data = await this.getById(new ObjectID(ctx.params.id));
        data = JSON.parse(JSON.stringify(data));
        if (data) {
          return apiResponse.successResponseWithData("success", data);
        }

        return apiResponse.badRequestResponse("Not exists");
      },
    },
    getAll: {
      async handler(ctx) {},
    },
    getByIds: {
      async handler(ctx) {

        const ids = ctx.params;
        let data = await this.adapter.find();
        
        return data.filter(x => ids.includes(`${x._id}`))
      },
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
