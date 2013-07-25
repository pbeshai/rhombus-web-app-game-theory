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
    group1Name: "Lab 1",
    group2Name: "Lab 2",
    round: 1,
    gameOver: true
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
  CoinMatching.States.Play = StateApp.defineState({
    defaults: {
      defaultChoice: "A" // choice made when a player does not play
    },

    // this.input is a participant collection.
    beforeRender: function () {
      // could receive input as participant collection or as a group model (if returning from receive play)
      if (this.input instanceof Common.Models.GroupModel) {
        this.groupModel = this.input;

        // reset played and choices
        this.groupModel.get("participants").each(function (participant) {
          participant.reset();
          if (participant.bot) {
            participant.delayedPlay();
          }
        });
      } else {
        // reset played and choices
        this.input.each(function (participant) {
          participant.reset();
        });

        this.groupModel = new Common.Models.GroupModel({ participants: this.input }, { forceEven: true });
      }

      if (this.input.length % 2 === 1) {
        this.input.addBot();
      }
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        model: this.groupModel,
        config: this.config,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name,
      };
    },

    // outputs a participant collection
    getOutput: function () {
      return this.groupModel;
    }
  });

  CoinMatching.States.Results = StateApp.defineState({
    view: CoinMatching.Views.Results.Layout,

    beforeRender: function () {
      // this.input is a GroupModel
      this.groupModel = this.input;

      //this.assignScores(this.collection);

      // TODO: log results
      //this.logResults(this.collection);
    },

    handleConfigure: function () {
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        model: this.groupModel,
        config: this.config,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name,
      };
    },

    assignScores: function (collection) {
      // for each receiver
      collection.each(function (participant) {

      }, this);
    },

    logResults: function (collection) {
      var results = collection.map(function (model) {
        return {
          alias: model.get("alias"),
          giverOffer: model.get("keep"),
          giverScore: model.get("giverScore"),
          giverPartner: model.get("giverPartner").get("alias"),
          receiverOffer: model.get("offer"),
          receiverScore: model.get("receiverScore"),
          receiverPartner: model.get("receiverPartner").get("alias")
        };
      });

      this.log("apps/coin-matching/results", { results: results });
    },

    getOutput: function () { }
  });

  return CoinMatching;
});