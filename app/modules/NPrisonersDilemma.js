/**

	A simple grid app for displaying choices

*/
define([
  // Application.
  "app",
  "modules/common/Common",
  "modules/PrisonersDilemma",
  "modules/Participant",

  "apps/StateApp",
],
function(app, Common, PrisonersDilemma, Participant, StateApp) {

  var NPrisonersDilemma = app.module();
  NPrisonersDilemma.config = {
    // See Goehring and Kahan (1976) The Uniform N-Person Prisoner's Dilemma Game : Construction and Test of an Index of Cooperation
    Rratio: .10, // Rratio = R*(n-1). 0 < R < n-1, closer to 1 means more incentive for cooperation
    H: 10 // score increment when gaining 1 more cooperator
  };

  NPrisonersDilemma.Instructions = Common.Models.Instructions.extend({
    buttonConfig: {
      "C": { description: "Cooperate" },
      "D": { description: "Defect" },
    }
  });

  NPrisonersDilemma.Views.Results = {};

  NPrisonersDilemma.Views.Results.Participant = Common.Views.ParticipantDisplay.extend({
    overrides: {
      cssClass: function () {
        return "results choice-" + this.model.get("choice");
      }
    }
  });

  NPrisonersDilemma.Views.Results.Stats = Backbone.View.extend({
    template: "npd/results/stats",

    serialize: function () {
      return {
        payoff: this.options.payoff
      };
    },

    beforeRender: function () {
      if (this.collection.length) {
        this.setView(".results-stats", new PrisonersDilemma.Views.Results.Stats({ collection: this.collection }));
      }
    },
  });

  NPrisonersDilemma.Views.Results.Layout = Common.Views.SimpleLayout.extend({
    overrides: {
      ParticipantView: NPrisonersDilemma.Views.Results.Participant,
      PostParticipantsView: NPrisonersDilemma.Views.Results.Stats
    }
  });

  NPrisonersDilemma.Views.Configure = Backbone.View.extend({
    template: "npd/configure",
    modelOptions: _.clone(NPrisonersDilemma.config),

    events: {
      "change #r-ratio-input": "updateRratio",
      "change #h-input": "updateH"
    },

    updateRratio: function (evt) {
      this.model.set("Rratio", $(evt.target).val());
    },

    updateH: function(evt) {
      this.model.set("H", $(evt.target).val());
    },

    serialize: function () {
      return {
        Rratio: this.model.get("Rratio"),
        H: this.model.get("H")
      }
    },

    initialize: function () {
      // use defaults so we don't overwrite if already there
      _.defaults(this.model.attributes, this.modelOptions);
    }
  });

  // To be used in StateApps
  NPrisonersDilemma.States = {};
  NPrisonersDilemma.States.Play = PrisonersDilemma.States.Play.extend({
    setViewOptions: function () {
      PrisonersDilemma.States.Play.prototype.setViewOptions.call(this);
      this.options.viewOptions.InstructionsModel = NPrisonersDilemma.Instructions;
    }
  });

  NPrisonersDilemma.States.Results = Common.States.Results.extend({
    view: NPrisonersDilemma.Views.Results.Layout,

    assignScores: function () {
      var models = this.collection;
      // See Goehring and Kahan (1976) The Uniform N-Person Prisoner's Dilemma Game : Construction and Test of an Index of Cooperation
      var R = this.config.Rratio*(models.length - 1); // 0 < R < N-1, closer to 1 means more incentive for cooperation
      var H = this.config.H; // score increment when gaining 1 more cooperator
      var I = R*H;
      var groups = models.groupBy(function (model) { return model.get("choice") === "D" ? "defect" : "cooperate"; });
      var numCooperators = (groups.cooperate === undefined) ? 0 : groups.cooperate.length;
      var numDefectors = (groups.defect === undefined) ? 0 : groups.defect.length;

      var cooperatorPayoff = Math.round(numCooperators * H);
      var defectorPayoff = Math.round((numCooperators + 1) * H + I);
      var totalPayoff = cooperatorPayoff * numCooperators + defectorPayoff * numDefectors;
      var maxPayoff = Math.round((models.length * H) * models.length); // everyone cooperates

      models.each(function (model) {
        var choice = model.get("choice");
        if (choice === "C") {
          model.set("score", cooperatorPayoff);
        } else {
          model.set("score", defectorPayoff);
        }
      }, this);

      this.payoff = {
        cooperatorPayoff: cooperatorPayoff,
        numCooperators: numCooperators,
        defectorPayoff: defectorPayoff,
        numDefectors: numDefectors,
        totalPayoff: totalPayoff,
        maxPayoff: maxPayoff
      };
    },

    setViewOptions: function () {
      Common.States.Results.prototype.setViewOptions.call(this);
      this.options.viewOptions.payoff = this.payoff;
    },

    logResults: function () {
      var results = this.collection.map(function (model) {
        return {
          alias: model.get("alias"),
          choice: model.get("choice"),
          score: model.get("score"),
        };
      });
      this.log("apps/npd/results", { results: results, payoff: this.payoff });
    },
  });

  return NPrisonersDilemma;
});