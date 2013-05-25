define([
  // Application.
  "app",

  "modules/ParticipantServer",
  "modules/Participant",
  "modules/Grid"
],

function(app, ParticipantServer, Participant, Grid) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    initialize: function() {
      var participantServer = new ParticipantServer.Model();

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
        ".participants": new Participant.Views.List(collections),
      });
    },

    routes: {
      "": "index",
      "grid": "grid"
    },

    index: function () {
      console.log("index");
      ParticipantServer.on("connect", function () {
        console.log("connect???")
      });
      app.layout.render();
    },

    grid: function () {
      console.log("grid");
      app.layout.setViews({
        ".participants": new Grid.Views.Participants({participants: this.participants})
      }).render();

    }
  });

  return Router;

});
