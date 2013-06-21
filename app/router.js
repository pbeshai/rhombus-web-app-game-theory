define([
  // Application.
  "app",

  "modules/Sandbox", // for testing

  "modules/ParticipantServer",
  "modules/StateController",
  "modules/ViewControls",

  "modules/Participant",
  "modules/Grid",
  "modules/Controls",
  "modules/Register",
  "modules/Attendance",
  "modules/Clicker",

  "apps/GridApp",
  "apps/PrisonersDilemmaApp"

],

function(app, Sandbox, ParticipantServer, StateController, ViewControls, Participant, Grid, Controls, Register, Attendance,
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
        ".server-status": new ParticipantServer.Views.Status({ model: participantServer})
      });

      // as the window focus
      $(window).on("focus", function () {
        stateController.instructorFocus();
      });

      stateController.on("instructor-focus", function (hasFocus) {
        app.instructorFocus = hasFocus;
        if (hasFocus) {
          $(document.body).addClass("instructor-focus");
        } else {
          $(document.body).removeClass("instructor-focus");
        }
      });

      // setup instructor handling
      participantServer.on("instructor", function (data) {
        if (!app.instructorFocus) {
          return;
        }

        // for now, only use the first item in the data array (highly unusual to have more than one)
        var choice = data[0].choice;
        switch (choice) {
          case "A":
            console.log("instructor A: toggle polling");
            if (participantServer.get("acceptingChoices")) {
              participantServer.disableChoices();
            } else {
              participantServer.enableChoices();
            }
            break;
          case "B":
            console.log("instructor B (unused)");
            break;
          case "C":
            console.log("instructor C: next state");
            stateController.appNext();
            break;
          case "D":
            console.log("instructor D: prev state");
            stateController.appPrev();
            break;
          case "E":
            console.log("instructor E (unused)");
            break;
        }
      });
    },

    routes: {
      "": "index",
      "grid": "grid",
      "controls": "controls",
      "register": "register",
      "attendance": "attendance",
      "clicker": "clicker",
      "apps/:name": "appHandler",
      "sandbox": "sandbox"
    },

    index: function () {
      console.log("[router: index]");
      this.reset();

      app.layout.setViews({
        "#main-content": new Participant.Views.List({ collection: this.participants}),
      }).render();
    },

    grid: function () {
      console.log("[router: grid]");
      this.reset();

      app.layout.setViews({
        "#main-content": new Grid.Views.Participants({collection: this.participants})
      }).render();
    },

    controls: function () {
      console.log("[router: controls]");
      this.reset();

      app.layout.setViews({
        "#main-content": new Controls.Views.Controls({participants: this.participants})
      }).render();
    },

    register: function () {
      console.log("[router: register]");
      this.reset();

      app.layout.setViews({
        "#main-content": new Register.Views.Register({
          participants: this.participants
        })
      }).render();
    },

    attendance: function () {
      console.log("[router: attendance]");
      this.reset();

      app.layout.setViews({
        "#main-content": new Attendance.Views.Participants({collection: this.participants})
      }).render();
    },

    clicker: function () {
      console.log("[router: clicker]");
      this.reset();

      app.layout.setViews({
        "#main-content": new Clicker.Views.Clickers({collection: this.participants})
      }).render();
    },

    appHandler: function (name) {
      console.log("[router: app/"+name+"]");
      this.reset();

      if (name === "grid") {
        var gridApp = new GridApp({ participants: this.participants });
        app.stateController.set("activeApp", gridApp);
        window.gridApp = gridApp;
        console.log("gridApp in window", gridApp);
      } else if (name === "pd") {
        var prisonersDilemmaApp = new PrisonersDilemmaApp({ participants: this.participants });
        app.stateController.set("activeApp", prisonersDilemmaApp);

        window.prisonersDilemmaApp = prisonersDilemmaApp;
        console.log("prisonersDilemmaApp in window", gridApp);
      }
    },

    sandbox: function () {
      console.log("[router: sandbox]");
      this.reset();

      app.layout.setViews({
        "#main-content": new Sandbox.Views.Sandbox(),
      }).render();
    },

    // reset state
    reset: function () {
      this.participants.fetch({ reset: true });
      app.stateController.reset();
    }
  });

  return Router;

});
