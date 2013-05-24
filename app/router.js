define([
  // Application.
  "app",

  "modules/ClickerServer",
  "modules/ClickerApp",
  "modules/ClickerDisplay"
],

function(app, ClickerServer, ClickerApp, ClickerDisplay) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    initialize: function() {
      ClickerServer.initialize();
      // TODO Clean this up...
      /*
      var collections = {
        // Set up the users.
        users: new User.Collection(),

        // Set the repos.
        repos: new Repo.Collection(),

        // Set up the commits.
        commits: new Commit.Collection()
      };


      // Ensure the router has references to the collections.
      _.extend(this, collections);
      */

      // Use main layout and set Views.
      //app.useLayout("main-layout").setViews({
       // ".users": new User.Views.List(collections),
      //}).render();
    },

    routes: {
      "": "index"
    },

    index: function() {
      console.log(ClickerApp);
      display = new ClickerDisplay();
      //display.build();
      //display.handleClick({id: 0, clicker: "Peter"}, "C");
    }
  });

  return Router;

});
