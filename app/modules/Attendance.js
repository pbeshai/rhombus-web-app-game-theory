/**

	A simple grid app for displaying choices

*/
define([
  // Application.
  "app",

  "modules/Participant"
],

function(app, Participant) {

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

  	serialize: function () {
  		return { collection: this.options.participants };
  	},

  	beforeRender: function () {
      this.options.participants.each(function (participant) {
  			this.insertView(new Attendance.Views.Participant({ model: participant }));
  		}, this);
  	},


  	initialize: function () {
      this.listenTo(this.options.participants, {
  			"reset": this.render
  		});
      app.setTitle("Attendance");
  	}

  });

  return Attendance;
});