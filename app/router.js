define([
  // Application.
  "app",

  "modules/Sandbox", // for testing

  "modules/ParticipantServer",
  "modules/AppController",
  "modules/ViewControls",

  "modules/Participant",
  "modules/Grid",
  "modules/Controls",
  "modules/Register",
  "modules/Attendance",
  "modules/Clicker",
  "modules/Modes",
  "apps/Apps",
],

function(app, Sandbox, ParticipantServer, AppController, ViewControls, Participant, Grid, Controls, Register, Attendance,
  Clicker, Modes, Apps) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    initialize: function() {
      console.log("TODO REMOVE THIS - app in window (top of router.js)");
      window.app = app;

      var collections = {
        // Set up the users.
        participants: new Participant.Collection(),
      };

      // Ensure the router has references to the collections.
      _.extend(this, collections);

      // Use main layout and set Views.
      app.useLayout("main-layout").setViews({
        ".view-controls": new ViewControls.Views.Controls(),
      });
    },

    apps: Apps.apps,

    routes: {
      "": "index",
      "grid": "grid",
      "controls": "controls",
      "register": "register",
      "attendance": "attendance",
      "clicker": "clicker",
      "apps/:name": "appHandler",
      "apps/:name/controls" : "appControlsHandler",
      "sandbox": "sandbox",
      "viewer": "viewer"
    },

    index: function () {
      console.log("[router: index]");
      this.reset();

      app.setMainView(new Modes.Views.Selector({ model: app.model }));
    },

    grid: function () {
      console.log("[router: grid]");
      this.reset();

      app.setTitle("Grid");
      app.setMainView(new Grid.Views.Participants({collection: this.participants}));
    },

    controls: function () {
      console.log("[router: controls]");
      this.reset();

      app.setTitle("Controls");
      app.layout.setViews({
        "#main-content": new Controls.Views.Controls({ participants: this.participants }),
        ".server-status": new ParticipantServer.Views.Status({ model: app.controller.participantServer})
      }).render();
    },

    viewer: function () {
      console.log("[router: viewer]");
      this.reset();

      app.setTitle("Viewer");
      app.setMainView(new Modes.Views.Viewer());
    },

    register: function () {
      console.log("[router: register]");
      this.reset();

      app.setTitle("Register");
      app.setMainView(new Register.Views.Register({ participants: this.participants }));
    },

    attendance: function () {
      console.log("[router: attendance]");
      this.reset();

      app.setTitle("Attendance");
      app.setMainView(new Attendance.Views.Participants({collection: this.participants}))
    },

    clicker: function () {
      console.log("[router: clicker]");
      this.reset();
      app.setTitle("Clickers");
      app.setMainView(new Clicker.Views.Clickers({collection: this.participants}));
    },

    appHandler: function (name) {
      console.log("[router: apps/"+name+"]");
      this.reset();

      var activeApp = this.apps[name];

      if (activeApp) {
        app.setTitle(activeApp.title);
        app.appController.set("activeApp", activeApp.instantiate(this));
      } else {
        console.log("no app found matching " + name);
      }
    },

    appControlsHandler: function (name) {
      console.log("[router: apps/"+name+"/controls]");
      this.reset();
      var configView, title;

      var activeApp = this.apps[name];
      if (activeApp) {
        configView = activeApp.configView
        title = activeApp.title + " Controls";
      }

      app.setTitle(title);
      app.setMainView(new Controls.Views.AppControls({
          title: title,
          appConfigView: configView
      }));
    },

    sandbox: function () {
      console.log("[router: sandbox]");
      this.reset();

      app.setTitle("Sandbox");
      app.setMainView(new Sandbox.Views.Sandbox());
    },

    // reset state
    reset: function () {
      this.participants.fetch({ reset: true });
      // app.reset(); TODO: this was to reset 'activeApp'
    }
  });

  return Router;

});
