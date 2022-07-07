'use strict';

const DbService = require('moleculer-db');

const getPagingData = require('../helpers/pagingData');
var apiResponse = require('../helpers/apiResponse');
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
const { ObjectID } = require('bson');

module.exports = {
  name: 'products',
  mixins: [DbService],
  adapter: new MongoDBAdapter(
    'mongodb+srv://anpha:123@cluster0.msdkr.mongodb.net/Product?retryWrites=true&w=majority',
    { useUnifiedTopology: true }
  ),
  collection: 'Product',
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
          return apiResponse.successResponseWithData('success', data);
        }

        return apiResponse.badRequestResponse('Not exists');
      },
    },
    getAll: {
      async handler(ctx) {},
    },
    subInventory: {
      async handler(ctx) {
        let data = await this.getById(new ObjectID(ctx.params.productID));
        if (data) {
          data = JSON.parse(JSON.stringify(data));
          data.inventory = data.inventory - ctx.params.productQuantity;
          await this.adapter.updateById(ctx.params.productID, {
            $inc: { inventory: -ctx.params.productQuantity },
          });
          return apiResponse.successResponse('success');
        }
      },
    },
    searchAndFilter: {
      async handler(ctx) {
        const { keyword, sort, order, page, size } = ctx.params;
        let data = await this.adapter.find({ $text: { $search: keyword } });

        const { totalItems, response } = getPagingData(data, page, size);
        return apiResponse.successResponseWithPagingData(
          'Success',
          response,
          page,
          totalItems
        );
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
