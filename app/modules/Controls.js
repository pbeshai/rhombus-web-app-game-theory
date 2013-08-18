/**

	Control panel.

*/
define([
  // Application.
  "app",

  "modules/Clicker",
  "apps/Apps",

  "util/jquery/jQuery.psToggleButton"
],

function(app, Clicker, Apps) {

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
      "click .prev-state" : "prevState",
    },

    initialize: function () {
      this.listenTo(this.options.activeApp, "change:currentState", this.render);
    },
    serialize: function () {
      return {
        title: this.options.title,
        states: this.options.activeApp.states,
        currentState: this.options.activeApp.get("currentState")
      }
    },

    beforeRender: function () {
      if (this.options.appConfigView) {
        this.setView(".configure", new Controls.Views.Configure({ appConfigView: this.options.appConfigView }));
      }
    },

    afterRender: function () {
      if (this.options.appConfigView == null) {
        this.$(".configure").hide();
      }
    },

    nextState: function () {
      app.controller.appNext();
    },

    prevState: function () {
      app.controller.appPrev();
    },

  });

  Controls.ConfigurationModel = Backbone.Model.extend({
    sync: function () {
      app.controller.appConfig(this.attributes);
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
      this.model = new Controls.ConfigurationModel();
    }
  });

  Controls.Views.Viewers = Backbone.View.extend({
    template: "controls/viewers",

    serialize: function () {
      return { viewers: app.controller.get("viewers") };
    },

    initialize: function () {
      this.listenTo(app.controller, "change:viewers", this.render);
    }
  });

  Controls.Views.Controls = Backbone.View.extend({
    className: "controls",
    template: "controls/controls",

    events: {
      "click .clear-database": "clearDatabase",
    },

    initialize: function () {
      // TODO: not sure where to put these
      app.controller.participantServer.hookCollection(this.options.participants, this);
      this.listenTo(this.options.participants, "change", app.controller.changedParticipant);
      this.listenTo(this.options.participants, "sync", app.controller.syncParticipants);

      // TODO: temporary keyboard shortcuts for faster debugging
      $(document.body).on("keypress", function (evt) {
        if (evt.ctrlKey) {
          switch (evt.which) {
            case 49: // ctrl-1
              console.log("prev state");
              $(".prev-state").click();
              break;
            case 50: // ctrl-2
              console.log("next state");
              $(".next-state").click();
              break;
            case 51: // ctrl-3
              console.log("random votes");
              $(".random-votes").click();
              break;
            case 52: // ctrl-4
              console.log("random AB votes");
              $(".random-votes-ab").click();
              break;
          }
        }
      })
    },

    beforeRender: function () {
      var appSelector = new Apps.Views.Selector();
      this.setView(".app-selector", appSelector);
      var controls = this;

      // when an application has been selected
      appSelector.on("app-selected", _.bind(this.appSelected, this));

      this.insertView(".clicker-panel", new Clicker.Views.Clickers({ collection: this.options.participants}));

      this.setView(".viewers", new Controls.Views.Viewers());
    },

    appSelected: function (selectedApp) {
      var $appControls = this.$(".app-controls");

      // save old height to prevent flicker
      var oldHeight = $appControls.height();
      $appControls.css("min-height", oldHeight).css({opacity: 0});


      // reset the participants if there was another app running previously
      this.options.participants.fetch({ reset: true });


      // instantiate the application.
      app.controller.set("activeApp", selectedApp.instantiate({ participants: this.options.participants }));

      // show the this and config for the app
      var appControls = new Controls.Views.AppControls({
        title: selectedApp.title,
        appConfigView: selectedApp.configView,
        activeApp: app.controller.get("activeApp")
      });

      this.setView(".app-controls", appControls);
      appControls.on("afterRender", function () {
        $appControls.css("min-height", "").animate({opacity: 1});
      });
      appControls.render();
    },

    afterRender: function () {
      enableChoicesButton(this.$(".enable-choices-button"), app.controller.participantServer);
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