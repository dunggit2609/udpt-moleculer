'use strict';

const DbService = require('moleculer-db');

const getPagingData = require('../helpers/pagingData');
var apiResponse = require('../helpers/apiResponse');
const MongoDBAdapter = require('moleculer-db-adapter-mongo');
const { ObjectID } = require('bson');

module.exports = {
	name: 'systemReviews',
	mixins: [ DbService ],
	adapter: new MongoDBAdapter(
		'mongodb+srv://thangbach:123@cluster0.msdkr.mongodb.net/Review?retryWrites=true&w=majority',
		{ useUnifiedTopology: true }
	),
	collection: 'SystemReview',
	/**
   * Service settings
   */
	settings: {
		fields: [ '_id', 'author', 'content', 'replyList', 'created_at', 'updated_at' ],
		populates: {
			author: {
				action: 'customers.get',
				params: {
					populate: [],
					fields: [ '_id', 'full_name', 'email' ]
				}
			}
		}
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
		/**
     * Create a comment
     *
     * @action
     * @param {String} productID - productID
     * @param {Object}  comment - Comment object
     */
		create: {
			params: {
				comment: { type: 'object' }
			},
			async handler(ctx) {
				let entity = ctx.params.comment;
				entity.author = ctx.meta.user.user_id.toString();
				entity.replyList = [];

				await this.validateEntity(entity);

				entity.created_at = new Date();
				entity.updated_at = new Date();

				const doc = await this.adapter.insert(entity);

				let json = await this.transformDocuments(ctx, { populate: [ 'author' ] }, doc);

				await this.entityChanged('created', json, ctx);
				if (json) {
					return apiResponse.successResponseWithData('success', json);
				}
				return apiResponse.badRequestResponse('create fail');
			}
		},
		/**
     * Update a comment.
     * Auth is required!
     *
     * @actions
     * @param {String} id - Comment ID
     * @param {Object} comment - Comment modified fields
     *
     * @returns {Object} Updated comment entity
     */
		update: {
			params: {
				id: { type: 'string' },
				comment: {
					type: 'object',
					props: {
						content: { type: 'string', min: 1 }
					}
				}
			},
			async handler(ctx) {
				let newData = ctx.params.comment;
				newData.updatedAt = new Date();

				const comment = await this.getById(ctx.params.id);
				if (comment.author !== ctx.meta.user.user_id.toString()) throw new ForbiddenError();

				const update = {
					$set: newData
				};

				const doc = await this.adapter.updateById(ctx.params.id, update);
				const json = await this.transformDocuments(ctx, { populate: [ 'author' ] }, doc);
				await this.entityChanged('updated', json, ctx);
				if (json) {
					return apiResponse.successResponseWithData('success', json);
				}
				return apiResponse.badRequestResponse('update fail');
			}
		},

		reply: {
			// params: {
			//   id: { type: "string" },
			//   content: { type: "string", min: 1 },
			// },
			async handler(ctx) {
				let payload;
				try {
					payload = JSON.parse(Object.keys(ctx.params)[0]);
				} catch (error) {
					payload = ctx.params;
				}
				// const { comment } = payload;
				console.log(payload);

				let newData = {};
				if (!payload.content || payload.content === '') return apiResponse.badRequestResponse('update fail');

				const newReply = {
					content: payload.content,
					author: ctx.meta.user.user_id.toString(),
					createdAt: new Date(),
					updatedAt: new Date()
				};

				newData.updatedAt = new Date();
				const comment = await this.getById(ctx.params.id);
				console.log([ ...comment.replyList ]);
				newData.replyList = [ ...comment.replyList, newReply ];

				console.log(newData.replyList);

				const update = {
					$set: newData
				};

				const doc = await this.adapter.updateById(ctx.params.id, update);
				const json = await this.transformDocuments(ctx, { populate: [ 'author' ] }, doc);
				await this.entityChanged('updated', json, ctx);
				if (json) {
					return apiResponse.successResponseWithData('success', json);
				}
				return apiResponse.badRequestResponse('update fail');
			}
		},
		list: {
			params: {
				limit: { type: 'number', optional: true, convert: true },
				offset: { type: 'number', optional: true, convert: true }
			},
			async handler(ctx) {
				const limit = ctx.params.limit ? Number(ctx.params.limit) : 20;
				const offset = ctx.params.offset ? Number(ctx.params.offset) : 0;

				let params = {
					limit,
					offset,
					sort: [ '-created_at' ],
					populate: [ 'author' ]
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
					comments: docs,
					commentsCount: res[1]
				};

				if (result.commentsCount > 0) {
					return apiResponse.successResponseWithData('success', result);
				}
				return apiResponse.badRequestResponse('Not exists');
			}
		},

		/**
     * Remove a comment
     * Auth is required!
     *
     * @actions
     * @param {String} id - Comment ID
     *
     * @returns {Number} Count of removed comments
     */
		remove: {
			params: {
				id: { type: 'any' }
			},
			async handler(ctx) {
				const comment = await this.getById(ctx.params.id);
				if (comment.author !== ctx.meta.user.user_id.toString()) throw new ForbiddenError();
				const json = await this.adapter.removeById(ctx.params.id);
				await this.entityChanged('removed', json, ctx);
				return json;
			}
		},
		getById: {
			async handler(ctx) {
				let data = await this.getById(ctx.params.id);
				data = JSON.parse(JSON.stringify(data));
				if (data) {
					return apiResponse.successResponseWithData('success', data);
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
	stopped() {}
};
