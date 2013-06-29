/**
	Module for interfacing with the running app via websocket
 */
define([
	"app",

	"util/SocketUtils"
	],
	function (app, SocketUtils) {
	"use strict"

	var AppController = app.module();

	AppController.Model = Backbone.Model.extend({
		// events we trigger to clients
		clientEvents: {
			appConfig: "app-config",
			appNext: "app-next",
			appPrev: "app-prev",
			instructorFocus: "instructor-focus"
		},

		// events we send across the websocket
		socketEvents:  {
			appConfig: "app-config",
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

		appConfigCallback: function (config) {
			var activeApp = this.get("activeApp");
			if (activeApp) {
	  		console.log("App Config", config, activeApp);
	  		activeApp.configure(config);
	  	}
		},

		initialize: function () {
			// web socket
		  this.socket = app.getSocket();
		  SocketUtils.initSendReceive.call(this);
		},
	});

	return AppController;
});