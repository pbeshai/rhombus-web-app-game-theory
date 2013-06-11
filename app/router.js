define([
  // Application.
  "app",

  "modules/ParticipantServer",
  "modules/StateController",
  "modules/ViewControls",

  "modules/Participant",
  "modules/Grid",
  "modules/Controls",
  "modules/Register",
  "modules/Attendance",
  "modules/AttendanceOpen",
  "modules/Clicker",

  "apps/GridApp",
  "apps/PrisonersDilemmaApp"

],

function(app, ParticipantServer, StateController, ViewControls, Participant, Grid, Controls, Register, Attendance, AttendanceOpen,
  Clicker, GridApp, PrisonersDilemmaApp) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    initialize: function() {
      var participantServer = app.participantServer = new ParticipantServer.Model();
      var stateController = app.stateController = new StateController.Model();

      var collections = {
        // Set up the users.
        participants: new Participant.Collection(),

      };

      // Ensure the router has references to the collections.
      _.extend(this, collections);

      // Use main layout and set Views.
      app.useLayout("main-layout").setViews({
        ".view-controls": new ViewControls.Views.Controls(),
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
      "attendance-open": "attendanceOpen",
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

      this.participants.fetch();
      app.layout.setViews({
        "#main-content": new Controls.Views.Controls({participants: this.participants})
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

    attendanceOpen: function () {
      console.log("[router: attendance-open]");

      this.participants.fetch();

      app.layout.setViews({
        "#main-content": new AttendanceOpen.Views.Participants({participants: this.participants})
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

        window.gridApp = gridApp;
        console.log("gridApp in window", gridApp);
      } else if (name === "pd") {
        this.participants.fetch();
        var prisonersDilemmaApp = new PrisonersDilemmaApp({ participants: this.participants });

        window.prisonersDilemmaApp = prisonersDilemmaApp;
        console.log("prisonersDilemmaApp in window", gridApp);
      }
    }
  });

  return Router;

});
