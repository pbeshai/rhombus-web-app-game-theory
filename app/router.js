define([
  // Application.
  "app",

  "modules/ParticipantServer",
  "modules/Participant"
],

function(app, ParticipantServer, Participant) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    initialize: function() {
      ParticipantServer.initialize();

      var collections = {
        // Set up the users.
        participants: new Participant.Collection(),

      };

      collections.participants.add([
        {pid: "18981F9F", choice: "A"},
        {pid: "1FC5AE74", choice: "B"},
        {pid: "INSTRUCTOR", choice: "E"},
        ]);

      // Ensure the router has references to the collections.
      _.extend(this, collections);

      // Use main layout and set Views.
      app.useLayout("main-layout").setViews({
        ".participants": new Participant.Views.List(collections),
      }).render();
    },

    routes: {
      "": "index"
    },

    index: function() {
      console.log("index");
      ParticipantServer.on("connect", function () {
        console.log("connect???")
      });
    }
  });

  return Router;

});
