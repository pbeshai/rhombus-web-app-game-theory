/**

A simple module for showing active participants and allowing registration of new ones.

*/
define([
  // Application.
  "app",

  "modules/Participant",

  "apps/StateApp"
],

function(app, Participant, StateApp) {

  var Attendance = app.module();

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
    tagName: "div",
    className: "participant-grid",
    options: {
      acceptNew: false,
    },

  	serialize: function () {
  		return { collection: this.options.participants };
  	},

  	beforeRender: function () {
      this.collection.each(function (participant) {
  			this.insertView(new Attendance.Views.Participant({ model: participant }));
  		}, this);
  	},

    add: function (participant) {
      console.log("register view add", arguments);
      var newView = new Attendance.Views.Participant({ model: participant })
      this.insertView(newView);
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

      app.setTitle("Attendance");
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
      console.log("open attendance output");

      var presentParticipants = this.options.participants;
      var notHere = presentParticipants.filter(function (participant) {
        return participant.get("choice") === undefined;
      });
      presentParticipants.remove(notHere);

      // register new guys (those without id attr)
      if (this.options.acceptNew) {
        presentParticipants.saveNew();
      }


      return presentParticipants;
    }
  });

  return Attendance;
});