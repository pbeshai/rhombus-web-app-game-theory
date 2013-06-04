/** Module for interfacing with the participant server over websocket
 */
define([
	"app",

	"util/SocketUtils"
	],
	function (app, SocketUtils) {
	"use strict"

	var StateController = app.module();

	StateController.Model = Backbone.Model.extend({
		// events we trigger to clients
		clientEvents: {
			appNext: "app-next",
			appPrev: "app-prev",
		},

		// events we send across the websocket
		socketEvents:  {
			appNext: "app-next",
			appPrev: "app-prev",
		},

		initialize: function () {
			// web socket
		  this.socket = app.socket;
		  SocketUtils.initSendReceive.call(this);
		},
	});

	return StateController;
});