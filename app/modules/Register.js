/**

	An app for registering participants

*/
define([
  // Application.
  "app",

  "modules/Participant",


  "plugins/jQuery.toggleButton"
],

function(app, Participant) {

  var Register = app.module();

  Register.Views.Register = Backbone.View.extend({
    tagName: "div",
    template: "register/register",

    events: {
      "click .register-submit" : "register",
    },

    listenForId: function (event) {
      console.log("listen for server id", this);
      this.model.set("server_id", "");
      this.$("input.server-id").attr("placeholder", "Listening...").prop("disabled", true);
      // should be listenToOnce
      this.listenTo(app.participantServer, "data", function (data) {
        this.cancelListen();
        this.$(".listen-server-id").trigger("to-state1");
        this.model.set("server_id", data[0].id);
      });
    },


    cancelListen: function () {
      console.log("cancel");
      this.stopListening(app.participantServer, "data");
      this.$("input.server-id").removeAttr("placeholder").prop("disabled", false);
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
      this.insertView(".participants", new Participant.Views.Table({ participants: this.options.participants }));
  	},

    afterRender: function () {
      this.$(".listen-server-id").toggleButton({
        textState1: "Listen",
        textState2: "Cancel",
        clickState1: this.listenForId,
        clickState2: this.cancelListen
      });
    },


  	initialize: function () {
      _.bindAll(this, "listenForId", "cancelListen");
      this.listenTo(this.model, {
  	  	change: function () {
          this.$("input.server-id").val(this.model.get("server_id"));
          this.$("input.system-id").val(this.model.get("system_id"));
        }
  		 });
      app.setTitle("Register Participant");
  	}

  });

  return Register;
});