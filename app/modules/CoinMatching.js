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
    pointsPerRound: 1,
    roundsPerPhase: 2,
    group1Name: "Team 1",
    group2Name: "Team 2",
  };

  CoinMatching.Instructions = Common.Models.Instructions.extend({
    buttonConfig: {
      "A": { description: "Human - Heads" },
      "B": { description: "Human - Tails" },
      "C": { description: "Computer - Heads" },
      "D": { description: "Computer - Tails" },
    }
  });

  CoinMatching.Util = {}
  CoinMatching.Util.labelChoice = function (choice) {
    if (choice === "A" || choice === "C") {
      return "H";
    } else if (choice === "B" || choice === "D") {
      return "T";
    }
    return "#";
  }

  CoinMatching.Views.Configure = Common.Views.ModelConfigure.Layout.extend({
    modelOptions: _.extend({}, CoinMatching.config)
  });

  CoinMatching.Views.Play = {};

  CoinMatching.Views.Play.Participant = Common.Views.ParticipantHiddenPlay

  CoinMatching.Views.Play.Layout = app.registerView("coin-matching::play", Common.Mixins.mixin(["gameOver", "rounds"], Common.Views.GroupLayout.extend({
    header: "Play",
    ParticipantView: CoinMatching.Views.Play.Participant,
    InstructionsModel: CoinMatching.Instructions
  })));

  CoinMatching.Views.Results = {};



  CoinMatching.Views.Results.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantDisplay.extend({
    locked: true,

    mainText: function (model) {
      var choice = CoinMatching.Util.labelChoice(model.get("choice")),
          partnerChoice = CoinMatching.Util.labelChoice(model.get("partner").get("choice"));

      var outcome;
      if (model.get("role") === "row") {
        outcome = choice+partnerChoice;
      } else {
        outcome = partnerChoice+choice;
      }
      return outcome + " "+model.get("score");
    },
    bottomText: function (model) {
      return "Total " + model.get("phaseTotal");
    }
  }));

  CoinMatching.Views.Results.Layout = app.registerView("coin-matching::results", Common.Mixins.mixin(["gameOver", "rounds"], Common.Views.GroupLayout.extend({
    header: "Results",
    className: "coin-matching-results",
    ParticipantView: CoinMatching.Views.Results.Score,
  })));


  CoinMatching.Views.PhaseResults = {};

  CoinMatching.Views.PhaseResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantDisplay.extend({
    locked: true,

    mainText: function (model) {
      return model.get("phaseTotal");
    },
  }));

  CoinMatching.Views.PhaseResults.Layout = app.registerView("coin-matching::phase-results", Common.Views.GroupLayout.extend({
    header: "Results for Phase ",
    className: "coin-matching-results",
    ParticipantView: CoinMatching.Views.PhaseResults.Score,
  }));


  CoinMatching.Views.TotalResults = {};

  CoinMatching.Views.TotalResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantDisplay.extend({
    locked: true,

    mainText: function (model) {
      return model.get("total");
    },
  }));

  CoinMatching.Views.TotalResults.Layout = app.registerView("coin-matching::total-results", Common.Views.GroupLayout.extend({
    header: "Total Results",
    className: "coin-matching-results",
    ParticipantView: CoinMatching.Views.TotalResults.Score,
  }));


  // To be used in StateApps
  CoinMatching.States = {};

  CoinMatching.States.Play = Common.States.GroupPlay.extend({
    view: "coin-matching::play",
    defaultChoice: null,
    validChoices: ["A", "B", "C", "D"],
    onEntry: function (input, prevState) {
      if (prevState) {
        if (prevState.name === "attendance") {
          input.each(function (participant) {
            participant.set("total", 0);
            participant.set("phaseTotal", 0);
          });
        } else if (prevState instanceof CoinMatching.States.PhaseResults
          || prevState instanceof CoinMatching.States.TotalResults) {
          input.get("participants").each(function (participant) {
            participant.set("total", 0);
            participant.set("phaseTotal", 0);
          });
        }
      }
    },

    processBeforeRender: function () {
      this.groupModel.get("group1").each(function (participant) {
        participant.set("role", "row");
        participant.get("partner").set("role", "col");
      });
    },

    assignScoreGroup2: function () { }, // do nothing (handled in group1)
    // group 1 is row, group2 is col
    assignScoreGroup1: function (participant) {
      var partner = participant.get("partner");
      var choice = participant.get("choice"), partnerChoice = partner.get("choice");
      var pairChoice = choice + partnerChoice;
      var score = 0, partnerScore = 0;
      var rowWin = [ "AA", "BB", "CC", "DD", "AC", "CA", "BD", "DB" ];
      var colWin = [ "AB", "BA", "CD", "DC", "AD", "DA", "CB", "BC" ];

      if (_.contains(rowWin, pairChoice) || (choice != null && partnerChoice == null)) {
        score = this.config.pointsPerRound;
      } else if (_.contains(colWin, pairChoice) || (choice == null && partnerChoice != null)) {
        partnerScore = this.config.pointsPerRound;
      }

      participant.set("score", score);
      partner.set("score", partnerScore);
    },

    processOutput: function () {
            console.log("ROUND OUTPUTS", this.options.roundOutputs);
      this.groupModel.get("participants").each(function (participant, i) {
        // sum up total scores from rounds in this phase
        var phaseTotal = _.reduce(this.options.roundOutputs, function (memo, roundOutput) {
          return roundOutput[i].score + memo;
        }, 0) + participant.get("score");

        participant.set("phaseTotal", phaseTotal);
      }, this);
    }
  });

  CoinMatching.States.Results = Common.States.GroupResults.extend({
    view: "coin-matching::results",
    bucketAttribute: "score",
    bucket: true,

    logResults: function () {
      // console.log("ROUND OUTPUTS",  this.options.roundOutputs);
      return; // TODO: logging

      var results = this.participants.map(function (model) {
        return {
          alias: model.get("alias"),
        };
      });

      this.log("apps/coin-matching/results", { results: results });
    },
  });


  CoinMatching.States.Round = StateApp.RoundState.extend({
    states: [ CoinMatching.States.Play, CoinMatching.States.Results ],
    numRounds: CoinMatching.config.roundsPerPhase,

    // what is saved between each round
    // output is a groupModel
    roundOutput: function (output) {
      return output.get("participants").map(function (participant) {
        return {
          alias: participant.get("alias"),
          choice: participant.get("choice"),
          score: participant.get("score"),
          partner: participant.get("partner"),
          total: participant.get("total")
        };
      });
    },

    getOutput: function () {
      // save the phase results
      // console.log("ROUND OUTPUT", this.roundOutputs);
      this.lastOutput.get("participants").each(function (participant) {
        participant.set(this.name + "Total", participant.get("phaseTotal"));
      }, this);
      return this.lastOutput;
    },

    handleConfigure: function () {
      this.currentState.render();
    }
  });


  CoinMatching.States.PhaseResults = Common.States.GroupResults.extend({
    view: "coin-matching::phase-results",
    bucketAttribute: "phaseTotal",
    bucket: true,
  });

  CoinMatching.States.TotalResults = Common.States.GroupResults.extend({
    view: "coin-matching::total-results",
    bucketAttribute: "total",
    bucket: true,
    processBeforeRender: function (participant) {
      this.groupModel.get("participants").each(function (participant) {
        participant.set("total", 0);
        for (var i = 0; i < this.options.numPhases; i++) {
          var phaseTotal = participant.get("phase" + (i + 1) + "Total");
          if (phaseTotal) {
            participant.set("total", participant.get("total") + phaseTotal);
          }
        }
      }, this);

    },

    beforePrev: function () {
      // unassign scores
      this.groupModel.get("participants").each(function (participant) {
        participant.set("total", 0);
      })
    }
  });

  return CoinMatching;
});