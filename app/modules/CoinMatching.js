/**

	Coin Matching for Peter Danielson's COGS 300 class

*/
define([
  // Application.
  "app",
  "modules/common/Common",

  "modules/Participant",

  "apps/StateApp",

  "util/d3/rickshaw/graphs"
],
function(app, Common, Participant, StateApp, Graphs) {

  var CoinMatching = app.module();

  CoinMatching.config = {
    pointsPerPlay: 1,
    playsPerRound: 10,
    group1Name: "Lab 1",
    group2Name: "Lab 2",
    round: 1
  };

  CoinMatching.Instructions = Common.Models.Instructions.extend({
    buttonConfig: {
      "A": { description: "Human - Heads" },
      "B": { description: "Human - Tails" },
      "C": { description: "Computer - Heads" },
      "D": { description: "Computer - Tails" },
    }
  });


  CoinMatching.Views.Configure = Common.Views.ModelConfigure.Layout.extend({
    modelOptions: _.extend({}, CoinMatching.config)
  });

  CoinMatching.Views.Play = {};

  CoinMatching.Views.Play.Participant = Common.Views.ParticipantHiddenPlay.extend({
  });

  CoinMatching.Views.Play.Layout = Common.Mixins.mixin(["gameOver", "rounds"], Common.Views.GroupLayout.extend({
    overrides: {
      header: "Play",
      ParticipantView: CoinMatching.Views.Play.Participant,
      InstructionsModel: CoinMatching.Instructions
    }
  }));

  CoinMatching.Views.Results = {};

  CoinMatching.Views.Results.Score = Common.Views.ParticipantDisplay.extend({
    overrides: {
      mainText: function (model) {
        return model.get("choice");
      }
    }
  });

  CoinMatching.Views.Results.Layout = Common.Views.GroupLayout.extend({
    overrides: {
      header: "Results",
      className: "coin-matching-results",
      ParticipantView: CoinMatching.Views.Results.Score
    }
  });


  // To be used in StateApps
  CoinMatching.States = {};
  // needs view,
  CoinMatching.States.Play = Common.States.GroupPlay.extend({
    view: CoinMatching.Views.Play.Layout,
    defaultChoice: null,
  });

  CoinMatching.States.Results = Common.States.GroupResults.extend({
    view: CoinMatching.Views.Results.Layout,

    handleConfigure: function () {
    },

    logResults: function () {
      return; // TODO: logging

      var results = this.collection.map(function (model) {
        return {
          alias: model.get("alias"),
        };
      });

      this.log("apps/coin-matching/results", { results: results });
    },

    getOutput: function () { }
  });

  return CoinMatching;
});