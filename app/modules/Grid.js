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

  var Grid = app.module();

  Grid.Views.Participant = Backbone.View.extend({
  	template: "grid/participant",
    tagName: "div",
    className: "participant",

    choiceClass: {
      A: "choice-a",
      B: "choice-b",
      C: "choice-c",
      D: "choice-d",
      E: "choice-e"
    },

  	serialize: function () {
  		return { model: this.model };
  	},

    beforeRender: function () {
      var choice = this.model.get("choice");
      // remove old choice classes and set new one
      this.$el
        .removeClass(_.values(this.choiceClass).join(" "))
        .addClass(this.choiceClass[choice]);
    },

  	initialize: function () {
  		this.listenTo(this.model, "change", this.render);
  	}
  });

  Grid.Views.Participants = Backbone.View.extend({
    tagName: "div",
    className: "participant-grid",

  	serialize: function () {
  		return { collection: this.options.participants };
  	},

  	beforeRender: function () {
      this.options.participants.each(function (participant) {
  			this.insertView(new Grid.Views.Participant({ model: participant }));
  		}, this);
  	},


  	initialize: function () {
      this.listenTo(this.options.participants, {
  			"reset": this.render
  		});
      app.setTitle("Grid");
  	}

  });

  // To be used in StateApps
  Grid.State = function (options) {
    this.options = options
    this.initialize();
  }
  Grid.State.prototype = new StateApp.State(Grid.Views.Participants);
  _.extend(Grid.State.prototype, {
    initialize: function () {
      this.options.viewOptions = { participants: this.options.participants }
    },

    beforeRender: function () {
      console.log("grid before render: ", this.input);
      if (this.input) {
        this.options.viewOptions = { participants: this.input };
      }
    }
  })


  return Grid;
});