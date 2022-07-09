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
    'mongodb+srv://admin1:123@cluster0.msdkr.mongodb.net/Product?retryWrites=true&w=majority',
    { useUnifiedTopology: true }
  ),
  collection: "Product",
  /**
   * Service settings
   */
  settings: {
    fields: [
      "_id",
      "name",
      "description",
      "inventory",
      "unit_price",
      "unit",
      "product_type",
      "shop_id",
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
    get: {
			async handler(ctx) {
				let data = await this.getById(new ObjectID(ctx.params.id));
				data = JSON.parse(JSON.stringify(data));
				if (data) {
					return apiResponse.successResponseWithData('success', data);
				}

				return apiResponse.badRequestResponse('Not exists');
			}
		},
    getAll: {
      async handler(ctx) {
        let data = await this.adapter.find();
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
    subInventory: {
      async handler(ctx) {
        let data = await this.getById(new ObjectID(ctx.params.productID));
        if (data) {
          data = JSON.parse(JSON.stringify(data));
          data.inventory = data.inventory - ctx.params.productQuantity;
          await this.adapter.updateById(ctx.params.productID, {
            $inc: { inventory: -ctx.params.productQuantity },
          });
          return apiResponse.successResponse("success");
        }
      },
    },
    searchAndFilter: {
      async handler(ctx) {
        const { keyword, sort, order, page, size } = ctx.params;
        let data = await this.adapter.find({ $text: { $search: keyword } });

        const { totalItems, response } = getPagingData(data, page, size);
        return apiResponse.successResponseWithPagingData(
          "Success",
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

		getAllProductByShop: {
			async handler(ctx) {
				console.log('params._id: ', ctx.params.id);
				let data = await this.adapter.find({ query: { shop_id: ctx.params.id } });
				data = JSON.parse(JSON.stringify(data));
				if (data) {
					return apiResponse.successResponseWithData('success', data);
				}

				return apiResponse.badRequestResponse('Not exists');
			}
		},

		create: {
			async handler(ctx) {
				try {
					console.log(ctx.params);
					const curDate = new Date();
					const { name, description, inventory, unit_price, unit, product_type, shop_id } = ctx.params;
					const data = await this.adapter.insert({
						name,
						description,
						inventory,
						unit_price,
						unit,
						product_type,
						shop_id,
						created_at: curDate,
						updated_at: curDate
					});
					return apiResponse.successResponseWithData('successful create new product', data);
				} catch (err) {
					return apiResponse.badRequestResponse('Cannot create a product');
				}
			}
		},

		update: {
			async handler(ctx) {
				try {
					let { product_id, ...updateProduct } = ctx.params;
					console.log(updateProduct);
					let curProduct = await this.getById(new ObjectID(product_id));
					console.log('curProduct: ', curProduct);
					let result = await this.adapter.updateById(
						product_id,
						{ $set: { ...updateProduct } },
						{ new: true }
					);
					console.log('result: ', result);
					return apiResponse.successResponseWithData('successful update product', result);
				} catch (err) {
					return apiResponse.badRequestResponse('Cannot create a product');
				}
			}
		},

		getProductByShop: {
			params: {
				limit: { type: 'number', optional: true, convert: true },
				offset: { type: 'number', optional: true, convert: true }
			},
			async handler(ctx) {
				const limit = ctx.params.limit ? Number(ctx.params.limit) : 20;
				const offset = ctx.params.offset ? Number(ctx.params.offset) : 0;
				const shop_id = ctx.meta.user.user_id;
				let params = {
					limit,
					offset,
					shop_id,
					sort: [ '-created_at' ]
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
					this.adapter.count(countParams)
				]);

				const docs = await this.transformDocuments(ctx, params, res[0]);
				const result = {
					products: docs,
					productCount: res[1]
				};

				if (result.productCount > 0) {
					return apiResponse.successResponseWithData('success', result);
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
  stopped() {},
};
