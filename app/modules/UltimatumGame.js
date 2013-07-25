/**

	A simple grid app for displaying choices

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

  var UltimatumGame = app.module();

  UltimatumGame.config = {
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

  UltimatumGame.Instructions = {};
  UltimatumGame.Instructions.GiverPlay = Common.Models.Instructions.extend({
    header: "Giver Instructions",
    configInit: function (config) {
      this.attributes.buttonConfig = {
        "A": { description: "Offer " + config.offerMap.A },
        "B": { description: "Offer " + config.offerMap.B },
        "C": { description: "Offer " + config.offerMap.C },
        "D": { description: "Offer " + config.offerMap.D },
        "E": { description: "Offer " + config.offerMap.E },
      }
    }
  });
  UltimatumGame.Instructions.ReceiverPlay = Common.Models.Instructions.extend({
    header: "Receiver Instructions",
    configInit: function (config) {
      var buttonConfig = this.attributes.buttonConfig = {};
      buttonConfig[config.acceptChoice] = { description: "Accept offer" };
      buttonConfig[config.rejectChoice] = { description: "Reject offer" };
    }
  });


  UltimatumGame.Views.Configure = Common.Views.ModelConfigure.Layout.extend({
    modelOptions: _.extend({}, UltimatumGame.config)
  });

  UltimatumGame.Views.GiverPlay = {};

  UltimatumGame.Views.GiverPlay.Giver = Common.Views.ParticipantHiddenPlay.extend({
  });

  UltimatumGame.Views.PreParticipants = Backbone.View.extend({
    template: "ultimatum/pre_participants",
    serialize: function () {
      return { total: this.options.config.amount }
    },
  })

  UltimatumGame.Views.GiverPlay.Layout = Common.Views.SimpleLayout.extend({
    overrides: {
      header: "Givers Play",
      PreParticipantsView: UltimatumGame.Views.PreParticipants,
      ParticipantView: UltimatumGame.Views.GiverPlay.Giver,
      InstructionsModel: UltimatumGame.Instructions.GiverPlay
    }
  });

  UltimatumGame.Views.ReceiverPlay = {};

  UltimatumGame.Views.ReceiverPlay.Receiver = Common.Views.ParticipantMessagePlay.extend({
    overrides: {
      messageAttribute: "offer"
    }
  });

  UltimatumGame.Views.ReceiverPlay.Layout = Common.Views.SimpleLayout.extend({
    overrides: {
      header: "Receivers Play",
      PreParticipantsView: UltimatumGame.Views.PreParticipants,
      ParticipantView: UltimatumGame.Views.ReceiverPlay.Receiver,
      InstructionsModel: UltimatumGame.Instructions.ReceiverPlay
    }
  });

  UltimatumGame.Views.Results = {};

  UltimatumGame.Views.Results.Score = Common.Views.ParticipantDisplay.extend({
    template: "ultimatum/score",
    serialize: function () {
      return {
        alias: this.model.get("alias"),
        giverOffer: this.model.get("keep"),
        giverScore: this.model.get("giverScore"),
        giverScoreClass: (this.model.get("giverScore") === 0) ? "rejected" : "accepted",
        receiverOffer: this.model.get("offer"),
        receiverScore: this.model.get("receiverScore"),
        receiverScoreClass: (this.model.get("receiverScore") === 0) ? "rejected" : "accepted"
      }
    }
  });

  UltimatumGame.Views.Results.Layout = Common.Views.SimpleLayout.extend({
    overrides: {
      header: "Results",
      className: "ultimatum-results",
      PreParticipantsView: UltimatumGame.Views.PreParticipants,
      ParticipantView: UltimatumGame.Views.Results.Score
    }
  });

  UltimatumGame.Util = {};
  UltimatumGame.Util.assignOffers = function (givers, amount, offerMap) {
    givers.each(function (giver) {
      var offer = offerMap[giver.get("choice")];
      var keep = amount - offer;
      giver.set("keep", keep); // amount kept
      giver.get("partner").set("offer", offerMap[giver.get("choice")]); // amount given away
      giver.set("complete", true);
    }, this);
  };

  // To be used in StateApps
  UltimatumGame.States = {};
  UltimatumGame.States.GiverPlay = StateApp.defineState(Common.States.Play, {
    view: UltimatumGame.Views.GiverPlay.Layout,
    pairModels: "asymmetric",

    // outputs a participant collection
    processOutput: function () {
      UltimatumGame.Util.assignOffers(this.collection,
        this.config.amount, this.config.offerMap);
    }
  });

  UltimatumGame.States.ReceiverPlay = StateApp.defineState(Common.States.Play, {
    view: UltimatumGame.Views.ReceiverPlay.Layout,
    pairModels: false,
    botCheck: false,

    initialize: function () {
      this.validChoices = [this.config.acceptChoice, this.config.rejectChoice];
    },

    handleConfigure: function () {
      UltimatumGame.Util.assignOffers(this.collection,
        this.config.amount, this.config.offerMap);
    }
  });

  UltimatumGame.States.Results = StateApp.defineState(Common.States.Results, {
    view: UltimatumGame.Views.Results.Layout,

    handleConfigure: function () {
      UltimatumGame.Util.assignOffers(this.collection,
        this.config.amount, this.config.offerMap);
    },

    assignScore: function (participant) {
      var receiver = participant;
      var giver = receiver.get("partner");
      if (receiver.get("choice") === this.config.acceptChoice) {
        receiver.set("receiverScore", receiver.get("offer"));
        giver.set("giverScore", giver.get("keep"));
      } else {
        receiver.set("receiverScore", 0);
        giver.set("giverScore", 0)
      }
    },

    logResults: function (collection) {
      var results = collection.map(function (model) {
        return {
          alias: model.get("alias"),
          giverOffer: model.get("keep"),
          giverScore: model.get("giverScore"),
          giverPartner: model.get("partner").get("alias"),
          receiverOffer: model.get("offer"),
          receiverScore: model.get("receiverScore"),
          receiverPartner: model.get("partnerBackward").get("alias")
        };
      });

      this.log("apps/ultimatum/results", { results: results });
    }
  });

  return UltimatumGame;
});