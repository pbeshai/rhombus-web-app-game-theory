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
			instructorFocus: "instructor-focus"
		},

		// events we send across the websocket
		socketEvents:  {
			appNext: "app-next",
			appPrev: "app-prev",
			instructorFocus: "instructor-focus"
		},

		reset: function () {
			this.clear();
		},

		appNextCallback: function () {
			var activeApp = this.get("activeApp");
			if (activeApp) {
	  		console.log("Next State", activeApp);
	  		activeApp.next();
	  	}
		},

		appPrevCallback: function () {
			var activeApp = this.get("activeApp");
			if (activeApp) {
	  		console.log("Prev State", activeApp);
	  		activeApp.prev();
	  	}
		},

		initialize: function () {
			// web socket
		  this.socket = app.getSocket();
		  SocketUtils.initSendReceive.call(this);
		},
	});

	return StateController;
});