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

    beforeRender: function () {
      if (this.options.appView) {
        this.insertView(".app-view", this.options.appView);
      }
      console.log(this);
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
      // TODO: make confirm prettier
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