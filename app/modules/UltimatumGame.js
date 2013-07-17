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

  UltimatumGame.Views.Play = {};

  UltimatumGame.Views.Play.Giver = Common.Views.ParticipantHiddenPlay.extend({
    className: "participant giver"
  });

  UltimatumGame.Views.Play.Layout = Common.Views.GroupLayout.extend({
    overrides: {
      header: "Play",
      ParticipantView: {
        group1: UltimatumGame.Views.Play.Giver,
        group2: null
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
  UltimatumGame.States.Play = function (options) {
    this.options = _.defaults({}, options, this.defaults);

    this.initialize();
  }
  UltimatumGame.States.Play.prototype = new StateApp.State(UltimatumGame.Views.Play.Layout);
  _.extend(UltimatumGame.States.Play.prototype, {
    defaults: {
      defaultChoice: "A" // choice made when a player does not play
    },

    initialize: function () {
      this.config = this.options.config;
    },

    beforeRender: function () {
      // reset played and choices
      this.input.each(function (participant) {
        participant.unset("choice");
        participant.unset("played");
        participant.unset("complete");
      });

      this.groupModel = new Common.Models.GroupModel({ participants: this.input });

      this.options.viewOptions = { model: this.groupModel };
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        model: this.groupModel,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name
      };
    },

    // outputs a ?????????? TODO
    getOutput: function () {
      return;
      // if you haven't played, then you played "A".
      this.participants.each(function (participant) {
        if (participant.get("choice") === undefined) {
          participant.set("choice", this.options.defaultChoice);
        }
      }, this);

      return this.participants;
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
      // this.input is a ???????? TODO
      this.options.viewOptions = { collection: this.input };

      this.logResults(this.input);
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        model: this.groupModel,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name
      };
    },

    logResults: function (models) {
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