/**

	An app for registering participants

*/
define([
  // Application.
  "app",

  "modules/Participant"
],

function(app, Participant) {

  var Register = app.module();

  Register.Views.Register = Backbone.View.extend({
    tagName: "div",
    template: "register/register",

    events: {
      "click .register-submit" : "register",
      "click .listen-server-id" : "listenForId"

    },

    listenForId: function (event) {
      console.log("listen for server id", this);
      // should be listenToOnce
      this.listenTo(app.participantServer, "data", function (data) {
        this.stopListening(app.participantServer, "data");
        this.model.set("server_id", data[0].id);
      });
    },

    register: function (event) {
      console.log("registering user");
      event.preventDefault();
      var serverId = this.$("input.server-id").val();
      var systemId = this.$("input.system-id").val();

      this.model.set({
        "server_id": serverId,
        "system_id": systemId
      });

      var participants = this.options.participants;
      var model = this.model;
      var saved = this.model.save(null, {
        success: function () {
          console.log("successfully saved!");
          participants.fetch();
          model.clear();
        },
        error: function () {
          console.log("error saving", arguments);
        }
      });

      if (!saved) {
        console.log("didn't save: " +this.model.validationError);
      }

      //return false;
    },

  	serialize: function () {
  		// return { collection: this.options.participants };
  	},

  	beforeRender: function () {
      this.insertView(".participants", new Participant.Views.List({ participants: this.options.participants }));
  	},


  	initialize: function () {
      var that = this;
      this.listenTo(this.model, {
  	  	change: function () {
          this.$("input.server-id").val(this.model.get("server_id"));
          this.$("input.system-id").val(this.model.get("system_id"));
        }
  		 });
  	}

  });

  return Register;
});