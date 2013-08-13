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
      "click .load-view" : "loadView",
      "click .load-view2" : "loadView2",
      "click .update-view" : "updateView"
    },

    serialize: function () {
      return {
        title: this.options.title
      }
    },

    beforeRender: function () {
      if (this.options.appConfigView) {
        this.insertView(".configure", new Controls.Views.Configure({ appConfigView: this.options.appConfigView }));
      }
    },

    afterRender: function () {
      if (this.options.appConfigView == null) {
        this.$(".configure").hide();
      }
    },

    nextState: function () {
      app.controller.appController.appNext();
    },

    prevState: function () {
      app.controller.appController.appPrev();
    },

    loadView: function () {
      // TODO: shouldn't be hardcoded values
      app.controller.appController.loadView("attendance", { participants: app.router.participants }, "Viewer1");
    },

    loadView2: function () {
      // TODO: shouldn't be hardcoded values
      app.controller.appController.loadView("grid", { participants: app.router.participants }, "Viewer1");
    },

    // TODO: temporary function to test update view
    updateView: function () {
      app.router.participants.each(function (p) { p.set("choice", (p.get("choice") === "A") ? "B" : "A"); });
      app.controller.appController.updateView({ participants: app.router.participants }, "Viewer1");
    }
  });

  Controls.ConfigurationModel = Backbone.Model.extend({
    sync: function () {
      app.controller.appController.appConfig(this.attributes);
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

  Controls.Views.Controls = Backbone.View.extend({
    tagName: "div",
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
    },

    beforeRender: function () {
      var appSelector = new Apps.Views.Selector();
      this.setView(".app-selector", appSelector);
      var controls = this;

      // when an application has been selected
      appSelector.on("app-selected", function (selectedApp) {
        var $appControls = controls.$(".app-controls");

        // save old height to prevent flicker
        var oldHeight = $appControls.height();
        $appControls.css("min-height", oldHeight).css({opacity: 0});

        // instantiate the application.
        app.controller.appController.set("activeApp", selectedApp.instantiate({ participants: controls.options.participants }));

        // show the controls and config for the app
        var appControls = new Controls.Views.AppControls({
          title: selectedApp.title,
          appConfigView: selectedApp.configView
        });

        controls.setView(".app-controls", appControls);
        appControls.on("afterRender", function () {
          $appControls.css("min-height", "").animate({opacity: 1});
        });
        appControls.render();
      });

      this.insertView(".clicker-panel", new Clicker.Views.Clickers({ collection: this.options.participants}));
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