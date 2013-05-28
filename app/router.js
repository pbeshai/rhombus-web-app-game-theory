define([
  // Application.
  "app",

  "modules/ParticipantServer",
  "modules/Participant",
  "modules/Grid",
  "modules/Controls",
  "modules/Register"
],

function(app, ParticipantServer, Participant, Grid, Controls, Register) {

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
      app.useLayout("main-layout").setViews({
        ".server-status": new ParticipantServer.Views.Status({ model: participantServer}),
        "#main-content": new Participant.Views.List(collections),
      });
    },

    routes: {
      "": "index",
      "grid": "grid",
      "controls": "controls",
      "register": "register"
    },

    index: function () {
      console.log("[router: index]");
      this.participants.fetch();

      app.layout.render();
    },

    grid: function () {
      console.log("[router: grid]");

      // test data
      this.participants.add([
        {id: "Peter", choice: "D"},
        {id: "Beshai", choice: "C"},
        {id: "18981F9F", choice: "A"},
        {id: "1FC5AE74", choice: "B"},
        {id: "INSTRUCTOR", choice: "E"}
      ]);

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
          model: new Participant.Model,
          participants: this.participants })
      }).render();
    },
  });

  return Router;

});
