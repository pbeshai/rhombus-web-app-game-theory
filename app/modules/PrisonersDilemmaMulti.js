/**

	Multiround prisoner's dilemma

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

  var PrisonersDilemmaMulti = app.module();
  PrisonersDilemmaMulti.config = {
    scoringMatrix: {
      CC: 3,
      CD: 0,
      DC: 5,
      DD: 1
    },
    minRounds: 1,
    maxRounds: 2,
  };

  PrisonersDilemmaMulti.Views.Play = {};

  PrisonersDilemmaMulti.Views.Play.Layout = app.registerView("pdm::play", Common.Mixins.rounds(Common.Views.SimpleLayout.extend({
    header: "Play",
    ParticipantView: PrisonersDilemma.Views.Play.Participant,
    InstructionsModel: PrisonersDilemmaMulti.Instructions
    /* graph
    if (this.options.round > 1) {
        this.setView(".results-stats", new PrisonersDilemma.Views.Results.Stats({ collection: this.collection }));
      }
      */
  })));

  PrisonersDilemmaMulti.Views.Configure = Common.Views.ModelConfigure.Layout.extend({
    modelOptions: _.extend({}, PrisonersDilemmaMulti.config)
  });

  PrisonersDilemmaMulti.Views.Results = {};
  // TODO: add rounds and game over
  PrisonersDilemmaMulti.Views.Results.Layout =  app.registerView("pdm::results", Common.Mixins.mixin(["gameOver", "rounds"],
    PrisonersDilemma.Views.Results.Layout));

  // To be used in StateApps
  PrisonersDilemmaMulti.States = {};
  PrisonersDilemmaMulti.States.Play = Common.States.Play.extend({
    view: "pdm::play",
    defaultChoice: "C", // choice made when a player does not play
    validChoices: ["C", "D"],
  });

  PrisonersDilemmaMulti.States.Score = Common.States.Score.extend({
    assignScore: function (participant) {
      var pairChoices = participant.get("choice") + participant.get("partner").get("choice");
      var data = { "score": this.config.scoringMatrix[pairChoices], "pairChoices": pairChoices };
      participant.set(data);

      // store the score in the participant's history
      var history = participant.get("history");
      data.round = this.config.round;

      if (history == null) {
        participant.set("history", [ data ]);
      } else {
        // if we do not already have data for this round, add it:
        var roundData = _.find(history, function (item) { return item.round === data.round });
        if (roundData === undefined) {
          history.push(data);
        }
      }
    },
  });

  PrisonersDilemmaMulti.States.Results = Common.States.Results.extend({
    view: "pdm::results",
    beforeRender: function () {
      Common.States.Results.prototype.beforeRender.call(this);

      this.config.gameOver = (this.config.round === 3);
    },
    logResults: function () {
      return; // TODO: log results
      var results = this.collection.map(function (model) {
        return {
          alias: model.get("alias"),
          choice: model.get("choice"),
          score: model.get("score"),
          partner: {
            alias: model.get("partner").get("alias"),
            choice: model.get("partner").get("choice"),
            score: model.get("partner").get("score"),
          },
          history: model.get("history")
        };
      });

      this.log("apps/pdm/results", { results: results, round: this.stateApp.round });
    },
  })

  PrisonersDilemmaMulti.States.Round = StateApp.RoundState.extend({
    name: "round",
    States: [ PrisonersDilemmaMulti.States.Play, PrisonersDilemmaMulti.States.Score, PrisonersDilemmaMulti.States.Results ],
    numRounds: 3 // TODO variable num rounds
  });

  return PrisonersDilemmaMulti;
});