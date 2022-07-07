"use strict";

const DbService = require("moleculer-db");

const getPagingData = require("../helpers/pagingData");
var apiResponse = require("../helpers/apiResponse");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const { ObjectID } = require("bson");
const {format} = require("date-fns")
module.exports = {
  name: "shippers",
  mixins: [DbService],
  adapter: new MongoDBAdapter(
    "mongodb+srv://admin1:123@cluster0.msdkr.mongodb.net/Shipper?retryWrites=true&w=majority",
    { useUnifiedTopology: true }
  ),
  collection: "Shipper",
  /**
   * Service settings
   */
  settings: {
    fields: [
      "_id",
      "full_name",
      "address",
      "identity",
      "bank_account",
      "work_zone",
      "email",
      "phone",
      "user_id",
      "created_at",
      "updated_at",
      "register_at",
      "working_info",
      "checking_result",
      "canReceiveOrder",
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
            : apiResponse.successResponseWithData("success", data[0]);
        }

        return apiResponse.badRequestResponse("Not exists");
      },
    },
    getInfo: {
      async handler(ctx) {
        let data = await this.getById(new ObjectID(ctx.meta.user.user_id));

        if (data) {
          return apiResponse.successResponseWithData("success", data);
        }

        return apiResponse.badRequestResponse("Not exists");
      },
    },
    updateHealth: {
      async handler(ctx) {
        if (!ctx.meta.user || !ctx.meta.user.user_id) {
          return;
        }
        
        const payload = JSON.parse(Object.keys(ctx.params)[0]);
        const shipper_id = ctx.meta.user.user_id;
        try {
          const shipper = await this.getById(new ObjectID(shipper_id));
          const newShipper = Object.assign({}, shipper);
          newShipper.working_info.push(payload);


          const result = await this._update(new ObjectID(shipper_id), newShipper);
          if (!result) {
            return apiResponse.ErrorResponse("Update failed");
          }
          return apiResponse.successResponse("Success");
        } catch (err) {
          console.log("err", err);
          return apiResponse.ErrorResponse("Cannot update health");
        }
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
          populate: ["orders"],
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
        const r = await this.transformResult(ctx, docs);
        r.shipperCount = res[1];
        if (r.shipperCount > 0) {
          return apiResponse.successResponseWithData("success", r);
        }
        return apiResponse.badRequestResponse("Not exists");
      },
    },
    getHealthHistory: {
      async handler(ctx) {
        try {
          if (!ctx.meta.user || !ctx.meta.user.user_id) {
            return;
          }
          const payload = JSON.parse(Object.keys(ctx.params)[0]);

          const { page, size, from, to } = payload;

          const shipper_id = ctx.meta.user.user_id;
          const shipper = await this.getById(new ObjectID(shipper_id))

          let heathHistory = []
          if (shipper) {
            heathHistory = shipper.working_info
          }

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

          heathHistory = heathHistory.filter((x) => {
            return (
              (!fromDate ||
                new Date(format(typeof x.date === "string" ? new Date(x.date) : x.date, "yyyy-MM-dd")) >= fromDate) &&
              (!toDate ||
                new Date(format(typeof x.date === "string" ? new Date(x.date) : x.date, "yyyy-MM-dd")) <= toDate)
            );
          });
          const { response, totalItems } = getPagingData(heathHistory, page, size);
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
  methods: {
    /**
     * Transform the result entities to follow the RealWorld API spec
     *
     * @param {Context} ctx
     * @param {Array} entities
     * @param {Object} user - Logged in user
     */
    async transformResult(ctx, entities) {
      if (Array.isArray(entities)) {
        const shippers = await this.Promise.all(
          entities.map((item) => this.transformEntity(ctx, item))
        );
        return { shippers };
      } else {
        const shipper = await this.transformEntity(ctx, entities);
        return { shipper };
      }
    },

    /**
     * Transform a result entity to follow the RealWorld API spec
     *
     * @param {Context} ctx
     * @param {Object} entity
     * @param {Object} user - Logged in user
     */
    async transformEntity(ctx, entity) {
      if (!entity) return this.Promise.resolve();
      const res = await ctx.call("orders.getCountByShipperId", {
        shipper_id: entity._id.toString(),
      });
      entity.totalOrders = res;
      return entity;
    },
  },

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
