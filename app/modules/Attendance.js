/**

A simple module for showing active participants and allowing registration of new ones.

*/
define([
  // Application.
  "app",

  "modules/common/Common",
  "modules/Participant",

  "apps/StateApp"
],

function(app, Common, Participant, StateApp) {

  var Attendance = app.module();

  Attendance.Instructions = Common.Models.Instructions.extend({
    description: "Press any button to check-in.",
    buttonConfig: {
      "A": { description: "Check-in" },
      "B": { description: "Check-in" },
      "C": { description: "Check-in" },
      "D": { description: "Check-in" },
      "E": { description: "Check-in" }
    }
  });

  Attendance.Views.Participant = app.BaseView.extend({
  	template: "attendance/participant",
    tagName: "div",
    className: "participant",
    hereClass: "participant-here",

  	serialize: function () {
  		return { model: this.model };
  	},

    rendering: {
      fadeIn: true,

      before: function () {
        var choice = this.model.get("choice");

        // remove old choice classes and set new one
        if (choice !== undefined) {
          this.$el.addClass(this.hereClass);
        } else {
          this.$el.removeClass(this.hereClass);
        }
      }
    },

  	initialize: function () {
  		this.listenTo(this.model, "change", this.render);
  	}
  });

  Attendance.Views.Participants = Backbone.View.extend({
    template: "attendance/layout",
    options: {
      acceptNew: false,
    },

  	serialize: function () {
  		return { collection: this.options.participants };
  	},

  	beforeRender: function () {
      this.collection.each(function (participant) {
  			this.insertView(".participant-grid", new Attendance.Views.Participant({ model: participant }));
  		}, this);
      this.insertView(new Common.Views.Instructions({ model: new Attendance.Instructions() }));
  	},

    add: function (participant) {
      console.log("register view add", arguments);
      var newView = new Attendance.Views.Participant({ model: participant })
      this.insertView(".participant-grid", newView);
      newView.render();
    },

  	initialize: function () {
      if (this.options.acceptNew) {
        this.prevAcceptNew = this.collection.options.acceptNew;
        this.collection.options.acceptNew = true; // allow new users to be added when data comes from server
      }

      this.listenTo(this.collection, {
  			"reset": this.render,
        "add": this.add
  		});

      // listen for data changes
      app.participantServer.hookCollection(this.collection, this);
  	},

    cleanup: function () {
      if (this.options.acceptNew) {
        this.collection.options.acceptNew = this.prevAcceptNew;
      }
    }

  });

  // To be used in StateApps
  Attendance.State = function (options) {
    this.options = options;
    this.initialize();
  }
  Attendance.State.prototype = new StateApp.State(Attendance.Views.Participants);
  _.extend(Attendance.State.prototype, {
    initialize: function () {
      this.options.viewOptions = {
        collection: this.options.participants,
        acceptNew: this.options.acceptNew
      };
    },

    getOutput: function () {
      var presentParticipants = this.options.participants;
      var notHere = presentParticipants.filter(function (participant) {
        return participant.get("choice") === undefined;
      });
      presentParticipants.remove(notHere);

      // register new guys (those without id attr)
      if (this.options.acceptNew && this.options.saveNew) {
        presentParticipants.saveNew();
      }


      return presentParticipants;
    }
  });

  return Attendance;
});