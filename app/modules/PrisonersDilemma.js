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

  var PrisonersDilemma = app.module();

  PrisonersDilemma.Views.Participant = Backbone.View.extend({
  	template: "pd/participant",
    tagName: "div",
    className: "participant",

    choiceClass: {
      A: "choice-a",
      B: "choice-b",
    },

  	serialize: function () {
  		return { model: this.model };
  	},

    beforeRender: function () {
      console.log("PD render!");
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

  PrisonersDilemma.Views.Participants = Backbone.View.extend({
    tagName: "div",
    className: "participant-grid",

  	serialize: function () {
  		return { collection: this.options.participants };
  	},

  	beforeRender: function () {
      this.options.participants.each(function (participant) {
  			this.insertView(new PrisonersDilemma.Views.Participant({ model: participant }));
  		}, this);
  	},


  	initialize: function () {
      this.listenTo(this.options.participants, {
  			"reset": this.render
  		});
      app.setTitle("PrisonersDilemma");
  	}

  });

  PrisonersDilemma.Model = Backbone.Model.extend({
    defaults: {
      "played": false,
      "partner": null,
      "score": null
    },
    initialize: function () {
      this.on("change:choice", function () {
        this.set("played", true);
      })
    }
  });
  PrisonersDilemma.Collection = Participant.Collection.extend({
    url: null,
    model: PrisonersDilemma.Model
  })

  // To be used in StateApps
  PrisonersDilemma.States = {};
  PrisonersDilemma.States.Play = function (options) {
    this.options = options
    this.initialize();
  }
  PrisonersDilemma.States.Play.prototype = new StateApp.State(PrisonersDilemma.Views.Participants);
  _.extend(PrisonersDilemma.States.Play.prototype, {
    initialize: function () {
    },

    beforeRender: function () {
      console.log("pd before render: ", this.input);
      // create PD Participants from these Participant Models
      var pdParticipants = this.input.map(function (participant) {
        return new PrisonersDilemma.Model({ alias: participant.get("alias") });
      });

      var collection = new PrisonersDilemma.Collection(pdParticipants);
      if (this.input) {
        this.options.viewOptions = { participants: collection };
      }
    }
  })


  return PrisonersDilemma;
});