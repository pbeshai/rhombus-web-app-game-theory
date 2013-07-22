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

  UltimatumGamePartitioned.Views.GiverPlay.Layout = Common.Views.GroupLayout.extend({
    overrides: {
      header: "Givers Play",
      inactive: {
        group2: true
      },

      ParticipantView: {
        group1: UltimatumGamePartitioned.Views.GiverPlay.Giver,
        group2: UltimatumGamePartitioned.Views.GiverPlay.Receiver
      }
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

      ParticipantView: {
        group1: UltimatumGamePartitioned.Views.ReceiverPlay.Giver,
        group2: UltimatumGamePartitioned.Views.ReceiverPlay.Receiver
      }
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
        return model.get("score");
      }
    }
  });

  UltimatumGamePartitioned.Views.Results.Layout = Common.Views.GroupLayout.extend({
    overrides: {
      header: "Results",
      ParticipantView: UltimatumGamePartitioned.Views.Results.Score
    }
  });

  // To be used in StateApps
  UltimatumGamePartitioned.States = {};
  UltimatumGamePartitioned.States.GiverPlay = function (options) {
    this.options = _.defaults({}, options, this.defaults);

    this.initialize();
  }
  UltimatumGamePartitioned.States.GiverPlay.prototype = new StateApp.State(UltimatumGamePartitioned.Views.GiverPlay.Layout);
  _.extend(UltimatumGamePartitioned.States.GiverPlay.prototype, {
    defaults: {
      defaultChoice: "A" // choice made when a player does not play
    },

    initialize: function () {
      this.config = this.options.config;
    },

    beforeRender: function () {
      // could receive input as participant collection or as a group model (if returning from receive play)
      if (this.input instanceof Common.Models.GroupModel) {
        this.groupModel = this.input;

        // reset played and choices
        this.groupModel.get("participants").each(function (participant) {
          participant.reset();
        });
      } else {
        // reset played and choices
        this.input.each(function (participant) {
          participant.reset();
        });

        this.groupModel = new Common.Models.GroupModel({ participants: this.input }, { forceEven: true });
      }

      this.options.viewOptions = { model: this.groupModel };
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        model: this.groupModel,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name
      };
    },

    // outputs a GroupModel
    getOutput: function () {
      // if you haven't played, then you played "A".
      this.groupModel.get("group1").each(function (participant) {
        if (participant.get("choice") === undefined) {
          participant.set("choice", this.options.defaultChoice);
        }
        var offer = this.config.offerMap[participant.get("choice")];
        var keep = this.config.amount - offer;
        participant.set("keep", keep); // amount kept
        participant.get("partner").set("offer", this.config.offerMap[participant.get("choice")]); // amount given away
        participant.set("complete", true);
      }, this);

      return this.groupModel;
    }
  });

  UltimatumGamePartitioned.States.ReceiverPlay = function (options) {
    this.options = _.defaults({}, options, this.defaults);

    this.initialize();
  }
  UltimatumGamePartitioned.States.ReceiverPlay.prototype = new StateApp.State(UltimatumGamePartitioned.Views.ReceiverPlay.Layout);
  _.extend(UltimatumGamePartitioned.States.ReceiverPlay.prototype, {
    defaults: {
      defaultChoice: "A", // choice made when a player does not play
    },

    initialize: function () {
      this.config = this.options.config;
    },

    // this.input is a groupModel
    beforeRender: function () {
      // reset played and choices
      this.groupModel = this.input;
      var validChoices = [this.config.acceptChoice, this.config.rejectChoice];

      this.groupModel.get("group2").each(function (participant) {
        participant.reset();
        participant.set("validChoices", validChoices);
      });

      this.options.viewOptions = { model: this.groupModel };
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        model: this.groupModel,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name
      };
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


  UltimatumGamePartitioned.States.Results = function (options) {
    this.options = _.defaults({}, options);
    this.initialize();
  }
  UltimatumGamePartitioned.States.Results.prototype = new StateApp.State(UltimatumGamePartitioned.Views.Results.Layout);
  _.extend(UltimatumGamePartitioned.States.Results.prototype, {
    initialize: function () {
      this.config = this.options.config;
    },
    beforeRender: function () {
      // this.input is a GroupModel
      this.groupModel = this.input;
      this.options.viewOptions = { model: this.groupModel };

      this.assignScores(this.groupModel);

      // TODO log
      //this.logResults(this.groupModel);
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        model: this.groupModel,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name
      };
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

  return UltimatumGamePartitioned;
});