/**

	Control panel.

*/
define([
  // Application.
  "app",

  "modules/Clicker",

  "util/jquery/jQuery.psToggleButton"
],

function(app, Clicker) {

  var Controls = app.module();

  var enableChoicesButton = function ($button, participantServer) {
      $button.psToggleButton({
        clickState1: participantServer.enableChoices,
        clickState2: participantServer.disableChoices,
        textState1: "Enable Choices",
        textState2: "Disable Choices",
        state1To2Event: "enable-choices",
        state2To1Event: "disable-choices",
        classState1: "btn-success",
        classState2: "btn-danger",
        participantServer: participantServer
      });

      if (!participantServer.get("connected")) {
        $button.addClass("disabled").prop("disabled", true);
      }

      participantServer.on("status", function (state) {
        if (state.acceptingChoices) {
          $button.trigger("to-state2");
        } else {
          $button.trigger("to-state1");
        }
      });

      participantServer.on("connect", function (success) {
        console.log("connect? ", success, $button);
        if (success) {
          $button.removeClass("disabled").prop("disabled", false);
        } else {
          $button.addClass("disabled").prop("disabled", true);
        }
      });
      participantServer.on("disconnect", function (success) {
        if (success) {
          $button.addClass("disabled").prop("disabled", true);
        }
      });

      // check the current state, so we initialize correctly
      if (participantServer.get("acceptingChoices")) {
        $button.trigger("to-state2");
      }
    }


  Controls.Views.AppControls = Backbone.View.extend({
    tagName: "div",
    className: "controls",
    template: "controls/app_controls",

    events: {
      "click .next-state" : "nextState",
      "click .prev-state" : "prevState"
    },

    serialize: function () {
      return {
        title: this.options.title
      }
    },

    beforeRender: function () {
      this.insertView(".configure", new Controls.Views.Configure({ appConfigView: this.options.appConfigView }));
    },

    afterRender: function () {
      enableChoicesButton(this.$(".enable-choices-button"), app.participantServer);
    },

    nextState: function () {
      app.appController.appNext();
    },

    prevState: function () {
      app.appController.appPrev();
    }
  });

  Controls.ConfigurationModel = Backbone.Model.extend({
    sync: function () {
      app.appController.appConfig(this.attributes);
      this.changed = {};
    }
  });

  Controls.Views.Configure = Backbone.View.extend({
    template: "controls/configure",

    events: {
      "change .config-message": "updateMessage",
      "click .update-config": "submit"
    },

    beforeRender: function () {
      if (this.options.appConfigView) {
        this.insertView(".app-config-view", new this.options.appConfigView({ model: this.model }));
      }
    },

    onChange: function () {
      this.$(".update-config").removeClass("disabled").prop("disabled", false).addClass("btn-primary");
    },

    updateMessage: function (evt) {
      this.model.set("message", $(evt.target).val());
    },

    serialize: function () {
      return {
        model: this.model
      }
    },

    submit: function () {
      this.model.save();
      this.render();
    },

    initialize: function () {
      var modelOptions = {};

      // read defaults specified by the app view if available
      if (this.options.appConfigView) {
        modelOptions = _.extend(modelOptions, this.options.appConfigView.prototype.modelOptions);
      }
      this.model = new Controls.ConfigurationModel(modelOptions);
      this.listenTo(this.model, "change", this.onChange);
    }
  });

  Controls.Views.Controls = Backbone.View.extend({
    tagName: "div",
    className: "controls",
    template: "controls/controls",

    events: {
      "click .clear-database": "clearDatabase",
    },

    beforeRender: function () {
      this.insertView(".app-controls", new Controls.Views.AppControls());
      this.insertView(".clicker-panel", new Clicker.Views.Clickers({ collection: this.options.participants}));
    },

    clearDatabase: function () {
      var verify = confirm("Are you sure you want to clear the participant database?");

      if (verify) {
        console.log("clearing database");
        app.api({
          call: "participants",
          type: "DELETE",
          success: function () {
            console.log("successful deletion of participants");
          },
          error: function () {
            console.log("error deleting participants");
          }
        });
      }
    }
  });

  return Controls;
});