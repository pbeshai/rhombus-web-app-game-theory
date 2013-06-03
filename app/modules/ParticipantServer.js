/** Module for interfacing with the participant server over websocket
 */
define(["app", "socketio"],
	function (app, io) {
	"use strict"

	var socketEvents = { // events we send across the websocket
			appNext: "app-next",
			appPrev: "app-prev",
		  connect: "connect-participant-server",
		  disconnect: "disconnect-participant-server",
		  choiceData: "choice-data",
		  enableChoices: "enable-choices",
		  disableChoices: "disable-choices",
		  status: "status",
			submitChoice: "submit-choice"
		},
	  config = {
			websocketUrl: "http://localhost",
		},
	  events = { // client-side events that we allow handlers for
			appNext: "app-next",
			appPrev: "app-prev",
			data: "data",
			connect: "connect",
			disconnect: "disconnect",
			enableChoices: "enable-choices",
			disableChoices: "disable-choices",
			status: "status"
		};

	var ParticipantServer = app.module();


	ParticipantServer.Model = Backbone.Model.extend({
		defaults: {
			connected: false,
			acceptingChoices: false // whether submitting choices is enabled
		},
		events: events,

		initialize: function () {
			// bind this to the callbacks
			_.bindAll(this, "dataCallback", "statusCallback", "connectCallback",
				"disconnectCallback", "enableChoicesCallback", "disableChoicesCallback",
				"connect", "disconnect", "enableChoices", "disableChoices", "status",
				"submitChoice", "appNext", "appPrev", "appNextCallback", "appPrevCallback");

			// connect to the websocket
		  var socket = this.socket = io.connect(config.websocketUrl);

		  // bind websocket events
		  socket.on(socketEvents.choiceData, this.dataCallback);
		  socket.on(socketEvents.status, this.statusCallback);
		  socket.on(socketEvents.connect, this.connectCallback);
		  socket.on(socketEvents.disconnect, this.disconnectCallback);
		  socket.on(socketEvents.enableChoices, this.enableChoicesCallback);
		  socket.on(socketEvents.disableChoices, this.disableChoicesCallback);
		  socket.on(socketEvents.appNext, this.appNextCallback);
		  socket.on(socketEvents.appPrev, this.appPrevCallback);
		},

		appNext: function () {
			this.socket.emit(socketEvents.appNext);
		},

		appNextCallback: function (data) {
			this.trigger(events.appNext, data);
		},

		appPrev: function () {
			this.socket.emit(socketEvents.appPrev);
		},

		appPrevCallback: function (data) {
			this.trigger(events.appPrev, data);
		},

	  connect: function () {
			this.socket.emit(socketEvents.connect);
		},

	  connectCallback: function (data) {
			// console.log("connect callback", data);
			this.set("connected", data);
			this.trigger(events.connect, data);
		},

	  disconnect: function () {
			this.socket.emit(socketEvents.disconnect);
		},

	  disconnectCallback: function (data) {
			console.log("disconnect callback", data);
			this.trigger(events.disconnect, data);
		},

	  enableChoices: function () {
			this.socket.emit(socketEvents.enableChoices);
		},

	  enableChoicesCallback: function (data) {
			console.log("enable choices callback", data);
			this.set("acceptingChoices", data);
			this.trigger(events.enableChoices, data);
		},

	  disableChoices: function () {
			this.socket.emit(socketEvents.disableChoices);
		},

	  disableChoicesCallback: function (data) {
			console.log("disable choices callback", data);
			this.set("acceptingChoices", !data);
			this.trigger(events.disableChoices, data);
		},

	  status: function () {
			this.socket.emit(socketEvents.status);
		},

	  statusCallback: function (data) {
			// console.log("status callback", data);
			this.set("acceptingChoices", data.acceptingChoices)
			this.trigger(events.status, data);
		},

	  submitChoice: function (id, choice) {
			this.socket.emit(socketEvents.submitChoice, id + ":" + choice);
		},

	  dataCallback: function (data) {
			this.trigger(events.data, data);
		}
	});

	ParticipantServer.Views.Status = Backbone.View.extend({
		template: "participantServer/status",

		serialize: function () {
  		return {
  			model: this.model,
  			classes: {
  				isConnected: this.model.get("connected") ? "is-connected" : "not-connected",
  				isAcceptingChoices: this.model.get("acceptingChoices") ? "is-accepting-choices" : "not-accepting-choices",
  				connected: this.model.get("connected") ? "status-on" : "status-off",
  				acceptingChoices: this.model.get("acceptingChoices") ? "status-on" : "status-off"
  			},
  			labels: {
  				connected: this.model.get("connected") ? "Connected" : "Disconnected",
  				acceptingChoices: this.model.get("acceptingChoices") ? "Accepting Choices" : "Not Accepting Choices"
  			}
  		};
  	},

  	initialize: function () {
  		this.listenTo(this.model, "change", this.render);
  	}
	});

	return ParticipantServer;
});