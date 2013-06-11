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

  Attendance.Views.Participant = Backbone.View.extend({
  	template: "attendance/participant",
    tagName: "div",
    className: "participant",
    hereClass: "participant-here",
    initialRender: true,

  	serialize: function () {
  		return { model: this.model };
  	},

    initialBeforeRender: function () {
      this.$el.hide();
    },

    initialAfterRender: function () {
      this.$el.fadeIn(200);
      this.initialRender = false;
    },

    beforeRender: function () {
      var choice = this.model.get("choice");

      if (this.initialRender) {
        this.initialBeforeRender();
      }

      // remove old choice classes and set new one
      if (choice !== undefined) {
        this.$el.addClass(this.hereClass);
      } else {
        this.$el.removeClass(this.hereClass);
      }
    },

    afterRender: function ()  {
      if (this.initialRender) {
        this.initialAfterRender();
      }
    },

  	initialize: function () {
  		this.listenTo(this.model, "change", this.render);
  	}
  });

  Attendance.Views.Participants = Backbone.View.extend({
    tagName: "div",
    className: "participant-grid",

  	serialize: function () {
  		return { collection: this.options.participants };
  	},

  	beforeRender: function () {
      this.options.participants.each(function (participant) {
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
      this.listenTo(this.options.participants, {
  			"reset": this.render,
        "add": this.add
  		});
      app.setTitle("Attendance");
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
      this.options.viewOptions = { participants: this.options.participants }
    },

    getOutput: function () {
      console.log("open attendance output");
      var presentParticipants = this.options.participants;
      var notHere = presentParticipants.filter(function (participant) {
        return participant.get("choice") === undefined;
      });
      presentParticipants.remove(notHere);

      // TODO: register new guys (those without id attr)

      return presentParticipants;
    }
  });

  return Attendance;
});