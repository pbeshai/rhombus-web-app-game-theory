/**
A module that lets you select what mode of browser window this is - a controller or a viewer.
*/
define([
  // Application.
  "app",

  "modules/ParticipantServer",
  "modules/AppController",

  "modules/Participant"
],

function(app, ParticipantServer, AppController, Participant) {

  var Modes = app.module();

  Modes.Controller = Backbone.Model.extend({
    initialize: function (attrs) {
      console.log("init controller mode");
      this.participantServer = new ParticipantServer.Model({ socket: attrs.socket });
      this.appController = new AppController.Model({ socket: attrs.socket });

      this.handleInstructor();
    },

    // setup instructor handling
    handleInstructor: function () {
      console.log("init handle instructor");

      this.participantServer.on("instructor", function (data) {
        // for now, only use the first item in the data array (highly unusual to have more than one)
        var choice = data[0].choice;
        switch (choice) {
          case "A":
            console.log("instructor A: toggle polling");
            if (this.participantServer.get("acceptingChoices")) {
              this.participantServer.disableChoices();
            } else {
              this.participantServer.enableChoices();
            }
            break;
          case "B":
            console.log("instructor B (unused)");
            break;
          case "C":
            console.log("instructor C: next state");
            this.appController.appNext();
            break;
          case "D":
            console.log("instructor D: prev state");
            this.appController.appPrev();
            break;
          case "E":
            console.log("instructor E (unused)");
            break;
        }
      });
    }
  });

  Modes.Viewer = Backbone.Model.extend({
    initialize: function (attrs) {
      console.log("init viewer mode");
      this.appController = new AppController.Model({ socket: attrs.socket });
      this.listenTo(this.appController, "load-view", this.loadView);

      this.listenTo(this.appController, "update-view", this.updateView);
    },

    loadView: function (data) {
      console.log("viewer got load view", data);

      // handle participants/collection as a special case since it is so common.
      // (reconstruct the array into a Participant.Collection object)
      if (data.options.participants) {
        data.options.collection = Participant.Util.collectionFromArray(data.options.participants);
        delete data.options.participants;
      }
      // TODO: interpret the load view command to load the appropriate view
      app.setMainView(new app.views[data.view](data.options));
    },

    updateView: function (data) {
      console.log("update view data", data);

      // TODO: interpret the update view command to update the view properly

      var mainView = app.getMainView();

      // TODO: this special case and in load view should probably be in diff functions so views can override

      if (data.participants && mainView.collection) {
        // handle participants as a special case
        mainView.collection.update(data.participants);
      }

      if (mainView.update) {
        mainView.update(data);
      }
    }
  });

  Modes.Views.Selector = Backbone.View.extend({
  	template: "modes/selector",
    className: "mode-selector",

    events: {
      "click #btn-controller" : "selectController",
      "click #btn-viewer" : "selectViewer",
      "change #app-id-input" : "updateAppId"
    },

    // selects the mode and connects the websocket
    selectMode: function (mode, appId) {
      if (app.controller || app.viewer) {
        console.log("already connected and registered. aborting new registration", arguments);
        return;
      }

      var socket = io.connect(app.socketUrl);

      // register the viewer/controller
      socket.on("connect", function () {
        socket.emit("register", { type: mode, app: appId });
      });

      // get the viewer/controller id
      socket.on("registered", function (data) {
        console.log("registered", data);
        if (mode === "controller") {
          app.controller = new Modes.Controller({ id: data.id, socket: socket });
          app.router.controls();
        } else {
          app.viewer = new Modes.Viewer({ id: data.id, socket: socket });
          app.router.viewer();
          // app.router.appHandler("grid");
        }
        $("#browser-id").html(data.id);
      });
    },

    selectController: function () {
      this.selectMode("controller", this.model.get("appId"));
    },

    selectViewer: function () {
      this.selectMode("viewer", this.model.get("appId"));
    },

    updateAppId: function () {
      this.model.set("appId", this.$("#app-id-input").val());
    },

  	serialize: function () {
  		return { model: this.model };
  	}
  });

  Modes.Views.Viewer = Backbone.View.extend({
    template: "viewer/viewer",
    className: "viewer",

    serialize: function () {
      return {
        viewerId: app.viewer.id,
      }
    },

    initialize: function () {
      console.log("init viewer view");
    }
  });

  return Modes;
});