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
    cors: {
      // Configures the Access-Control-Allow-Origin CORS header.
      origin: "http://localhost:8888",
      // Configures the Access-Control-Allow-Methods CORS header.
      methods: ["GET", "OPTIONS", "POST", "PUT", "DELETE"],
      // Configures the Access-Control-Allow-Headers CORS header.
      allowedHeaders: [],
      // Configures the Access-Control-Expose-Headers CORS header.
      exposedHeaders: [],
      // Configures the Access-Control-Allow-Credentials CORS header.
      credentials: false,
      // Configures the Access-Control-Max-Age CORS header.
      maxAge: 3600,
    },
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
          "GET /shippers": "shippers.list",

          "GET /customers": "customers.list",

          "POST /users/register": "users.register",
          "POST /users/login": "users.login",

          "POST /orders/getAllByShipper": "orders.getAllByShipper",
          "GET /orders/getDetailByShipper": "orders.getDetailByShipper",
          "GET /orders/getDeliveringOrderByShipper":
            "orders.getDeliveringOrderByShipper",
          "POST /orders/update-status": "orders.updateStatus",

          "GET /reviews/get/:id": "reviews.get",
          "POST /reviews/create": "reviews.create",
          "GET /reviews/getAll/:productID": "reviews.listByProduct",
          "GET /reviews": "reviews.list",
          "PUT /reviews/update/:id": "reviews.update",
          "PUT /reviews/reply/:id": "reviews.reply",

          "GET /shops": "shops.list",
        },
        onBeforeCall(ctx, route, req, res) {
          let accessToken = req.headers["authorization"];
          if (!accessToken) {
            // res.writeHead(401);
            //  res.end("Unauthorized");
          }

          var decoded = jwt.decode(accessToken);

          if (!decoded || !decoded.role || !decoded.user_id) {
            // res.writeHead(401);
            //  res.end("Unauthorized");
            return;
          }
          //user_id nay la id cua tung role, vd role shipper
          //thi user_id nay la shipper_id chu khong phai user_id trong bang user
          ctx.meta.user = { role: decoded.role, user_id: decoded.user_id };
        },

        bodyParsers: {
          json: true,
          urlencoded: { extended: true },
        },
      },
    ],
  },
};
