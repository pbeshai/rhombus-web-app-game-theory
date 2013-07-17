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

  UltimatumGame.Views.GiverPlay = {};

  UltimatumGame.Views.GiverPlay.Giver = Common.Views.ParticipantHiddenPlay.extend({
  });

  UltimatumGame.Views.GiverPlay.Receiver = Common.Views.ParticipantHiddenPlay.extend({
    overrides: {
      locked: true
    }
  });

  UltimatumGame.Views.GiverPlay.Layout = Common.Views.GroupLayout.extend({
    overrides: {
      header: "Givers Play",
      inactive: {
        group2: true
      },

      ParticipantView: {
        group1: UltimatumGame.Views.GiverPlay.Giver,
        group2: UltimatumGame.Views.GiverPlay.Receiver
      }
    }
  });

  UltimatumGame.Views.ReceiverPlay = {};

  UltimatumGame.Views.ReceiverPlay.Giver = Common.Views.ParticipantHiddenPlay.extend({
    overrides: {
      locked: true
    }
  });

  UltimatumGame.Views.ReceiverPlay.Receiver = Common.Views.ParticipantMessagePlay.extend({
    overrides: {
      messageAttribute: "offer"
    }
  });

  UltimatumGame.Views.ReceiverPlay.Layout = Common.Views.GroupLayout.extend({
    overrides: {
      header: "Receivers Play",
      inactive: {
        group1: true
      },

      ParticipantView: {
        group1: UltimatumGame.Views.ReceiverPlay.Giver,
        group2: UltimatumGame.Views.ReceiverPlay.Receiver
      }
    }
  });

  UltimatumGame.Views.Results = {};
  UltimatumGame.Views.Results.Layout = Backbone.View.extend({
    overrides: {
      header: "Results"
    }
  });

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

    beforeRender: function () {
      // could receive input as participant collection or as a group model (if returning from receive play)
      if (this.input instanceof Common.Models.GroupModel) {
        this.groupModel = this.input;

        // reset played and choices
        this.groupModel.get("participants").each(function (participant) {
          participant.unset("complete");
          participant.unset("played");
          participant.unset("choice");
        });
      } else {
        // reset played and choices
        this.input.each(function (participant) {
          participant.unset("complete");
          participant.unset("played");
          participant.unset("choice");

        });

        this.groupModel = new Common.Models.GroupModel({ participants: this.input });
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

        participant.get("partner").set("offer", this.config.offerMap[participant.get("choice")]);
        participant.set("complete", true);
      }, this);

      return this.groupModel;
    }
  });

  UltimatumGame.States.ReceiverPlay = function (options) {
    this.options = _.defaults({}, options, this.defaults);

    this.initialize();
  }
  UltimatumGame.States.ReceiverPlay.prototype = new StateApp.State(UltimatumGame.Views.ReceiverPlay.Layout);
  _.extend(UltimatumGame.States.ReceiverPlay.prototype, {
    defaults: {
      defaultChoice: "A" // choice made when a player does not play
    },

    initialize: function () {
      this.config = this.options.config;
    },

    // this.input is a groupModel
    beforeRender: function () {
      // reset played and choices
      this.groupModel = this.input;

      this.groupModel.get("group2").each(function (participant) {
        participant.unset("complete");
        participant.unset("played");
        participant.unset("choice");
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
      }, this);

      return this.groupModel;
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
      // this.input is a GroupModel
      this.groupModel = this.input;
      this.options.viewOptions = { model: this.groupModel };

      this.logResults(this.groupModel);
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        model: this.groupModel,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name
      };
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