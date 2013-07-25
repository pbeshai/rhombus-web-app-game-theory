/**

	A simple grid app for displaying choices

*/
define([
  // Application.
  "app",
  "modules/common/Common",

  "modules/Participant",
  "modules/UltimatumGame",

  "apps/StateApp",

  "util/d3/rickshaw/graphs"
],
function(app, Common, Participant, UltimatumGame, StateApp, Graphs) {

  var UltimatumGamePartitioned = app.module();

  UltimatumGamePartitioned.config = {
    amount: 10,
    offerMap: { // map of choices givers make to amounts offered
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    group1Name: "Givers",
    group2Name: "Receivers",
    acceptChoice: "A", // choice a receiver makes to accept
    rejectChoice: "B", // choice a receiver makes to reject
  };



  UltimatumGamePartitioned.Views.Configure = Common.Views.ModelConfigure.Layout.extend({
    modelOptions: _.extend({}, UltimatumGamePartitioned.config)
  });

  UltimatumGamePartitioned.Views.GiverPlay = {};

  UltimatumGamePartitioned.Views.GiverPlay.Giver = Common.Views.ParticipantHiddenPlay.extend({
  });

  UltimatumGamePartitioned.Views.GiverPlay.Receiver = Common.Views.ParticipantHiddenPlay.extend({
    overrides: {
      locked: true
    }
  });

  UltimatumGamePartitioned.Views.PreGroups = Backbone.View.extend({
    template: "ultimatum/pre_participants",
    serialize: function () {
      return { total: this.options.config.amount }
    },
  })

  UltimatumGamePartitioned.Views.GiverPlay.Layout = Common.Views.GroupLayout.extend({
    overrides: {
      header: "Givers Play",
      inactive: {
        group2: true
      },
      PreGroupsView: UltimatumGamePartitioned.Views.PreGroups,
      ParticipantView: {
        group1: UltimatumGamePartitioned.Views.GiverPlay.Giver,
        group2: UltimatumGamePartitioned.Views.GiverPlay.Receiver
      },
      InstructionsModel: UltimatumGame.Instructions.GiverPlay
    }
  });

  UltimatumGamePartitioned.Views.ReceiverPlay = {};

  UltimatumGamePartitioned.Views.ReceiverPlay.Giver = Common.Views.ParticipantHiddenPlay.extend({
    overrides: {
      locked: true
    }
  });

  UltimatumGamePartitioned.Views.ReceiverPlay.Receiver = Common.Views.ParticipantMessagePlay.extend({
    overrides: {
      messageAttribute: "offer"
    }
  });

  UltimatumGamePartitioned.Views.ReceiverPlay.Layout = Common.Views.GroupLayout.extend({
    overrides: {
      header: "Receivers Play",
      inactive: {
        group1: true
      },
      PreGroupsView: UltimatumGamePartitioned.Views.PreGroups,
      ParticipantView: {
        group1: UltimatumGamePartitioned.Views.ReceiverPlay.Giver,
        group2: UltimatumGamePartitioned.Views.ReceiverPlay.Receiver
      },
      InstructionsModel: UltimatumGame.Instructions.ReceiverPlay
    }
  });

  UltimatumGamePartitioned.Views.Results = {};


  UltimatumGamePartitioned.Views.Results.Score = Common.Views.ParticipantDisplay.extend({
    overrides: {
      cssClass: function (model) {
        if (model.get("score") === 0) {
          return "rejected";
        } else {
          return "accepted";
        }
      },
      bottomText: function (model) {
        if (model.get("score") === 0) {
          return "Rejected";
        } else {
          return "Accepted";
        }
      },
      mainText: function (model) {
        if (model.get("score") !== 0) {
          return model.get("score");
        }
        // show the original offer if rejected
        if (model.get("offer")) {
          return model.get("offer") + " &rarr; " + model.get("score");
        }
        return model.get("keep") + " &rarr; " + model.get("score");
      }
    }
  });

  UltimatumGamePartitioned.Views.Results.Layout = Common.Views.GroupLayout.extend({
    overrides: {
      header: "Results",
      PreGroupsView: UltimatumGamePartitioned.Views.PreGroups,
      ParticipantView: UltimatumGamePartitioned.Views.Results.Score
    }
  });

  UltimatumGamePartitioned.Util = {};
  UltimatumGamePartitioned.Util.assignOffers = function (givers, amount, offerMap) {
    givers.each(function (giver) {
      var offer = offerMap[giver.get("choice")];
      var keep = amount - offer;
      giver.set("keep", keep); // amount kept
      giver.get("partner").set("offer", offerMap[giver.get("choice")]); // amount given away
      giver.set("complete", true);
    }, this);
  };


  // To be used in StateApps
  UltimatumGamePartitioned.States = {};
  UltimatumGamePartitioned.States.GiverPlay = StateApp.defineState(Common.States.GroupPlay, {
    view: UltimatumGamePartitioned.Views.GiverPlay.Layout,

    // outputs a GroupModel
    getOutput: function () {
      // if you haven't played, then you played "A".
      this.groupModel.get("group1").each(function (participant) {
        if (participant.get("choice") === undefined) {
          participant.set("choice", this.options.defaultChoice);
        }
      }, this);

      UltimatumGamePartitioned.Util.assignOffers(this.groupModel.get("group1"),
        this.config.amount, this.config.offerMap);

      return this.groupModel;
    }
  });

  UltimatumGamePartitioned.States.ReceiverPlay = StateApp.defineState(Common.States.GroupPlay, {
    view: UltimatumGamePartitioned.Views.ReceiverPlay.Layout,

    initialize: function () {
      this.validChoices = [this.config.acceptChoice, this.config.rejectChoice];
    },

    handleConfigure: function () {
      UltimatumGamePartitioned.Util.assignOffers(this.groupModel.get("group1"),
        this.config.amount, this.config.offerMap);
    },

    // this.input is a groupModel
    beforeRender: function () {
      // reset played and choices
      this.groupModel = this.input;

      // only reset group2
      this.groupModel.get("group2").each(function (participant) {
        participant.reset();
        participant.set("validChoices", this.validChoices);
        if (participant.bot) {
          participant.delayedPlay();
        }
      });
    },

    // outputs a groupModel
    getOutput: function () {
      // if you haven't played, then you played "A".
      this.groupModel.get("group2").each(function (participant) {
        if (participant.get("choice") === undefined) {
          participant.set("choice", this.options.defaultChoice);
        }
        participant.set("complete", true);
      }, this);

      return this.groupModel;
    }
  });


  UltimatumGamePartitioned.States.Results = StateApp.defineState(Common.States.GroupResults, {
    view: UltimatumGamePartitioned.Views.Results.Layout,

    handleConfigure: function () {
      UltimatumGamePartitioned.Util.assignOffers(this.groupModel.get("group1"),
        this.config.amount, this.config.offerMap);
    },

    assignScores: function (groupModel) {
      // for each receiver
      groupModel.get("group2").each(function (receiver) {
        var giver = receiver.get("partner");
        if (receiver.get("choice") === this.config.acceptChoice) {
          receiver.set("score", receiver.get("offer"));
          giver.set("score", giver.get("keep"));
        } else {
          receiver.set("score", 0);
          giver.set("score", 0)
        }
      }, this);
    },

    logResults: function (groupModel) {
      var results = {};
      results.givers = groupModel.get("group1").map(function (giver) {
        return {
          alias: giver.get("alias"),
          keep: giver.get("keep"),
          score: giver.get("score"),
          partner: giver.get("partner").get("alias")
        };
      });

      results.receivers = groupModel.get("group2").map(function (receiver) {
        return {
          alias: receiver.get("alias"),
          offer: receiver.get("offer"),
          score: receiver.get("score"),
          partner: receiver.get("partner").get("alias")
        };
      });

      this.log( "apps/ultimatum-partition/results", { results: results });
    },
  });

  return UltimatumGamePartitioned;
});