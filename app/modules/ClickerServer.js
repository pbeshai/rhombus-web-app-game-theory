/** Module for interfacing with the clicker server over websocket
 */
define(["app", "socketio"],
	function (app, io) {
	"use strict"

	var socketEvents = { // events we send across the websocket
		  connect: "connect-clicker-server",
		  disconnect: "disconnect-clicker-server",
		  clickData: "click-data",
		  enableClicks: "enable-clicks",
		  disableClicks: "disable-clicks",
		  status: "status",
			webClick: "web-click"
		},
	  config = {
			websocketUrl: "http://localhost",
			clickRegExp: /(\w+):([A-E])/g  // regular expression for click data. Matches ID:Click (e.g., 17fa321:A)
		},
	  events = { // client-side events that we allow handlers for
			data: "data",
			connect: "connect",
			disconnect: "disconnect",
			enableClicks: "enable-clicks",
			disableClicks: "disable-clicks",
			status: "status"
		};

	var ClickerServer = _.extend({}, Backbone.Events, {
		initialize: function () {
			// bind this to the callbacks
			_.bindAll(this, "dataCallback", "statusCallback", "connectCallback",
				"disconnectCallback", "enableClicksCallback", "disableClicksCallback");

			// connect to the websocket
		  var socket = this.socket = io.connect(config.websocketUrl);

		  // bind websocket events
		  socket.on(socketEvents.clickData, this.dataCallback);
		  socket.on(socketEvents.status, this.statusCallback);
		  socket.on(socketEvents.connect, this.connectCallback);
		  socket.on(socketEvents.disconnect, this.disconnectCallback);
		  socket.on(socketEvents.enableClicks, this.enableClicksCallback);
		  socket.on(socketEvents.disableClicks, this.disableClicksCallback);
		},

	  connect: function () {
			this.socket.emit(socketEvents.connect);
		},

	  connectCallback: function (data) {
			console.log("connect callback", data, this);
			this.trigger(events.connect, arguments);
		},

	  disconnect: function () {
			this.socket.emit(socketEvents.disconnect);
		},

	  disconnectCallback: function (data) {
			console.log("disconnect callback", data);
			this.trigger(events.disconnect, arguments);
		},

	  enableClicks: function () {
			this.socket.emit(socketEvents.enableClicks);
		},

	  enableClicksCallback: function (data) {
			console.log("enable clicks callback", data);
			this.trigger(events.enableClicks, arguments);
		},

	  disableClicks: function () {
			this.socket.emit(socketEvents.disableClicks);
		},

	  disableClicksCallback: function (data) {
			console.log("disable clicks callback", data);
			this.trigger(events.disableClicks, arguments);
		},

	  status: function () {
			this.socket.emit(socketEvents.status);
		},

	  statusCallback: function (data) {
			console.log("status callback", data);
			this.trigger(events.status, arguments);
		},

	  webClick: function (data) {
			this.socket.emit(socketEvents.webClick, data);
		},

		// returns an array [{ id: x, click: x }, ...]
	  parseData: function (data) {
			var result, id, click;
			var clickData = [];
			while(result = config.clickRegExp.exec(data.clicks)) {
				id = result[1];
				click = result[2];

				clickData.push({id: id, click: click});
			}

			return clickData;
		},

	  dataCallback: function (data) {
			var clickData = parseData(data);
			this.trigger(events.data, [clickData]);
		}
	});
	window.ClickerServer = ClickerServer; // TODO: remove; for debugging

	return ClickerServer;
});