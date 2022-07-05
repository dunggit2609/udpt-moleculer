'use strict';

const DbService = require('moleculer-db');

const getPagingData = require('../helpers/pagingData');
var apiResponse = require('../helpers/apiResponse');
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
const { ObjectID } = require('bson');

module.exports = {
  name: 'reviews',
  mixins: [DbService],
  adapter: new MongoDBAdapter(
    'mongodb+srv://anpha:123@cluster0.msdkr.mongodb.net/Review?retryWrites=true&w=majority',
    { useUnifiedTopology: true }
  ),
  collection: 'Review',
  /**
   * Service settings
   */
  settings: {
    fields: [
      '_id',
      'author',
      'rate',
      'content',
      'productID',
      'create_at',
      'update_at',
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
    getByProductID: {
      async handler(ctx) {
        let data = await this.adapter.find({
          query: { productID: ctx.params.productID },
        });

        return apiResponse.successResponseWithData('success', data);
      },
    },
    create: {
      async handler(ctx) {
        const { content, rate, productID } = ctx.params;
        const user_id = ctx.meta.user.user_id;
        let newReview = {
          _id: new ObjectID(),
          content: content,
          rate: rate,
          productID: productID,
          author: user_id,
          created_at: new Date(),
          updated_at: new Date(),
        };

        const review = await this.adapter.insert(newReview);
        if (!review) {
          return apiResponse.ErrorResponse('Created Failed');
        }

        return apiResponse.successResponseWithData('success', review);
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
