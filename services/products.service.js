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
    'mongodb+srv://admin1:123@cluster0.msdkr.mongodb.net/Product?retryWrites=true&w=majority',
    { useUnifiedTopology: true }
  ),
  collection: 'Product',
  /**
   * Service settings
   */
  settings: {
    fields: [
      '_id',
      'name',
      'description',
      'inventory',
      'unit_price',
      'unit',
      'product_type',
      'shop_id',
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
    getByIds: {
      async handler(ctx) {
        const ids = ctx.params;
        let data = await this.adapter.find();

        return data.filter((x) => ids.includes(`${x._id}`));
      },
    },
    getAll: {
      async handler(ctx) {
        let data = await this.adapter.find();
        data = JSON.parse(JSON.stringify(data));
        if (data) {
          return apiResponse.successResponseWithData('success', data);
        }

        return apiResponse.badRequestResponse('Not exists');
      },
    },

    getAllProductByShop: {
      async handler(ctx) {
        console.log('params._id: ', ctx.params.id);
        let data = await this.adapter.find({
          query: { shop_id: ctx.params.id },
        });
        data = JSON.parse(JSON.stringify(data));
        if (data) {
          return apiResponse.successResponseWithData('success', data);
        }

        return apiResponse.badRequestResponse('Not exists');
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
            inventory,
            unit_price,
            unit,
            product_type,
            shop_id,
          } = ctx.params;
          const data = await this.adapter.insert({
            name,
            description,
            inventory,
            unit_price,
            unit,
            product_type,
            shop_id,
            created_at: curDate,
            updated_at: curDate,
          });
          return apiResponse.successResponseWithData(
            'successful create new product',
            data
          );
        } catch (err) {
          return apiResponse.badRequestResponse('Cannot create a product');
        }
      },
    },

    update: {
      async handler(ctx) {
        try {
          //const curDate = new Date();
          const product_id = ctx.params._id;
          console.log(product_id);
          let { _id, ...updateProduct } = ctx.params;
          console.log(updateProduct);
          let curProduct = await this.adapter.find({
            query: { _id: new ObjectID(product_id) },
          });
          console.log('curProduct: ', curProduct);
          let result = await this.adapter.updateById(
            _id,
            { $set: { ...updateProduct } },
            { new: true }
          );
          console.log('result: ', result);
          return apiResponse.successResponseWithData(
            'successful update product',
            result
          );
        } catch (err) {
          return apiResponse.badRequestResponse('Cannot create a product');
        }
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
