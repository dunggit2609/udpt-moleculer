"use strict";

const DbService = require("moleculer-db");

var apiResponse = require("../helpers/apiResponse");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const { ObjectID } = require("bson");
var bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { hash } = require("../helpers/hash");
const {
  USER_ROLE_CUSTOMER,
  USER_ROLE_SHIPPER,
  USER_ROLE_SHOP,
} = require("../constant");

const access_token_secret = "!@$#^%&*AzQ,PI)o(";
const access_token_life = 86400;

module.exports = {
  name: "users",
  mixins: [DbService],
  adapter: new MongoDBAdapter(
    "mongodb+srv://admin1:123@cluster0.msdkr.mongodb.net/Auth?retryWrites=true&w=majority",
    { useUnifiedTopology: true }
  ),
  collection: "User",
  /**
   * Service settings
   */
  settings: {
    fields: ["_id", "username", "password", "email", "phone", "role", "status"],
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
    register: {
      async handler(ctx) {
        const {
          username,
          password,
          email,
          phone,
          role,
          full_name,
          address,
          identity,
          bank_account,
          area_zone,
          work_zone,
          name,
          location,
          business_cert,
          description,
        } = ctx.params;
        try {
          const existedUsername = await this.adapter.find({
            query: { username: username },
          });
          if (existedUsername && existedUsername.length > 0) {
            return apiResponse.conflictResponse("Username is already exist");
          }

          const existedEmail = await this.adapter.find({
            query: { email: email },
          });

          if (existedEmail && existedEmail.length > 0) {
            return apiResponse.conflictResponse("Email is already exist");
          }

          let newUser = {
            username: username,
            password: password,
            mail: email,
            phone_number: phone,
            role: role,
            _id: new ObjectID(),
          };

          const hashData = await hash.hash(password, 10);
          const userPayload = {
            ...newUser,
            ...{ password: hashData },
          };

          const user = await this.adapter.insert(userPayload);
          if (!user) {
            return apiResponse.ErrorResponse("Create failed!");
          }

          let createCustomerSuccess, createShipperSuccess, createShopSuccess;
          let userData = {
            role: user.role,
          };

          switch (user.role) {
            case USER_ROLE_CUSTOMER:
              const newCustomer = {
                full_name,
                address,
                identity,
                bank_account,
                area_zone,
                email,
                phone,
                user_id: user._id,
              };
              createCustomerSuccess = ctx.call("customers.create", newCustomer);
              userData.user_id = createCustomerSuccess._id;
              break;
            case USER_ROLE_SHIPPER:
              const newShipper = {
                full_name,
                address,
                identity,
                bank_account,
                work_zone,
                email,
                phone,
                user_id: user._id,
              };

              createShipperSuccess = await ctx.call(
                "shippers.create",
                newShipper
              );

              userData.user_id = createShipperSuccess._id;

              break;

            case USER_ROLE_SHOP:
              const newShop = {
                bank_account,
                email,
                phone,
                name,
                location,
                business_cert,
                description,
                user_id: user._id,
              };

              createShopSuccess = await ctx.call("shops.create", newShop);

              userData.user_id = createShopSuccess._id;

              break;
            default:
              break;
          }

          if (
            !createShipperSuccess &&
            !createShopSuccess &&
            !createCustomerSuccess
          ) {
            await this.adapter.removeById(user._id);
            return apiResponse.ErrorResponse("Sign up failed");
          }

          const jwtPayload = userData;
          const jwtData = { expiresIn: access_token_life };
          const secret = access_token_secret;
          userData.token = jwt.sign(jwtPayload, secret, jwtData);
          userData.expire_time = (
            new Date().getTime() +
            access_token_life * 60 * 60 * 1000
          ).toLocaleString();
          return apiResponse.successResponseWithData("success", userData);
        } catch (ex) {
          console.log("ex", ex);
          return apiResponse.ErrorResponse(ex.message);
        }
      },
    },
    login: {
      async handler(ctx) {
        const { username, password } = ctx.params;

        if (!username || !password) {
          return apiResponse.badRequestResponse(
            "Username and password are required"
          );
        }

        try {
          const users = await this.adapter.find({
            query: { username: username },
          });

          if (!users || users.length === 0) {
            return apiResponse.badRequestResponse("User not exists");
          }

          const user = users[0];

          const same = await hash.compare(password, user.password);

          if (same) {
            let userData = {
              role: user.role,
            };

            switch (user.role) {
              case USER_ROLE_CUSTOMER:
                let customer = ctx.call("customers.getByUserId", {
                  id: user._id,
                  internal: true,
                });
                userData.user_id = customer._id;
                break;
              case USER_ROLE_SHIPPER:
                let shipper = await ctx.call("shippers.getByUserId", {
                  id: user._id,
                  internal: true,
                });
                userData.user_id = shipper._id;

                break;

              case USER_ROLE_SHOP:
                shop = await ctx.call("shops.getByUserId", {
                  id: user._id,
                  internal: true,
                });

                userData.user_id = shop._id;

                break;
              default:
                break;
            }

            const jwtPayload = userData;
            const jwtData = { expiresIn: access_token_life };
            const secret = access_token_secret;
            userData.token = jwt.sign(jwtPayload, secret, jwtData);
            return apiResponse.successResponseWithData("Success", userData);
          } else {
            return apiResponse.unauthorizedResponse("User or password wrong");
          }
        } catch (err) {
          console.log("err", err);
          return apiResponse.ErrorResponse(err.message);
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
