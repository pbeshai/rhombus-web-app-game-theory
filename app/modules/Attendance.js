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

  var Attendance = app.module();

  Attendance.Views.Participant = Backbone.View.extend({
  	template: "attendance/participant",
    tagName: "div",
    className: "participant",
    hereClass: "participant-here",

  	serialize: function () {
  		return { model: this.model };
  	},

    beforeRender: function () {
      var choice = this.model.get("choice");
      // remove old choice classes and set new one

      if (choice !== undefined) {
        this.$el.addClass(this.hereClass);
      } else {
        this.$el.removeClass(this.hereClass);
      }
    },

  	initialize: function () {
  		this.listenTo(this.model, "change", this.render);
  	}
  });

  Attendance.Views.Participants = Backbone.View.extend({
    tagName: "div",
    className: "participant-grid",

  	beforeRender: function () {
      this.collection.each(function (participant) {
  			this.insertView(new Attendance.Views.Participant({ model: participant }));
  		}, this);
  	},


  	initialize: function () {
      this.listenTo(this.collection, {
  			"reset": this.render
  		});

      app.participantServer.hookCollection(this.collection, this);

      app.setTitle("Attendance");
  	},
  });

  // To be used in StateApps
  Attendance.State = function (options) {
    this.options = options;
    this.initialize();
  }
  Attendance.State.prototype = new StateApp.State(Attendance.Views.Participants);
  _.extend(Attendance.State.prototype, {
    initialize: function () {
      this.options.viewOptions = { collection: this.options.participants }
    },

    getOutput: function () {
      console.log("attendance output");
      var presentParticipants = this.options.participants;
      var notHere = presentParticipants.filter(function (participant) {
        return participant.get("choice") === undefined;
      });
      presentParticipants.remove(notHere);

      return presentParticipants;
    }
  });

  return Attendance;
});