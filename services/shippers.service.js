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
        let data = await this.getById(new ObjectID(ctx.meta.user.user_id) );

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
          newShipper.working_info.push(payload)


          const result = await this._update(new ObjectID(shipper_id), newShipper);
          if (!result) {
            return apiResponse.ErrorResponse("Update failed");
          }
          return apiResponse.successResponse("Success");
        } catch (err) {
          console.log("err", err);
          return apiResponse.ErrorResponse( "Cannot update health");
        }
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
