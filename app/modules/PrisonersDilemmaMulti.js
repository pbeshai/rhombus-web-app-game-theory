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

  var PrisonersDilemmaMulti = app.module();
  PrisonersDilemmaMulti.config = {
    scoringMatrix: {
      CC: 3,
      CD: 0,
      DC: 5,
      DD: 1
    },
    minRounds: 1,
    maxRounds: 2,
    gameOver: false, // set to false when the game is over
  };

  PrisonersDilemmaMulti.Views.Play = {};
  PrisonersDilemmaMulti.Views.Results = {};

  PrisonersDilemmaMulti.Views.Play.Participant = PrisonersDilemma.Views.Play.Participant.extend({
    template: "pdm/play/participant",

    beforeRender: function () {
      PrisonersDilemma.Views.Play.Participant.prototype.beforeRender.call(this);
      if (this.model.get("roundsLeft") === 0) {
        this.$el.addClass("complete");
      }
    }
  });

  PrisonersDilemmaMulti.Views.Play.Layout = PrisonersDilemma.Views.Play.Layout.extend({
    template: "pdm/play/layout",

    serialize: function () {
      return {
        hasPlayers: (this.collection.length > 0),
        round: this.options.round,
        gameOver: this.options.gameOver
      };
    },

    beforeRender: function () {
      this.collection.each(function (participant) {
        this.insertView(".participant-grid", new PrisonersDilemmaMulti.Views.Play.Participant({ model: participant }));
      }, this);
      if (this.options.round > 1) {
        this.setView(".results-stats", new PrisonersDilemma.Views.Results.Stats({ collection: this.collection }));
      }

      this.insertView(new Common.Views.Instructions({ model: new PrisonersDilemma.Instructions(null, { config: this.options.config }) }))
    },


    initialize: function () {
      app.participantServer.hookCollection(this.collection, this);

      this.listenTo(this.collection, {
        "reset": this.render
      });
    },
  });

  PrisonersDilemmaMulti.Views.Configure = Backbone.View.extend({
    template: "pdm/configure",
    modelOptions: _.clone(PrisonersDilemmaMulti.config),

    events: {
      "change .min-rounds" : "updateMinRounds",
      "change .max-rounds" : "updateMaxRounds"
    },

    serialize: function () {
      return {
        minRounds: this.model.get("minRounds"),
        maxRounds: this.model.get("maxRounds")
      }
    },

    updateMinRounds: function (evt) {
      var minRounds = parseInt(this.$(".min-rounds").val());
      this.model.set("minRounds", minRounds)
    },

    updateMaxRounds: function (evt) {
      var maxRounds = parseInt(this.$(".max-rounds").val());
      this.model.set("maxRounds", maxRounds)
    },

    beforeRender: function () {
      this.setView(".pd-configure", new PrisonersDilemma.Views.Configure({ model: this.model }));
    },

    initialize: function () {
      // use defaults so we don't overwrite if already there
      _.defaults(this.model.attributes, this.modelOptions);
    }
  });

  // TODO: add rounds and game over
  PrisonersDilemmaMulti.Views.Results.Layout = PrisonersDilemma.Views.Results.Layout.extend({
  });

  // To be used in StateApps
  PrisonersDilemmaMulti.States = {};
  PrisonersDilemmaMulti.States.Play = StateApp.defineState(Common.States.Play, {
    view: PrisonersDilemmaMulti.Views.Play.Layout,
    defaultChoice: "C", // choice made when a player does not play
    validChoices: ["C", "D"],


    setViewOptions: function () {
      Common.States.Play.prototype.setViewOptions.call(this);
      _.extend(this.options.viewOptions, {
        round: this.stateApp.round,
        gameOver: this.config.gameOver,
      });
    },
  });

  PrisonersDilemmaMulti.States.Results = StateApp.defineState(Common.States.Results, {
    view: PrisonersDilemmaMulti.Views.Results.Layout,

    assignScore: function (participant) {
      var pairChoices = participant.get("choice") + participant.get("partner").get("choice");
      var data = { "score": this.config.scoringMatrix[pairChoices], "pairChoices": pairChoices };
      participant.set(data);

      // store the score in the participant's history
      var history = participant.get("history");
      data.round = this.stateApp.round;

      if (history == null) {
        participant.set("history", [ data ]);
      } else {
        // if we do not already have data for this round, add it:
        var roundData = _.find(history, function (item) { return item.round === data.round });
        if (roundData === undefined) {
          history.push(data);
        }
      }
    },

    setViewOptions: function () {
      Common.States.Play.prototype.setViewOptions.call(this);
      _.extend(this.options.viewOptions, {
        round: this.stateApp.round,
        gameOver: this.config.gameOver,
      });
    },

    beforeRender: function () {
      this.collection = this.input;

      if (this.config.newRound) { // is this a new round that needs to have score calculated? (false if game over and accidentally reshowing results)
        // calculate the scores
        this.assignScores();

        // log results
        this.logResults();
      }
    },

    logResults: function () {
      var results = this.collection.map(function (model) {
        return {
          alias: model.get("alias"),
          choice: model.get("choice"),
          score: model.get("score"),
          partner: {
            alias: model.get("partner").get("alias"),
            choice: model.get("partner").get("choice"),
            score: model.get("partner").get("score"),
          },
          history: model.get("history")
        };
      });

      this.log("apps/pdm/results", { results: results, round: this.stateApp.round });
    },

    getOutput: function () {
      return this.collection;
    }
  })

  return PrisonersDilemmaMulti;
});