define([
  // Application.
  "app",

  "modules/ParticipantServer",
  "modules/StateController",

  "modules/Participant",
  "modules/Grid",
  "modules/Controls",
  "modules/Register",
  "modules/Attendance",
  "modules/Clicker",

  "apps/GridApp"
],

function(app, ParticipantServer, StateController, Participant, Grid, Controls, Register, Attendance, Clicker, GridApp) {

  var baseRoute = function(name, logic, views) {
    return function () {
      console.log("[router: "+name+"]");

      if (!_.isFunction(logic) && _.isObject(logic)) {
        views = logic;
      }

      if (_.isFunction(logic)) {
        logic.call(this);
      }

      if (views) {
        app.layout.setViews(views).render();
      } else {
        app.layout.render();
      }
    };
  }

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    initialize: function() {
      var participantServer = app.participantServer = new ParticipantServer.Model();
      var stateController = app.stateController = new StateController.Model();

      // TODO: remove; for debugging
      console.log("Making ParticipantServer available in window");
      window.participantServer = participantServer;

      var collections = {
        // Set up the users.
        participants: new Participant.Collection([], { participantServer: participantServer }),

      };

      // Ensure the router has references to the collections.
      _.extend(this, collections);

      // Use main layout and set Views.
      console.log("use layout");
      app.useLayout("main-layout").setViews({
        ".server-status": new ParticipantServer.Views.Status({ model: participantServer}),
        "#main-content": new Participant.Views.List(collections),
      });
    },

    routes: {
      "": "index",
      "grid": "grid",
      "controls": "controls",
      "register": "register",
      "attendance": "attendance",
      "clicker": "clicker",
      "apps/:name": "appHandler"
    },

    index: function () {
      console.log("[router: index]");
      this.participants.fetch();

      app.layout.render();
      console.log("rendered");
    },

    grid: function () {
      console.log("[router: grid]");

      this.participants.fetch();

      app.layout.setViews({
        "#main-content": new Grid.Views.Participants({participants: this.participants})
      }).render();
    },

    controls: function () {
      console.log("[router: controls]");
      app.layout.setViews({
        "#main-content": new Controls.Views.Controls()
      }).render();
    },

    register: function () {
      console.log("[router: register]");

      this.participants.fetch();

      app.layout.setViews({
        "#main-content": new Register.Views.Register({
          participants: this.participants
        })
      }).render();
    },

    attendance: function () {
      console.log("[router: attendance]");

      this.participants.fetch();

      app.layout.setViews({
        "#main-content": new Attendance.Views.Participants({participants: this.participants})
      }).render();
    },

    clicker: function () {
      console.log("[router: clicker]");

      this.participants.fetch();


      app.layout.setViews({
        "#main-content": new Clicker.Views.Clickers({participants: this.participants})
      }).render();
    },

    appHandler: function (name) {
      console.log("[router: app/"+name+"]");
      if (name === "grid") {
        this.participants.fetch();
        var gridApp = new GridApp({ participants: this.participants });
        //gridApp.initialize();
        window.gridApp = gridApp;
        console.log("gridApp in window", gridApp);
      }
    }
  });

  return Router;

});
