/**

	The ultimatum game with partitioned roles
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
  };

  UltimatumGamePartitioned.Views.Configure = Common.Views.ModelConfigure.Layout.extend({
    modelOptions: _.extend({}, UltimatumGamePartitioned.config)
  });

  UltimatumGamePartitioned.Views.GiverPlay = {};

  UltimatumGamePartitioned.Views.GiverPlay.Giver = Common.Views.ParticipantHiddenPlay;
  UltimatumGamePartitioned.Views.GiverPlay.Receiver = Common.Views.ParticipantHiddenPlay.extend({
    locked: true
  });

  UltimatumGamePartitioned.Views.PreGroups = Backbone.View.extend({
    template: "ultimatum/pre_participants",
    serialize: function () {
      return { total: this.options.config.amount }
    },
  })

  UltimatumGamePartitioned.Views.GiverPlay.Layout = app.registerView("ugp::giver-play", Common.Views.GroupLayout.extend({
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
  }));

  UltimatumGamePartitioned.Views.ReceiverPlay = {};

  UltimatumGamePartitioned.Views.ReceiverPlay.Giver = Common.Views.ParticipantHiddenPlay.extend({
    locked: true
  });

  UltimatumGamePartitioned.Views.ReceiverPlay.Receiver = Common.Views.ParticipantMessagePlay.extend({
    messageAttribute: "offer"
  });

  UltimatumGamePartitioned.Views.ReceiverPlay.Layout = app.registerView("ugp::receiver-play", Common.Views.GroupLayout.extend({
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
  }));

  UltimatumGamePartitioned.Views.Results = {};


  UltimatumGamePartitioned.Views.Results.Score = Common.Views.ParticipantDisplay.extend({
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
  });

  UltimatumGamePartitioned.Views.Results.Layout = app.registerView("ugp::results", Common.Views.GroupLayout.extend({
    header: "Results",
    PreGroupsView: UltimatumGamePartitioned.Views.PreGroups,
    ParticipantView: UltimatumGamePartitioned.Views.Results.Score
  }));

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
  UltimatumGamePartitioned.States.GiverPlay = Common.States.GroupPlay.extend({
    name: "giver-play",
    view: "ugp::giver-play",

    handleConfigure: function () {
      this.render();
    },
    // do not modify group2
    prepareOutputGroup2: function () { },

    onExit: function () {
      // assign offers
      var result = Common.States.GroupPlay.prototype.onExit.call(this);

      UltimatumGamePartitioned.Util.assignOffers(this.groupModel.get("group1"),
        this.config.amount, this.config.offerMap);

      return result;
    }
  });

  UltimatumGamePartitioned.States.ReceiverPlay = Common.States.GroupPlay.extend({
    name: "receiver-play",
    view: "ugp::receiver-play",
    validChoices: ["A", "B"],
    handleConfigure: function () {
      this.render();
    },

    handleConfigure: function () {
      UltimatumGamePartitioned.Util.assignOffers(this.groupModel.get("group1"),
        this.config.amount, this.config.offerMap);
    },

    // do not reset or prepare group1, but prepare group2 as normal
    beforeRenderGroup1: function () { },

    // do not modify group 1
    prepareOutputGroup1: function () { },

    // set complete to true on group2 participants
    prepareParticipantOutputGroup2: function (participant) {
      this.prepareParticipantOutput(participant);
      participant.set("complete", true);
    },
  });

  UltimatumGamePartitioned.States.Score = Common.States.GroupScore.extend({
    assignScoresGroup1: function () { },

    // assign score by iterating over receivers with this function
    assignScoreGroup2: function (receiver) {
      var giver = receiver.get("partner");
      if (receiver.get("choice") === "A") {
        receiver.set("score", receiver.get("offer"));
        giver.set("score", giver.get("keep"));
      } else {
        receiver.set("score", 0);
        giver.set("score", 0)
      }
      console.log("set score to ", receiver.get("score"));
    },
  });


  UltimatumGamePartitioned.States.Results = Common.States.GroupResults.extend({
    view: "ugp::results",

    handleConfigure: function () {
      UltimatumGamePartitioned.Util.assignOffers(this.groupModel.get("group1"),
        this.config.amount, this.config.offerMap);
    },

    logResults: function () {
      var results = {};
      results.givers = this.groupModel.get("group1").map(function (giver) {
        return {
          alias: giver.get("alias"),
          keep: giver.get("keep"),
          score: giver.get("score"),
          partner: giver.get("partner").get("alias")
        };
      });

      results.receivers = this.groupModel.get("group2").map(function (receiver) {
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