"use strict";

const DbService = require("moleculer-db");

const getPagingData = require("../helpers/pagingData");
var apiResponse = require("../helpers/apiResponse");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const { ObjectID } = require("bson");
const { USER_ROLE_SHIPPER } = require("../constant");
const { MoleculerError } = require("moleculer").Errors;
const { format } = require("date-fns");

module.exports = {
  name: "orders",
  mixins: [DbService],
  adapter: new MongoDBAdapter(
    "mongodb+srv://admin1:123@cluster0.msdkr.mongodb.net/Order?retryWrites=true&w=majority",
    { useUnifiedTopology: true }
  ),
  collection: "Order",
  /**
   * Service settings
   */
  settings: {
    fields: [
      "_id",
      "payment",
      "review:",
      "customer_id",
      "shipper_id",
      "total_cost",
      "total_product",
      "status",
      "note",
      "product",
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
    getDetailByShipper: {
      async handler(ctx) {
        let data = await this.getById(new ObjectID(ctx.params.id));
        data = JSON.parse(JSON.stringify(data));

        const productIds = data.product.map((x) => x.product_id);
        const products = await ctx.call("products.getByIds", productIds);
        if (products.length > 0) {
          data.products = [];
          data.product.forEach((x) => {
            const product = products.find(
              (y) => `${y._id}` === `${x.product_id}`
            );
            if (product) {
              x = { ...x, ...product };
              data.products.push({ ...product, quantity: x.quantity });
            }
          });
        }
        delete data.product;

        const customer = await ctx.call("customers.getById", {
          id: data.customer_id,
        });

        if (customer) {
          data.customer_info = customer;
        }

        const shop = await ctx.call("shops.getById", { id: data.shop_id });

        if (shop) {
          data.shop_info = shop;
        }

        if (data) {
          return apiResponse.successResponseWithData("success", data);
        }

        return apiResponse.badRequestResponse("Not exists");
      },
    },
    getDeliveringOrderByShipper: {
      async handler(ctx) {
        try {
          if (!ctx.meta.user || !ctx.meta.user.user_id) {
            return;
          }
          // const payload = JSON.parse(Object.keys(ctx.params)[0]);

          // const { page, size, status, order_id, from, to } = payload;
          const shipper_id = ctx.meta.user.user_id;
          const queries = {
            status: "2",
            shipper_id: new ObjectID(shipper_id),
          };

          Object.keys(queries).forEach((x) => {
            if (
              queries[x] === null ||
              queries[x] === undefined ||
              queries[x] == "all"
            ) {
              delete queries[x];
            }
          });

          let data = await this.adapter.find({
            query: queries,
          });

          if (data && data.length > 0) {
            const rs = await ctx.call("orders.getDetailByShipper", {
              id: data[0]._id,
            });

            console.log("zxc", rs)
            if (!rs.success) {
              return apiResponse.successResponseWithData("no_data", null);
            }

            return apiResponse.successResponseWithData("success", rs.data);
          } else {
            return apiResponse.successResponseWithData("no_data", null);
          }
        } catch (err) {
          console.log("errrxx", err);
          return apiResponse.ErrorResponse("Cannot get order");
        }
      },
    },
    getAllByShipper: {
      async handler(ctx) {
        try {
          if (!ctx.meta.user || !ctx.meta.user.user_id) {
            return;
          }
          const payload = JSON.parse(Object.keys(ctx.params)[0]);

          const { page, size, status, order_id, from, to } = payload;
          const shipper_id = ctx.meta.user.user_id;
          const queries = {
            status: status,
            shipper_id: new ObjectID(shipper_id),
          };

          Object.keys(queries).forEach((x) => {
            if (
              queries[x] === null ||
              queries[x] === undefined ||
              queries[x] == "all"
            ) {
              delete queries[x];
            }
          });

          let data = await this.adapter.find({
            query: queries,
          });

          const fromDate = from
            ? new Date(
                format(
                  typeof from === "string" ? new Date(from) : from,
                  "yyyy-MM-dd"
                )
              )
            : null;
          const toDate = to
            ? new Date(
                format(typeof to === "string" ? new Date(to) : to, "yyyy-MM-dd")
              )
            : null;

          data = data.filter((x) => {
            return (
              `${x._id}`.includes(order_id ?? "") &&
              (status !== "all" || ["3", "-3", "-2"].includes(x.status)) &&
              (!fromDate ||
                new Date(format(x.created_at, "yyyy-MM-dd")) >= fromDate) &&
              (!toDate ||
                new Date(format(x.created_at, "yyyy-MM-dd")) <= toDate)
            );
          });
          const { response, totalItems } = getPagingData(data, page, size);
          return apiResponse.successResponseWithPagingData(
            "success",
            response,
            page,
            totalItems
          );
        } catch (err) {
          console.log("errrxx", err);
          return apiResponse.ErrorResponse("Cannot get order");
        }
      },
    },
    updateStatus: {
      async handler(ctx) {
        try {
          if (!ctx.meta.user) {
            return new MoleculerError("Unauthorized", 401);
          }

          const { order_id, status } = ctx.params;

          const { role, user_id } = ctx.meta.user;

          const order = await this.getById(new ObjectID(order_id));

          if (!order) {
            return apiResponse.badRequestResponse(res, "Order not exists");
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
            return apiResponse.ErrorResponse("Update failed");
          }
          return apiResponse.successResponse("Success");
        } catch (err) {
          console.log("errrxx", err);
          return apiResponse.ErrorResponse("Cannot update order");
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
