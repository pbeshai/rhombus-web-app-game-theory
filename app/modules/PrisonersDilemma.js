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
  PrisonersDilemma.Views.Play = {};
  PrisonersDilemma.Views.Results = {};

  PrisonersDilemma.Model = Backbone.Model.extend({
    defaults: {
      "played": false,
      "partner": null,
      "score": null
    },
    initialize: function () {
      // assumes choice is set with validate:true option
      this.on("change:choice", function (model, choice) {
        this.set("played", true);
      });
    },

    validate: function (attrs, options) {
      if (attrs.choice !== "A" && attrs.choice !== "B") {
        return "invalid choice " + attrs.choice + ". valid choices are A or B.";
      }
    }
  });
  PrisonersDilemma.Collection = Participant.Collection.extend({
    url: null,
    model: PrisonersDilemma.Model,

    initialize: function (models, options) {
      options = options || {};
      options.validateOnChoice = true;
      Participant.Collection.prototype.initialize.apply(this, [models, options]);
      this.on("reset", this.pairModels);
      this.pairModels(models);
    },

    // put all the models into pairs
    pairModels: function (models) {
      if (!_.isArray(models)) {
        models = this.models;
      }

      var indices = [];
      _.each(models, function (model, i) { indices[i] = i; });
      indices = _.shuffle(indices);

      if (indices.length < 2) {
        console.log("less than two models");
      } else {
        for(var i = 0; i < (indices.length - (indices.length % 2)); i += 2) {
          models[indices[i]].set("partner", models[indices[i+1]]);
          models[indices[i+1]].set("partner", models[indices[i]]);
        }

        if (indices.length % 2 == 1) {
          console.log("uneven number of models, one model with no partner: " + models[indices[indices.length-1]].get("alias"));
        }
      }

      console.log("pairing models", models, indices);
    },
  })


  PrisonersDilemma.Views.Play.Participant = Backbone.View.extend({
  	template: "pd/play/participant",
    tagName: "div",
    className: "participant",
    playedClass: "played",


  	serialize: function () {
  		return { model: this.model };
  	},

    beforeRender: function () {
      var played = this.model.get("played");
      // remove old choice classes and set new one
      if (played) {
        this.$el.addClass(this.playedClass);
      } else {
        this.$el.removeClass(this.playedClass);
      }

    },

  	initialize: function () {
  		this.listenTo(this.model, "change", this.render);
  	}
  });

  PrisonersDilemma.Views.Play.Participants = Backbone.View.extend({
    tagName: "div",
    className: "participant-grid",

  	beforeRender: function () {
      this.collection.each(function (participant) {
  			this.insertView(new PrisonersDilemma.Views.Play.Participant({ model: participant }));
  		}, this);
  	},


  	initialize: function () {
      app.participantServer.hookCollection(this.collection, this);

      this.listenTo(this.collection, {
  			"reset": this.render
  		});
      app.setTitle("Prisoners Dilemma");
  	},
  });

  PrisonersDilemma.Views.Results.Participant = Backbone.View.extend({
    template: "pd/results/participant",
    tagName: "div",
    className: "participant results",


    serialize: function () {
      return { model: this.model };
    },

    beforeRender: function () {
      var choice = this.model.get("choice");
      var pairChoices = this.model.get("pairChoices");

      this.$el.addClass("choices-"+pairChoices);
    },

    initialize: function () {
      this.listenTo(this.model, "change", this.render);
    }
  });

  PrisonersDilemma.Views.Results.Participants = Backbone.View.extend({
    tagName: "div",
    className: "participant-grid",

    beforeRender: function () {
      this.collection.each(function (participant) {
        this.insertView(new PrisonersDilemma.Views.Results.Participant({ model: participant }));
      }, this);
    },


    initialize: function () {
      this.listenTo(this.collection, {
        "reset": this.render
      });
      app.setTitle("Prisoners Dilemma: Results");
    }
  });


  // To be used in StateApps
  PrisonersDilemma.States = {};
  PrisonersDilemma.States.Play = function (options) {
    this.options = options || {};
    this.initialize();
  }
  PrisonersDilemma.States.Play.prototype = new StateApp.State(PrisonersDilemma.Views.Play.Participants);
  _.extend(PrisonersDilemma.States.Play.prototype, {
    initialize: function () {
    },

    beforeRender: function () {
      // create PD Participants from these Participant Models
      var pdParticipants = this.input.map(function (participant) {
        return new PrisonersDilemma.Model({ alias: participant.get("alias") });
      });

      this.participants = new PrisonersDilemma.Collection(pdParticipants);
      if (this.input) {
        this.options.viewOptions = { collection: this.participants };
      }
    },

    // outputs a PrisonersDilemma.Collection
    getOutput: function () {
      return this.participants;
    }
  });
  PrisonersDilemma.States.Results = function (options) {
    this.options = options || {};
    this.initialize();
  }
  PrisonersDilemma.States.Results.prototype = new StateApp.State(PrisonersDilemma.Views.Results.Participants);
  _.extend(PrisonersDilemma.States.Results.prototype, {
    initialize: function () {
      // scoring matrix (TODO read from option)
      this.scoringMatrix = {
        AA: [ 50, 50 ],
        AB: [ 30, 100 ],
        BA: [ 100, 30 ],
        BB: [ 0, 0 ]
      };
    },

    assignScores: function (models) {
      models.each(function (model) {
        var pairChoices = model.get("choice") + model.get("partner").get("choice");
        model.set({"score": this.scoringMatrix[pairChoices][0], "pairChoices": pairChoices});
      }, this);
    },

    beforeRender: function () {
      // this.input is a PrisonersDilemma.Collection
      this.options.viewOptions = { collection: this.input };

      // calculate the scores
      this.assignScores(this.input);


    },

    getOutput: function () { }
  })

  return PrisonersDilemma;
});