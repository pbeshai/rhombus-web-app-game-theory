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
  TeamPrisonersDilemma.config = {
    group1Name: "Team 1",
    group2Name: "Team 2",
    scoringMatrix: {
      CC: 3,
      CD: 0,
      DC: 5,
      DD: 1
    }
  };

  TeamPrisonersDilemma.Views.Results = {};
  TeamPrisonersDilemma.Views.Play = {};

  TeamPrisonersDilemma.TeamsModel = Common.Models.GroupModel;

  TeamPrisonersDilemma.Views.Play.Layout = Common.Views.GroupLayout.extend({
    overrides: {
      header: "Play",
      ParticipantView: PrisonersDilemma.Views.Play.Participant,
      InstructionsModel: PrisonersDilemma.Instructions
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
      ParticipantView: PrisonersDilemma.Views.Results.Participant,
      PostParticipantsView: TeamPrisonersDilemma.Views.Results.TeamStats,
      PostGroupsView: PrisonersDilemma.Views.Results.Stats
    },
  });

  TeamPrisonersDilemma.Views.Configure = Backbone.View.extend({
    template: "teampd/configure",
    modelOptions: _.clone(TeamPrisonersDilemma.config),

    beforeRender: function () {
      this.setView(".pd-configure", new PrisonersDilemma.Views.Configure({ model: this.model }));
      this.setView(".team-name-configure", new Common.Views.GroupConfigure({
        model: this.model,
        nameHeader: "Team Names",
        group1Label: "Team 1",
        group2Label: "Team 2"
      }));
    },

    initialize: function () {

      // use defaults so we don't overwrite if already there
      _.defaults(this.model.attributes, this.modelOptions);
    }
  });

  // To be used in StateApps
  TeamPrisonersDilemma.States = {};
  TeamPrisonersDilemma.States.Play = Common.States.GroupPlay.extend({
    view: TeamPrisonersDilemma.Views.Play.Layout,
    defaultChoice: "C", // choice made when a player does not play
    validChoices: ["C", "D"]
  });

  TeamPrisonersDilemma.States.Results = Common.States.GroupResults.extend({
    view: TeamPrisonersDilemma.Views.Results.Layout,

    assignScore: function (participant) {
      var pairChoices = participant.get("choice") + participant.get("partner").get("choice");
      participant.set({
        "score": this.config.scoringMatrix[pairChoices],
        "pairChoices": pairChoices
      });
    },

    logResults: function () {
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

      var results = {
        team1: this.groupModel.get("group1").map(modelTransform),
        team2: this.groupModel.get("group2").map(modelTransform)
      }
      this.log("apps/teampd/results", { results: results });
    },
  });

  return TeamPrisonersDilemma;
});