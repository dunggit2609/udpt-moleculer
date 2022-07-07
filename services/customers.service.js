'use strict';

const DbService = require('moleculer-db');

const getPagingData = require('../helpers/pagingData');
var apiResponse = require('../helpers/apiResponse');
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
const { ObjectID } = require('bson');

module.exports = {
  name: 'customers',
  mixins: [DbService],
  adapter: new MongoDBAdapter(
    'mongodb+srv://anpha:123@cluster0.msdkr.mongodb.net/Customer?retryWrites=true&w=majority',
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
      'updated_at',
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
    getAll: {
      async handler(ctx) {},
    },
    getInfo: {
      async handler(ctx) {
        let data = await this.getById(new ObjectID(ctx.meta.user.user_id));

        if (data) {
          return apiResponse.successResponseWithData('success', data);
        }

        return apiResponse.badRequestResponse('Not exists');
      },
    },
    create: {
      async handler(ctx) {
        let newCustomer = ctx.params;
        let userPayload = {
          ...newCustomer,
          _id: new ObjectID(),
          created_at: new Date(),
          updated_at: new Date(),
        };
        const customer = await this.adapter.insert(userPayload);
        if (!customer) {
          return apiResponse.ErrorResponse('Created Failed');
        }

        return apiResponse.successResponseWithData('success', customer);
      },
    },
    updateAddress: {
      async handler(ctx) {
        const user_id = ctx.meta.user;

        console.log(user_id);
        try {
          if (!ctx.meta.user) {
            return new MoleculerError('Unauthorized', 401);
          }
        } catch (err) {
          console.log('err', err);
          return apiResponse.ErrorResponse('Update failed');
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
