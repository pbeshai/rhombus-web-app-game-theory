/**

	Control panel.

*/
define([
  // Application.
  "app",

  "plugins/jQuery.psToggleButton"
],

function(app) {

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
    }

  Controls.Views.Controls = Backbone.View.extend({
    tagName: "div",
    className: "controls",
    template: "controls/controls",

    events: {
      "click .clear-database": "clearDatabase"
    },

  	serialize: function () {
  		return { participantServer: app.participantServer };
  	},

    afterRender: function () {
      enableChoicesButton(this.$(".enable-choices-button"), app.participantServer);
    },

    clearDatabase: function () {
      // TODO: make confirm prettier
      var verify = confirm("Are you sure you want to clear the participant database?");

      if (verify) {
        console.log("clearing database");
        app.api({
          call: "participant",
          type: "DELETE",
          success: function () {
            console.log("successful deletion of participants");
          },
          error: function () {
            console.log("error deleting participants");
          }
        });
      }
    },

  	initialize: function () {
      console.log("controls server: ", app.participantServer);
      app.setTitle("Control Panel");
      /*
      this.listenTo(this.options.participants, {
  			"reset": this.render
  		});
      */
  	}

  });

  return Controls;
});