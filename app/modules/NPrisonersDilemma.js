/**

	A simple grid app for displaying choices

*/
define([
  // Application.
  "app",

  "modules/PrisonersDilemma",
  "modules/Participant",

  "apps/StateApp",
],
function(app, PrisonersDilemma, Participant, StateApp) {

  var NPrisonersDilemma = app.module();
  NPrisonersDilemma.Views.Results = {};

  NPrisonersDilemma.Views.Results.Participant = PrisonersDilemma.Views.Results.Participant.extend({
    template: "npd/results/participant",

    beforeRender: function () {
      var choice = this.model.get("choice");
      this.$el.addClass("choice-" + choice);
    },
  });

  NPrisonersDilemma.Views.Results.Participants = PrisonersDilemma.Views.Results.Participants.extend({
    beforeRender: function () {
      this.collection.each(function (participant) {
        this.insertView(new NPrisonersDilemma.Views.Results.Participant({ model: participant }));
      }, this);
    },
  });

  NPrisonersDilemma.Views.Results.Layout = PrisonersDilemma.Views.Results.Layout.extend({
    template: "npd/results/results",

    serialize: function () {
      var superSerialize = PrisonersDilemma.Views.Results.Layout.prototype.serialize.call(this);
      return _.extend(superSerialize, {
        payoff: this.options.payoff
      });
    },

    beforeRender: function () {
      console.log("view options!!", this.options);
      if (this.collection.length) {
        this.setViews({
          ".results-participants": new NPrisonersDilemma.Views.Results.Participants({ collection: this.collection }),
          ".results-stats": new PrisonersDilemma.Views.Results.Stats({ collection: this.collection })
        });
      }
    },
  });


  // To be used in StateApps
  NPrisonersDilemma.States = {};
  NPrisonersDilemma.States.Play = function (options) {
    this.options = _.defaults({}, options, this.defaults);

    this.initialize();
  }
  NPrisonersDilemma.States.Play.prototype = new StateApp.State(PrisonersDilemma.Views.Play.Participants);
  _.extend(NPrisonersDilemma.States.Play.prototype, {
    defaults: {
      defaultChoice: "C" // choice made when a player does not play
    },

    initialize: function () {
      this.config = this.options.config;
    },

    beforeRender: function () {
      // create PD Participants from these Participant Models
      var pdParticipants = this.input.map(function (participant) {
        return new PrisonersDilemma.Model({ alias: participant.get("alias") });
      });
      // ensure we have even number of participants by adding a bot
      if (pdParticipants.length % 2 === 1) {
        pdParticipants.push(new PrisonersDilemma.Bot());
      }

      this.participants = new PrisonersDilemma.Collection(pdParticipants);

      this.options.viewOptions = { collection: this.participants };
    },

    // outputs a PrisonersDilemma.Collection
    getOutput: function () {
      // set choice for those who haven't played
      this.participants.each(function (participant) {
        if (participant.get("choice") === undefined) {
          participant.set("choice", this.options.defaultChoice);
        }
      }, this);

      return this.participants;
    }
  });

  NPrisonersDilemma.States.Results = function (options) {
    this.options = _.defaults({}, options);
    this.initialize();
  }
  NPrisonersDilemma.States.Results.prototype = new StateApp.State(NPrisonersDilemma.Views.Results.Layout);
  _.extend(NPrisonersDilemma.States.Results.prototype, {
    initialize: function () {
      this.config = this.options.config;
      console.log("RESULTS CONFIG", this.config);
    },

    assignScores: function (models) {
      // See Goehring and Kahan (1976) The Uniform N-Person Prisoner's Dilemma Game : Construction and Test of an Index of Cooperation

      var R = this.config.payoff.Rratio*models.length; // 0 < R < N-1, closer to 1 means more incentive for cooperation
      var H = this.config.payoff.H; // score increment when gaining 1 more cooperator
      var I = R*H;
      var groups = this.participants.groupBy(function (model) { return model.get("choice") === "D" ? "defect" : "cooperate"; });
      var numCooperators = (groups.cooperate === undefined) ? 0 : groups.cooperate.length;
      var numDefectors = (groups.defect === undefined) ? 0 : groups.defect.length;

      var cooperatorPayoff = numCooperators * H;
      var defectorPayoff = (numCooperators + 1) * H + I;
      var totalPayoff = cooperatorPayoff * numCooperators + defectorPayoff * numDefectors;
      var maxPayoff = (models.length * H) * models.length; // everyone cooperates

      models.each(function (model) {
        var choice = model.get("choice");
        if (choice === "C") {
          model.set("score", cooperatorPayoff);
        } else {
          model.set("score", defectorPayoff);
        }
      }, this);

      return {
        cooperatorPayoff: cooperatorPayoff,
        numCooperators: numCooperators,
        defectorPayoff: defectorPayoff,
        numDefectors: numDefectors,
        totalPayoff: totalPayoff,
        maxPayoff: maxPayoff
      }
    },

    beforeRender: function () {
      // this.input is a PrisonersDilemma.Collection
      this.participants = this.input;

      // calculate the scores
      var payoff = this.assignScores(this.participants);

      this.options.viewOptions = { collection: this.participants, payoff: payoff };

      // TODO: log results
      this.logResults(this.participants, payoff);
    },

    logResults: function (models, payoff) {
      var results = models.map(function (model) {
        return {
          alias: model.get("alias"),
          choice: model.get("choice"),
          score: model.get("score"),
        };
      });
      console.log("NPD RESULTS = ", results);
      var logData = {
        results: results,
        payoff: payoff,
        config: this.config,
        version: this.stateApp.version
      };

      app.api({ call: "apps/npd/results", type: "post", data: logData });
    },

    getOutput: function () { }
  })

  return NPrisonersDilemma;
});