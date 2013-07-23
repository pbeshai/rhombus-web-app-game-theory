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
  UltimatumGame.States.GiverPlay = function (options) {
    this.options = _.defaults({}, options, this.defaults);

    this.initialize();
  }
  UltimatumGame.States.GiverPlay.prototype = new StateApp.State(UltimatumGame.Views.GiverPlay.Layout);
  _.extend(UltimatumGame.States.GiverPlay.prototype, {
    defaults: {
      defaultChoice: "A" // choice made when a player does not play
    },

    initialize: function () {
      this.config = this.options.config;
    },

    // this.input is a participant collection.
    beforeRender: function () {
      // reset played and choices
      this.input.each(function (participant) {
        participant.reset();
      });

      if (this.input.length % 2 === 1) {
        this.input.addBot();
      }
      // re-partners each render
      this.input.pairModels();

      this.collection = this.input;
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        collection: this.collection,
        config: this.config
      };
    },

    // outputs a participant collection
    getOutput: function () {
      // if you haven't played, then you played "A".
      this.collection.each(function (participant) {
        if (participant.get("choice") === undefined) {
          participant.set("choice", this.options.defaultChoice);
        }
      }, this);

      UltimatumGame.Util.assignOffers(this.collection,
        this.config.amount, this.config.offerMap);

      return this.collection;
    }
  });

  UltimatumGame.States.ReceiverPlay = function (options) {
    this.options = _.defaults({}, options, this.defaults);

    this.initialize();
  }
  UltimatumGame.States.ReceiverPlay.prototype = new StateApp.State(UltimatumGame.Views.ReceiverPlay.Layout);
  _.extend(UltimatumGame.States.ReceiverPlay.prototype, {
    defaults: {
      defaultChoice: "A", // choice made when a player does not play
    },

    initialize: function () {
      this.config = this.options.config;
    },

    handleConfigure: function () {
      UltimatumGame.Util.assignOffers(this.groupModel.get("group1"),
        this.config.amount, this.config.offerMap);
    },

    // this.input is a groupModel
    beforeRender: function () {
      // reset played and choices
      this.collection = this.input;
      var validChoices = [this.config.acceptChoice, this.config.rejectChoice];

      this.collection.each(function (participant) {
        participant.reset();
        participant.set("validChoices", validChoices);
      });
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        collection: this.collection,
        config: this.config
      };
    },

    // outputs a groupModel
    getOutput: function () {
      // if you haven't played, then you played "A".
      this.collection.each(function (participant) {
        if (participant.get("choice") === undefined) {
          participant.set("choice", this.options.defaultChoice);
        }
        participant.set("complete", true);
      }, this);

      return this.collection;
    }
  });


  UltimatumGame.States.Results = function (options) {
    this.options = _.defaults({}, options);
    this.initialize();
  }
  UltimatumGame.States.Results.prototype = new StateApp.State(UltimatumGame.Views.Results.Layout);
  _.extend(UltimatumGame.States.Results.prototype, {
    initialize: function () {
      this.config = this.options.config;
    },
    beforeRender: function () {
      // this.input is a participant collection
      this.collection = this.input;
      this.options.viewOptions = { model: this.groupModel };

      this.assignScores(this.groupModel);

      // TODO log
      //this.logResults(this.groupModel);
    },

    handleConfigure: function () {
      UltimatumGame.Util.assignOffers(this.collection,
        this.config.amount, this.config.offerMap);
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        collection: this.collection,
        config: this.config
      };
    },

    assignScores: function (groupModel) {
      // for each receiver
      this.collection.each(function (receiver) {
        var giver = receiver.get("partner");
        if (receiver.get("choice") === this.config.acceptChoice) {
          receiver.set("receiverScore", receiver.get("offer"));
          giver.set("giverScore", giver.get("keep"));
        } else {
          receiver.set("receiverScore", 0);
          giver.set("giverScore", 0)
        }
      }, this);
    },

    logResults: function (groupModel) {
      // TODO: log

      var logData = {
        config: this.config,
        version: this.stateApp.version
      };
      console.log("ULTIMATUM RESULTS = ", logData);
      app.api({ call: "apps/ultimatum/results", type: "post", data: logData });
    },

    getOutput: function () { }
  });

  return UltimatumGame;
});