/**

	An app for registering participants

*/
define([
  // Application.
  "app",

  "modules/Participant",

  "plugins/jQuery.toggleButton",
  "vendor/bootstrap/js/bootstrap" // for button bar radio
],

function(app, Participant) {

  var Register = app.module();

  Register.Views.FormRegistration = Backbone.View.extend({
    template: "register/form",

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
        console.log(data[0]);
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
      event.preventDefault();

      var serverId = this.$("input.server-id").val();
      var systemId = this.$("input.system-id").val();

      this.model.set({
        "server_id": serverId,
        "system_id": systemId
      });

      this.trigger("save-registration", this.model);
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
          console.log("model changed!");
          this.$("input.server-id").val(this.model.get("server_id"));
          this.$("input.system-id").val(this.model.get("system_id"));
        }
       });
    }
  });

  Register.Views.AutoRegistration = Backbone.View.extend({
    template: "register/auto",
    idPrefix: "Clicker",
    counter: 1,

    events: {
      "click .auto-register-submit" : "register",
      "change .prefix" : "updatePrefix"
    },

    serialize: function () {
      return {
        model: this.model,
        prefix: this.idPrefix
      }
    },

    afterRender: function () {
      this.$(".auto-start-btn").toggleButton({
        classState1: "btn-success",
        classState2: "btn-danger",
        textState1: "Start",
        textState2: "Stop",
        clickState1: this.startAuto,
        clickState2: this.stopAuto
      });
    },

    initialize: function () {
      _.bindAll(this, "startAuto", "stopAuto");

      this.listenTo(this.model, {
        change: function () {
          this.$("input.server-id").val(this.model.get("server_id"));
          this.$("input.system-id").val(this.model.get("system_id"));
        }
       });
    },

    generateSystemId: function () {
      return this.idPrefix+this.counter.toString();
    },

    updatePrefix: function () {
      var prefixVal = this.$("input.prefix").val();

      if (this.idPrefix !== prefixVal) {
        this.idPrefix = prefixVal; // update the value to match the textfield

        // update system id to use new prefix
        if (!_.isEmpty(this.model.get("system_id"))) {
          this.model.set("system_id", this.generateSystemId());
        }

        return true; // updated
      }

      return false; // no update
    },

    startAuto: function () {
      this.listenTo(app.participantServer, "data", function (data) {
        // ensure the prefix is up to date
        var prefixChanged = this.updatePrefix();

        if (!prefixChanged && this.model.get("server_id") === data[0].id) {
          // no prefix change, but same ID came in => save
          this.register();
        } else {
          this.model.set("server_id", data[0].id);
          this.model.set("system_id", this.generateSystemId());
        }
      });
    },

    stopAuto: function () {
      this.stopListening(app.participantServer, "data");
    },

    register: function (event) {
      if (event) {
        event.preventDefault();
      }

      var serverId = this.$("input.server-id").val();
      var systemId = this.$("input.system-id").val();

      this.model.set({
        "server_id": serverId,
        "system_id": systemId
      });

      this.counter += 1;

      this.trigger("save-registration", this.model);
    }
  });

  Register.Views.Register = Backbone.View.extend({
    tagName: "div",
    template: "register/register",
    registrationViews: {},

    events: {
      "click .manual-reg-btn" : "manualRegistration",
      "click .auto-reg-btn" : "autoRegistration",
    },

  	serialize: function () {
  	},

  	beforeRender: function () {
      this.insertViews({
        ".participants": new Participant.Views.Table({ participants: this.options.participants }),
        ".register-participant": this.currentView
      });
  	},

  	initialize: function () {
      app.setTitle("Register Participant");

      this.currentView = new Register.Views.FormRegistration({ model: new Participant.Model() });

      this.on("save-registration", this.register);
  	},

    register: function (participant) {
      console.log("registering ", participant.get("server_id"), participant.get("system_id"));

      var participants = this.options.participants;
      var saved = participant.save(null, {
        success: function () {
          console.log("successfully saved!");
          participants.fetch();
          participant.clear();
        },
        error: function () {
          console.log("error saving", arguments);
        }
      });

      if (!saved) {
        console.log("didn't save: " +participant.validationError);
      }
    },

    updateRegistrationView: function () {
      this.setView(".register-participant", this.currentView);
      this.currentView.render();
    },

    manualRegistration: function () {
      if (!(this.currentView instanceof Register.Views.FormRegistration)) {
        this.currentView = new Register.Views.FormRegistration({ model: new Participant.Model() });
        this.updateRegistrationView();
      }
    },

    autoRegistration: function () {
      if (!(this.currentView instanceof Register.Views.AutoRegistration)) {
        this.currentView = new Register.Views.AutoRegistration({ model: new Participant.Model() });
        this.updateRegistrationView();
      }
    }
  });

  return Register;
});