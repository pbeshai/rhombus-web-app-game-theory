/**

	A simple grid app for displaying choices

*/
define([
  // Application.
  "app",

  "modules/common/Common",
  "modules/PrisonersDilemma",
  "modules/Participant",

  "apps/StateApp",
],
function(app, Common, PrisonersDilemma, Participant, StateApp) {

  var TeamPrisonersDilemma = app.module();
  TeamPrisonersDilemma.Views.Results = {};
  TeamPrisonersDilemma.Views.Play = {};

  TeamPrisonersDilemma.Collection = PrisonersDilemma.Collection.extend({
    pairModels: function () { }
  });


  TeamPrisonersDilemma.TeamsModel = Common.Models.GroupModel.extend({
    GroupCollection: TeamPrisonersDilemma.Collection
  });

  TeamPrisonersDilemma.Views.Play.Layout = Common.Views.GroupLayout.extend({
    overrides: {
      header: "Play",
      ParticipantView: PrisonersDilemma.Views.Play.Participant
    }
  });

  TeamPrisonersDilemma.Views.Results.TeamStats = PrisonersDilemma.Views.Results.Stats.extend({
    template: "teampd/results/team_stats",
    afterRender: function () { }, // do not render graphs
    serialize: function () {
      var stats = PrisonersDilemma.Views.Results.Stats.prototype.serialize.call(this);
      return stats[0];
    }
  });

  TeamPrisonersDilemma.Views.Results.Layout = Common.Views.GroupLayout.extend({
    overrides: {
      header: "Results",
      ParticipantsView: PrisonersDilemma.Views.Results.Participants,
      PostParticipantsView: TeamPrisonersDilemma.Views.Results.TeamStats,
      PostGroupsView: PrisonersDilemma.Views.Results.Stats
    },
  });

  TeamPrisonersDilemma.Views.Configure = Backbone.View.extend({
    template: "teampd/configure",

    beforeRender: function () {
      this.setView(".pd-configure", new PrisonersDilemma.Views.Configure({ model: this.model }));
      this.setView(".team-name-configure", new Common.Views.GroupConfigure({
        model: this.model,
        nameHeader: "Team Names",
        group1Label: "Team 1",
        group2Label: "Team 2"
      }));
    }
  });

  // To be used in StateApps
  TeamPrisonersDilemma.States = {};
  TeamPrisonersDilemma.States.Play = function (options) {
    this.options = _.defaults({}, options, this.defaults);

    this.initialize();
  }
  TeamPrisonersDilemma.States.Play.prototype = new StateApp.State(TeamPrisonersDilemma.Views.Play.Layout);
  _.extend(TeamPrisonersDilemma.States.Play.prototype, {
    defaults: {
      defaultChoice: "C" // choice made when a player does not play
    },

    initialize: function () {
      this.config = this.options.config;
    },

    beforeRender: function () {
      var pdParticipants = new PrisonersDilemma.Util.convertModels(this.input);
      this.teamsModel = new TeamPrisonersDilemma.TeamsModel({ participants: pdParticipants });
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        model: this.teamsModel,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name
      };
    },

    // outputs a TeamPrisonersDilemma.TeamsModel
    getOutput: function () {
      // set choice for those who haven't played
      this.teamsModel.get("participants").each(function (participant) {
        if (participant.get("choice") === undefined) {
          participant.set("choice", this.options.defaultChoice);
        }
      }, this);

      return this.teamsModel;
    }
  });

  TeamPrisonersDilemma.States.Results = function (options) {
    this.options = _.defaults({}, options);
    this.initialize();
  }
  TeamPrisonersDilemma.States.Results.prototype = new StateApp.State(TeamPrisonersDilemma.Views.Results.Layout);
  _.extend(TeamPrisonersDilemma.States.Results.prototype, {
    initialize: function () {
      this.config = this.options.config;
    },

    assignScores: function (teamsModel) {
      var scoringMatrix = this.config.scoringMatrix;
      teamsModel.get("participants").each(function (model) {
        var pairChoices = model.get("choice") + model.get("partner").get("choice");
        model.set({"score": scoringMatrix[pairChoices], "pairChoices": pairChoices});
      }, this);
    },

    beforeRender: function () {
      // this.input is a TeamPrisonersDilemma.TeamsModel
      this.teamsModel = this.input;

      // calculate the scores
      this.assignScores(this.teamsModel);

      // log results
      this.logResults(this.teamsModel);
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        model: this.teamsModel,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name
      };
    },

    logResults: function (teamsModel) {
      var modelTransform = function (model) {
        return {
          alias: model.get("alias"),
          choice: model.get("choice"),
          score: model.get("score"),
          partner: {
            alias: model.get("partner").get("alias"),
            choice: model.get("partner").get("choice"),
            score: model.get("partner").get("score"),
          },
        };
      };

      var team1Results = teamsModel.get("group1").map(modelTransform);
      var team2Results = teamsModel.get("group2").map(modelTransform);
      console.log("TEAM PD RESULTS (team1,team2) = ", team1Results, team2Results);
      var logData = {
        results: {
          team1: team1Results,
          team2: team2Results
        },
        config: this.config,
        version: this.stateApp.version
      };

      app.api({ call: "apps/teampd/results", type: "post", data: logData });
    },

    getOutput: function () { }
  })

  return TeamPrisonersDilemma;
});