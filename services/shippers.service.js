"use strict";

const DbService = require("moleculer-db");

const getPagingData = require("../helpers/pagingData");
var apiResponse = require("../helpers/apiResponse");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const { ObjectID } = require("bson");

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
    // list: {
    // 	async handler(ctx) {
    // 		const { keyword, page, size } = ctx.params;
    // 		let query = "SELECT * FROM Players WHERE  '$keyword' = '' or  `FULLNAME` like '%$keyword%'  or `NUMBER` like '%$keyword%'   or `NATIONALITY` like '%$keyword%' or `POSITION` like  '%$keyword%'";
    // 		query = query.replaceAll("$keyword", keyword ? keyword : "")

    // 		let data = await this.adapter.db.query(query)

    // 		data = JSON.parse(JSON.stringify(data))
    // 		data = data.length > 0 ? data[0] : []
    // 		const { totalItems, response } = getPagingData(data, page, size)
    // 		return { totalItems: totalItems, page: page ? page : 1, size: size ? size : 10, data: response };
    // 	}
    // },
    // advancedSearch: {
    // 	async handler(ctx) {
    // 		const payload = JSON.parse(Object.keys(ctx.params)[0])
    // 		const { ClubID, Position, FullName, Nationality, Number, page, size } = payload;
    // 		const queries = {
    // 			ClubID: ClubID,
    // 			Position: Position, FullName: FullName, Nationality: Nationality, Number: Number,
    // 		};

    // 		Object.keys(queries).forEach(x => {
    // 			if (queries[x] === null || queries[x] === undefined) {
    // 				queries[x] = '';
    // 			}
    // 		});
    // 		let query = "SELECT * FROM Players WHERE ('$clubID' = 'all' or '$clubID' = ClubID or '$clubID' = '') and ( '$name' = '' or  `FullName` like '%$name%' ) and ('$number' = '' or `Number` like '%$number%'  ) and ('$nationality' = '' or `Nationality` like '%$nationality%' ) and ('$position' = '' or `Position` like '%$position%' )";

    // 		query = query.replaceAll("$clubID", queries.ClubID)
    // 			.replaceAll("$name", queries.FullName)
    // 			.replaceAll("$number", queries.Number)
    // 			.replaceAll("$nationality", queries.Nationality)
    // 			.replaceAll("$position", queries.Position)

    // 		let data = await this.adapter.db.query(query);
    // 		data = JSON.parse(JSON.stringify(data))
    // 		data = data.length > 0 ? data[0] : []

    // 		const { response, totalItems } = getPagingData(data, +page, +size)
    // 		return { totalItems: totalItems, page: page ? page : 1, size: size ? size : 10, data: response };
    // 	}
    // },
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
        const shipper_id = ctx.meta.user.user_id;
        const payload = ctx.params
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
    // create: {
    // 	async handler(ctx) {
    // 		let params = JSON.parse(Object.keys(ctx.params)[0]);
    // 		let count = await this.adapter.find();
    // 		count = JSON.parse(JSON.stringify(count)).sort((a, b) => b.id - a.id)

    // 		if (count.length > 0) {
    // 			count = count[0].id
    // 		}

    // 		if (count) {
    // 			params.id = count + 1;
    // 		}

    // 		let data = await this.adapter.insert(params)
    // 		data = JSON.parse(JSON.stringify(data))

    // 		if (data) {
    // 			return { success: true, data: data }
    // 		}

    // 		return { success: false, data: {} }
    // 	}
    // },
    // updatePlayer: {
    // 	async handler(ctx) {
    // 		let params = JSON.parse(Object.keys(ctx.params)[0]);
    // 		let query = "UPDATE `PLAYERS` SET `FullName` = '$name', `Position` = '$position', `Number` = '$number', `Nationality` = '$nationality' where `id` = '$id'";
    // 		query = query.replace("$name", params.FullName)
    // 			.replace("$position", params.Position)
    // 			.replace("$number", params.Number)
    // 			.replace("$nationality", params.Nationality)
    // 			.replace("$id", +params.id)
    // 		let data = await this.adapter.db.query(query)

    // 		data = JSON.parse(JSON.stringify(data))

    // 		// await this.broker.stop()
    // 		if (data) {
    // 			return { success: true }
    // 		}

    // 		return { success: false }
    // 	}
    // },
    // delete: {
    // 	async handler(ctx) {

    // 		let data = await this.adapter.remove(ctx.params.id)

    // 		data = JSON.parse(JSON.stringify(data))
    // 		if (data.length > 0) {
    // 			return { success: true, data: data[0] }
    // 		}

    // 		return { success: false, data: {} }
    // 	}
    // }
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
