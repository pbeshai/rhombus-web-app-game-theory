/** Module for interfacing with the participant server over websocket
 */
define(["app", "socketio"],
	function (app, io) {
	"use strict"

	var socketEvents = { // events we send across the websocket
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
			choiceRegExp: /(\w+):([A-E])/g  // regular expression for choice data. Matches ID:Choice (e.g., 17fa321:A)
		},
	  events = { // client-side events that we allow handlers for
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

		initialize: function () {
			// bind this to the callbacks
			_.bindAll(this, "dataCallback", "statusCallback", "connectCallback",
				"disconnectCallback", "enableChoicesCallback", "disableChoicesCallback");

			// connect to the websocket
		  var socket = this.socket = io.connect(config.websocketUrl);

		  // bind websocket events
		  socket.on(socketEvents.choiceData, this.dataCallback);
		  socket.on(socketEvents.status, this.statusCallback);
		  socket.on(socketEvents.connect, this.connectCallback);
		  socket.on(socketEvents.disconnect, this.disconnectCallback);
		  socket.on(socketEvents.enableChoices, this.enableChoicesCallback);
		  socket.on(socketEvents.disableChoices, this.disableChoicesCallback);
		},

	  connect: function () {
			this.socket.emit(socketEvents.connect);
		},

	  connectCallback: function (data) {
			console.log("connect callback", data);
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
			console.log("status callback", data);
			this.set("acceptingChoices", data.acceptingChoices)
			this.trigger(events.status, data);
		},

	  submitChoice: function (data) {
			this.socket.emit(socketEvents.submitChoice, data);
		},

		// returns an array [{ id: x, choice: x }, ...]
	  parseData: function (data) {
			var result, id, choice;
			var choiceData = [];
			while(result = config.choiceRegExp.exec(data.choices)) {
				id = result[1];
				choice = result[2];

				choiceData.push({id: id, choice: choice});
			}

			return choiceData;
		},

	  dataCallback: function (data) {
			var choiceData = this.parseData(data);
			this.trigger(events.data, choiceData);
		}
	});

	ParticipantServer.Views.Status = Backbone.View.extend({
		template: "participantServer/status",

		serialize: function () {
  		return { model: this.model };
  	},

  	initialize: function () {
  		this.listenTo(this.model, "change", this.render);
  	}
	});

	return ParticipantServer;
});