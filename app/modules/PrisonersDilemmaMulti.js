/**

	A simple grid app for displaying choices

*/
define([
  // Application.
  "app",

  "modules/PrisonersDilemma",
  "modules/Participant",

  "apps/StateApp",

  "util/d3/variableWidthBarChart",
  "util/d3/xLine"
],
function(app, PrisonersDilemma, Participant, StateApp, variableWidthBarChart, xLine) {

  var PrisonersDilemmaMulti = app.module();
  PrisonersDilemmaMulti.Views.Play = {};
  PrisonersDilemmaMulti.Views.Results = {};

  PrisonersDilemmaMulti.Views.Play.Participant = PrisonersDilemma.Views.Play.Participant.extend({
    template: "pdm/play/participant",

    beforeRender: function () {
      PrisonersDilemma.Views.Play.Participant.prototype.beforeRender.call(this);
      if (this.model.get("roundsLeft") === 0) {
        this.$el.addClass("complete");
      }
    }
  });


  PrisonersDilemmaMulti.Views.Play.Participants = PrisonersDilemma.Views.Play.Participants.extend({
    template: "pdm/play/layout",

    serialize: function () {
      return {
        hasPlayers: (this.collection.length > 0),
        round: this.options.round
      };
    },

    beforeRender: function () {
      this.collection.each(function (participant) {
        this.insertView(".participant-grid", new PrisonersDilemmaMulti.Views.Play.Participant({ model: participant }));
      }, this);
    },


    initialize: function () {
      app.participantServer.hookCollection(this.collection, this);

      this.listenTo(this.collection, {
        "reset": this.render
      });

      app.setTitle("Prisoners Dilemma Multiround");
    },
  });


  // To be used in StateApps
  PrisonersDilemmaMulti.States = {};
  PrisonersDilemmaMulti.States.Play = function (options) {
    this.options = _.defaults({}, options, this.defaults);

    this.initialize();
  }
  PrisonersDilemmaMulti.States.Play.prototype = new StateApp.State(PrisonersDilemmaMulti.Views.Play.Participants);
  _.extend(PrisonersDilemmaMulti.States.Play.prototype, {
    defaults: {
      defaultChoice: "C" // choice made when a player does not play
    },

    initialize: function () {
    },

    beforeRender: function () {
      // input is a PrisonersDilemma.Collection
      this.participants = this.input;

      this.options.viewOptions = { collection: this.participants, round: this.stateApp.round };
    },

    // outputs a PrisonersDilemma.Collection
    getOutput: function () {
      // set choice for those who haven't played and decrement roundsLeft
      this.participants.each(function (participant) {
        if (participant.get("choice") === undefined) {
          participant.set("choice", this.options.defaultChoice);
        }
        var roundsLeft = Math.max(0, participant.get("roundsLeft") - 1);
        participant.set("roundsLeft", roundsLeft);
        if (roundsLeft === 0) {
          participant.set("complete", true);
        }
      }, this);

      return this.participants;
    }
  });

  PrisonersDilemmaMulti.States.Results = function (options) {
    this.options = _.defaults({}, options, this.defaults);
    this.initialize();
  }
  PrisonersDilemmaMulti.States.Results.prototype = new StateApp.State(PrisonersDilemma.Views.Results.Layout);
  _.extend(PrisonersDilemmaMulti.States.Results.prototype, {
    defaults: {
      scoringMatrix: {
        CC: 3,
        CD: 0,
        DC: 5,
        DD: 1
      }
    },

    initialize: function () {
    },

    assignScores: function (models) {
      models.each(function (model) {
        var pairChoices = model.get("choice") + model.get("partner").get("choice");
        model.set({"score": this.options.scoringMatrix[pairChoices], "pairChoices": pairChoices});
      }, this);
    },

    beforeRender: function () {
      this.participants = this.input;

      // this.input is a PrisonersDilemma.Collection
      this.options.viewOptions = { collection: this.participants };

      // calculate the scores
      this.assignScores(this.participants);

      // TODO: log results?
      //this.logResults(this.participants);
    },

    logResults: function (models) {
      var results = models.map(function (model) {
        return {
          alias: model.get("alias"),
          choice: model.get("choice"),
          score: model.get("score"),
          partner: {
            alias: model.get("partner").get("alias"),
            choice: model.get("partner").get("choice"),
            score: model.get("partner").get("score"),
          }
        };
      });
      console.log("PD RESULTS = ", results);
      app.api({ call: "apps/pd/results", type: "post", data: { results: results } });
    },

    getOutput: function () {
      return this.participants;
    }
  })

  return PrisonersDilemmaMulti;
});