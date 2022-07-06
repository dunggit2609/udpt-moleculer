"use strict";

const ApiGateway = require("moleculer-web");
const ApiService = require("moleculer-web");
const jwt = require("jsonwebtoken");

module.exports = {
  name: "api",
  mixins: [ApiGateway, ApiService],

  // More info about settings: http://moleculer.services/docs/moleculer-web.html
  settings: {
    port: process.env.PORT || 3000,

    routes: [
      {
        path: "/api",
        whitelist: [
          // Access to any actions in all services
          "*",
        ],
        aliases: {
          "GET /shippers/:id": "shippers.getByUserId",
          "POST /shippers/update-health": "shippers.updateHealth",
          "GET /shippers/get/me": "shippers.getInfo",

          "GET /customers/get/me": "customers.get",
          "GET /customers/:id": "customers.get",

          "GET /shop/list": "shops.list",

          "GET /reviews/get/:id": "reviews.get",
          "POST /reviews/create": "reviews.create",
          "GET /reviews/getAll/:productID": "reviews.listByProduct",
          "GET /reviews": "reviews.list",
          "PUT /reviews/update/:id": "reviews.update",
          "PUT /reviews/reply/:id": "reviews.reply",

          "POST /users/register": "users.register",
          "POST /users/login": "users.login",
          "GET /users/:id": "users.get",

          "POST /orders/getAllByShipper": "orders.getAllByShipper",
          "POST /orders/update-status": "orders.updateStatus",
        },
        onBeforeCall(ctx, route, req, res) {
          let accessToken = req.headers["authorization"];
          if (accessToken) {
            var decoded = jwt.decode(accessToken);

            //user_id nay la id cua tung role, vd role shipper
            //thi user_id nay la shipper_id chu khong phai user_id trong bang user
            ctx.meta.user = { role: decoded.role, user_id: decoded.user_id };
          } else {
            return "Unauthorized";
          }
        },
        bodyParsers: {
          json: true,
          urlencoded: { extended: true },
        },
      },
    ],
  },
};
