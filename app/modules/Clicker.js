/**

	A simple grid app for displaying choices

*/
define([
  // Application.
  "app",

  "modules/Participant",

  "apps/StateApp"
],

function(app, Participant, StateApp) {

  var Clicker = app.module();

  // TODO: clean this up

  Clicker.Views.Clicker = Backbone.View.extend({
  	template: "clicker/clicker",
    tagName: "div",
    className: "clicker",

    events: {
      "click .clicker-btn" : "buttonClick"
    },
    enabled: false,
    id: null,
    buttons: ["A","B","C","D","E"],

  	serialize: function () {
  		return {
        id: this.options.id,
        buttons: this.buttons
      };
  	},

    afterRender: function () {
      if (!this.enabled) { // make buttons disabled
        this.disable();
      }
    },

    buttonClick: function (event) {
      var button = event.target;
      this.choose(button.innerHTML);
    },

    // disables the buttons
    disable: function () {
      this.$("button").prop("disabled", true).addClass("disabled");
      this.enabled = false;
    },

    // enables the buttons
    enable: function () {
      this.$("button").prop("disabled", false).removeClass("disabled");
      this.enabled = true;
    },

    choose: function (choice) {
      if (this.enabled) {
        console.log(this.id + " chooses " + choice);
        app.participantServer.submitChoice(this.id, choice);
      }
    },

    randomChoice: function () {
      var choice = this.buttons[Math.floor(Math.random() * this.buttons.length)];
      this.choose(choice);
    },

  	initialize: function (options) {
      if (this.options) {
        this.id = this.options.id;
        if (this.options.buttons) {
          this.buttons = this.options.buttons;
        }
      }

      var participantServer = app.participantServer;
      // disable when clicks are disabled
      participantServer.on("enable-choices", $.proxy(function (success) {
        if (success) {
          this.enable();
        }
      }, this));
      participantServer.on("disable-choices", $.proxy(function (success) {
        if (success) {
          this.disable();
        }
      }, this));

      participantServer.on("status", $.proxy(function (state) {
        if (state.acceptingChoices) {
          this.enable();
        } else {
          this.disable();
        }
      }, this));

      participantServer.on("disconnect", $.proxy(this.disable, this));
  	}
  });

  // TODO: add in random votes button.
  Clicker.Views.Clickers = Backbone.View.extend({
  	serialize: function () {
  		return { collection: this.options.participants };
  	},

  	beforeRender: function () {
      this.options.participants.each(function (participant) {
  			this.insertView(new Clicker.Views.Clicker({ id: participant.get("alias") }));
  		}, this);
  	},


  	initialize: function () {
      app.setTitle("Clickers");
  	}
  });

  return Clicker;
});