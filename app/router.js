define([
  // Application.
  "app",

  "modules/ParticipantServer",
  "modules/Participant",
  "modules/Grid",
  "modules/Controls"
],

function(app, ParticipantServer, Participant, Grid, Controls) {

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

      collections.participants.add([
        {id: "Peter", choice: "D"},
        {id: "Beshai", choice: "C"},
        {id: "18981F9F", choice: "A"},
        {id: "1FC5AE74", choice: "B"},
        {id: "INSTRUCTOR", choice: "E"}

        ]);

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
      "controls": "controls"
    },

    index: function () {
      console.log("[router: index]");
      app.layout.render();
    },

    grid: function () {
      console.log("[router: grid]");
      app.layout.setViews({
        "#main-content": new Grid.Views.Participants({participants: this.participants})
      }).render();
    },

    controls: function () {
      console.log("[router: controls]");

      app.layout.setViews({
        "#main-content": new Controls.Views.Controls()
      }).render();

    }
  });

  return Router;

});
