'use strict';

const DbService = require('moleculer-db');

const getPagingData = require('../helpers/pagingData');
var apiResponse = require('../helpers/apiResponse');
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
const { ObjectID } = require('bson');

module.exports = {
  name: 'shops',
  mixins: [DbService],
  adapter: new MongoDBAdapter(
    'mongodb+srv://anpha:123@cluster0.msdkr.mongodb.net/Shop?retryWrites=true&w=majority',
    { useUnifiedTopology: true }
  ),
  collection: 'Shop',
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
      "isActive",
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
        let data = await this.adapter.find({
          query: { user_id: new ObjectID(ctx.params.id) },
        });

        if (data && data.length > 0) {
          return ctx.params.internal
            ? data[0]
            : apiResponse.successResponseWithData('success', data[0]);
        }

        return apiResponse.badRequestResponse('Not exists');
      },
    },

    list: {
      params: {
        limit: { type: "number", optional: true, convert: true },
        offset: { type: "number", optional: true, convert: true },
      },
      async handler(ctx) {
        const limit = ctx.params.limit ? Number(ctx.params.limit) : 20;
        const offset = ctx.params.offset ? Number(ctx.params.offset) : 0;

        let params = {
          limit,
          offset,
          sort: ["-created_at"],
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
          this.adapter.count(countParams),
        ]);

        const docs = await this.transformDocuments(ctx, params, res[0]);
        const result = {
          shops: docs,
          shopCount: res[1],
        };

        if (result.shopCount > 0) {
          return apiResponse.successResponseWithData("success", result);
        }
        return apiResponse.badRequestResponse("Not exists");
      },
    },
    getById: {
      async handler(ctx) {
        let data = await this.getById(new ObjectID(ctx.params.id));

        if (data) {
          return data;
        }
      },
    },
    verifyBusinessCert: {
      async handler(ctx) {
        let data = await this.getById(new ObjectID(ctx.params.id));

        if (data) {
          return data;
        }
      },
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
            review,
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
            review,
          });
          return apiResponse.successResponseWithData(
            'successful create new shop',
            data
          );
        } catch (err) {
          return apiResponse.badRequestResponse('Cannot create');
        }
      },
    },

    update: {
      async handler(ctx) {
        try {
          let { _id, ...updateShop } = ctx.params;
          console.log(updateShop);
          let shop = await this.adapter.find({
            query: { _id: new ObjectID(_id) },
          });
          console.log(shop);
          let result = await this.adapter.updateById(
            _id,
            { $set: updateShop },
            { new: true }
          );
          console.log('result: ', result);
          return apiResponse.successResponseWithData(
            'successfully update a shop',
            result
          );
        } catch (err) {
          return apiResponse.badRequestResponse('Cannot update a shop');
        }
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
