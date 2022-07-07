'use strict';

const DbService = require('moleculer-db');

const getPagingData = require('../helpers/pagingData');
var apiResponse = require('../helpers/apiResponse');
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
const { ObjectID } = require('bson');
const { USER_ROLE_SHIPPER } = require('../constant');
const { MoleculerError } = require('moleculer').Errors;

module.exports = {
  name: 'orders',
  mixins: [DbService],
  adapter: new MongoDBAdapter(
    'mongodb+srv://anpha:123@cluster0.msdkr.mongodb.net/Order?retryWrites=true&w=majority',
    { useUnifiedTopology: true }
  ),
  collection: 'Order',
  /**
   * Service settings
   */
  settings: {
    fields: [
      '_id',
      'payment',
      'review',
      'customer_id',
      'shipper_id',
      'total_cost',
      'total_product',
      'status',
      'note',
      'product',
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
    getAllByShipper: {
      async handler(ctx) {
        try {
          const { page, size, status } = ctx.params;
          const shipper_id = ctx.meta.user.user_id;
          const queries = {
            status: status,
            shipper_id: new ObjectID(shipper_id),
          };

          Object.keys(queries).forEach((x) => {
            if (queries[x] === null || queries[x] === undefined) {
              delete queries[x];
            }
          });

          const data = await this.adapter.find({
            query: queries,
          });

          const { response, totalItems } = getPagingData(data, page, size);
          return apiResponse.successResponseWithPagingData(
            'success',
            response,
            page,
            totalItems
          );
        } catch (err) {
          console.log('errrxx', err);
          return apiResponse.ErrorResponse('Cannot get order');
        }
      },
    },
    updateStatus: {
      async handler(ctx) {
        try {
          if (!ctx.meta.user) {
            return new MoleculerError('Unauthorized', 401);
          }

          const { order_id, status } = ctx.params;

          const { role, user_id } = ctx.meta.user;

          const order = await this.getById(new ObjectID(order_id));

          if (!order) {
            return apiResponse.badRequestResponse(res, 'Order not exists');
          }

          switch (role) {
            case USER_ROLE_SHIPPER:
              if (!order.shipper_id.equals(user_id)) {
                return apiResponse.forbiddenResponse();
              }
          }

          const result = await this._update(new ObjectID(order_id), {
            ...order,
            status: status,
          });

          if (!result) {
            return apiResponse.ErrorResponse('Update failed');
          }
          return apiResponse.successResponse('Success');
        } catch (err) {
          console.log('errrxx', err);
          return apiResponse.ErrorResponse('Cannot update order');
        }
      },
    },

    createOrder: {
      async handler(ctx) {
        try {
          if (!ctx.meta.user) {
            return new MoleculerError('Unauthorized', 401);
          }

          const { user_id } = ctx.meta.user;

          const { items, payment_id } = ctx.params;
          const products = [];

          const { data: payment } = await ctx.call('payment.getByPaymentID', {
            payment_id,
          });

          for (const item of items) {
            const { data: product } = await ctx.call('products.get', {
              id: item.id,
            });
            console.log(product);
            if (!product)
              return apiResponse.notFoundResponse(
                {},
                `Product ${item.id} not found`
              );

            if (item.quantity > product.inventory) {
              return apiResponse.badRequestResponse(
                `Insufficient inventory for ${item.id} - ${product.name}`
              );
            }
            products.push({ ...product, quantity: item.quantity });
          }

          const order = {
            created_at: new Date(),
            updated_at: new Date(),
            _id: new ObjectID(),
            product: [],
            customer_id: user_id,
            shipper_id: null,
            total_cost: 0,
            total_product: 0,
            payment: {
              status: true,
              _id: payment._id,
            },
          };
          for (const product of products) {
            order.product.push({
              product_id: new ObjectID(product._id),
              quantity: product.quantity,
            });
            order.total_cost += product.unit_price;
            order.total_product++;

            await ctx.call('products.subInventory', {
              productID: product._id,
              productQuantity: product.quantity,
            });
          }

          const orderRes = await this.adapter.insert(order);
          if (!orderRes) {
            return apiResponse.ErrorResponse('Created Failed');
          }

          return apiResponse.successResponseWithData('success', orderRes);
        } catch (err) {
          return apiResponse.ErrorResponse(err);
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
