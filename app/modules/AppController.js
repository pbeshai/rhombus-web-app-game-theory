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
			appPrev: "app-prev"
		},

		// events we send across the websocket
		socketEvents:  {
			appConfig: "app-config",
			appNext: "app-next",
			appPrev: "app-prev",
			appMessage: "app-message"
		},

		reset: function () {
			this.clear();
		},

		sendAppMessage: function (type, message) {
			var appMessage = {
				type: type,
				message: message,
			}
			this.socket.emit("app-message", appMessage);
		},

		appNext: function () {
			this.sendAppMessage("app-next");
		},

		appNextCallback: function () {
			var activeApp = this.get("activeApp");
			if (activeApp) {
				console.log("Next State: " + activeApp.currentState.nextString());
	  		activeApp.next();
	  	}
		},

		appPrev: function () {
			this.sendAppMessage("app-prev");
		},

		appPrevCallback: function () {
			var activeApp = this.get("activeApp");
			if (activeApp) {
	  		console.log("Prev State: " + activeApp.currentState.prevString());
	  		activeApp.prev();
	  	}
		},

		appConfig: function(config) {
			this.sendAppMessage("app-config", config);
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