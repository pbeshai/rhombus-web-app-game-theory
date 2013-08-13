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
			// appNext: "app-next",
			// appPrev: "app-prev",
			appMessage: "app-message",
			viewerList: "viewer-list",
			viewerConnect: "viewer-connect",
			viewerDisconnect: "viewer-disconnect",
		},

		// events we send across the websocket
		socketEvents:  {
			appConfig: "app-config",
			// appNext: "app-next",
			// appPrev: "app-prev",
			appMessage: "app-message",
			viewerList: "viewer-list",
			viewerConnect: "viewer-connect",
			viewerDisconnect: "viewer-disconnect",
		},

		reset: function () {
			this.clear();
		},

		viewerListCallback: function (data) {
			console.log("viewer list", data);
		},

		sendAppMessage: function (type, message) {
			var appMessage = {
				type: type,
				message: message,
			}
			this.socket.emit("app-message", appMessage);
		},

		appMessageCallback: function (data) {
			console.log("app message received", data);
			if (data.type) {
				this.trigger(data.type, data.message);
			}
		},

		loadView: function (view, options, viewer) {
			this.sendAppMessage("load-view", { view: view, options: options }); // TODO add viewer , viewer: viewer });
		},

		updateView: function (data) {
			this.sendAppMessage("update-view", data); // TODO add viewer , viewer: viewer });
		},

		appNext: function () {
			// this.sendAppMessage("app-next");
			var activeApp = this.get("activeApp");
			if (activeApp) {
				console.log("Next State: " + activeApp.currentState.nextString());
	  		activeApp.next();
	  	}
		},

		// appNextCallback: function () {
		// 	var activeApp = this.get("activeApp");
		// 	if (activeApp) {
		// 		console.log("Next State: " + activeApp.currentState.nextString());
	 //  		activeApp.next();
	 //  	}
		// },

		appPrev: function () {
			// this.sendAppMessage("app-prev");
				var activeApp = this.get("activeApp");
			if (activeApp) {
	  		console.log("Prev State: " + activeApp.currentState.prevString());
	  		activeApp.prev();
	  	}
		},

		// appPrevCallback: function () {
		// 	var activeApp = this.get("activeApp");
		// 	if (activeApp) {
	 //  		console.log("Prev State: " + activeApp.currentState.prevString());
	 //  		activeApp.prev();
	 //  	}
		// },

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

		initialize: function (attrs) {
			// web socket
		  this.socket = attrs.socket;
		  SocketUtils.initSendReceive.call(this)

		  this.on("change:socket", function (model, socket) {
		  	this.socket = socket;
		  	SocketUtils.bindSocketEvents.call(this);
		  });
		},
	});

	return AppController;
});