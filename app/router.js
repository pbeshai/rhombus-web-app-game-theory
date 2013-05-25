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
      ParticipantServer.initialize();

      var collections = {
        // Set up the users.
        participants: new Participant.Collection(),

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
