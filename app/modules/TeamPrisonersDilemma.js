/**

	A simple grid app for displaying choices

*/
define([
  // Application.
  "app",

  "modules/PrisonersDilemma",
  "modules/Participant",

  "apps/StateApp",
],
function(app, PrisonersDilemma, Participant, StateApp) {

  var TeamPrisonersDilemma = app.module();
  TeamPrisonersDilemma.Views.Results = {};
  TeamPrisonersDilemma.Views.Play = {};


  TeamPrisonersDilemma.Collection = PrisonersDilemma.Collection.extend({
    pairModels: function () { }
  });

  TeamPrisonersDilemma.TeamsModel = Backbone.Model.extend({
    url: null,

    // 'participants' is an array of PrisonersDilemma.Model
    initialize: function (attrs, options) {
      this.set("team1", new TeamPrisonersDilemma.Collection());
      this.set("team2", new TeamPrisonersDilemma.Collection());
      this.on("reset", this.assignTeams);

      var participants = attrs.participants;
      var collection = new TeamPrisonersDilemma.Collection(participants);
      this.set("participants", collection);
      this.listenTo(collection, "reset", this.assignTeams);
      this.assignTeams(collection);
    },

    // put the participants into teams and pair them up (team 1 participants paired with team 2)
    assignTeams: function (collection) {
      var models = (collection !== undefined) ? collection.models : this.get("participants").models;

      var indices = [];
      _.each(models, function (model, i) { indices[i] = i; });
      indices = _.shuffle(indices);

      if (indices.length < 2) {
        console.log("less than two models");
      } else {
        for(var i = 0; i < (indices.length - (indices.length % 2)); i += 2) {
          this.get("team1").add(models[indices[i]]);
          models[indices[i]].set("partner", models[indices[i+1]]);

          this.get("team2").add(models[indices[i+1]]);
          models[indices[i+1]].set("partner", models[indices[i]]);
        }

        if (indices.length % 2 == 1) {
          console.log("uneven number of models, one model with no partner: " + models[indices[indices.length-1]].get("alias"));
        }
      }


    },
  });

  TeamPrisonersDilemma.Views.Play.Layout = Backbone.View.extend({
    template: "teampd/play/layout",

    serialize: function () {
      return {
        hasPlayers: (this.model.get("participants").length > 0),
        team1Name: this.options.team1Name,
        team2Name: this.options.team2Name
      };
    },

    beforeRender: function () {
      this.model.get("team1").each(addTeam(1), this);
      this.model.get("team2").each(addTeam(2), this);

      function addTeam(teamNum) {
        return function (participant, i) {
          this.insertView(".team" + teamNum + " .participant-grid", new PrisonersDilemma.Views.Play.Participant({ model: participant }));
        };
      }
    },

    initialize: function () {
      var participants = this.model.get("participants")
      app.participantServer.hookCollection(participants, this);
    },
  });

   TeamPrisonersDilemma.Views.Results.Layout = Backbone.View.extend({
    template: "teampd/results/layout",

    serialize: function () {
      return {
        hasPlayers: (this.model.get("participants").length > 0),
        team1Name: this.options.team1Name,
        team2Name: this.options.team2Name
      };
    },

    beforeRender: function () {
      this.setViews({
        ".results-participants .team1-inner": new PrisonersDilemma.Views.Results.Participants({ collection: this.model.get("team1") }),
        ".results-participants .team2-inner": new PrisonersDilemma.Views.Results.Participants({ collection: this.model.get("team2") }),
        ".results-stats": new PrisonersDilemma.Views.Results.Stats({ collection: this.model.get("participants") })
      });
    },

    initialize: function () {
      this.listenTo(this.model.get("participants"), "reset", this.render);
    }
  });

  TeamPrisonersDilemma.Views.Configure = Backbone.View.extend({
    template: "teampd/configure",
    modelOptions: {
      team1Name: "Team 1",
      team2Name: "Team 2"
    },

    events: {
      "change #team1-name-input" : "updateTeam1Name",
      "change #team2-name-input" : "updateTeam2Name"
    },

    serialize: function () {
      return {
        team1Name: this.model.get("team1Name"),
        team2Name: this.model.get("team2Name")
      }
    },

    updateTeam1Name: function (evt) {
      var team1Name = this.$("#team1-name-input").val();
      this.model.set("team1Name", team1Name);
    },

    updateTeam2Name: function (evt) {
      var team2Name = this.$("#team2-name-input").val();
      this.model.set("team2Name", team2Name);
    },

    beforeRender: function () {
      this.setView(".pd-configure", new PrisonersDilemma.Views.Configure({ model: this.model }));
    },

    initialize: function () {
      // use defaults so we don't overwrite if already there
      _.defaults(this.model.attributes, this.modelOptions);
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
        team1Name: this.config.team1Name,
        team2Name: this.config.team2Name
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

      // TODO: log results
      //this.logResults(this.teamsModel);
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        model: this.teamsModel,
        team1Name: this.config.team1Name,
        team2Name: this.config.team2Name
      };
    },

    logResults: function (models, payoff) {
      var results = models.map(function (model) {
        return {
          alias: model.get("alias"),
          choice: model.get("choice"),
          score: model.get("score"),
        };
      });
      console.log("TEAM PD RESULTS = ", results);
      var logData = {
        results: results,
        config: this.config,
        version: this.stateApp.version
      };

      app.api({ call: "apps/teampd/results", type: "post", data: logData });
    },

    getOutput: function () { }
  })

  return TeamPrisonersDilemma;
});