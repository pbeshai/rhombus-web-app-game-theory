define([
  "app",
  "modules/common/CommonModels",

  "apps/StateApp",
],
function(app, CommonModels, StateApp) {
  var CommonStates = {};

  /***** NON-VIEW STATES *********************************************************************/

  // add a bot if necessary
  CommonStates.BotCheck = StateApp.State.extend({
    name: "botcheck",
    rules: {
      "at-least-two": function (participants) { return participants.length === 1; },
      "even": function (participants) { return (participants.length % 2) === 1; },
    },

    defaults: {
      activeRules: [ "at-least-two", "even" ],
    },

    run: function () {
      var participants = this.input;

      var botsRequired = _.some(this.options.activeRules, function (rule) {
        var result = this.rules[rule](participants);
        return result;
      }, this);

      if (botsRequired) {
        participants.addBot();
      }
    }
  })

  // partner participants
  CommonStates.Partner = StateApp.State.extend({
    name: "partner",
    defaults: {
      symmetric: true,
    },

    run: function () {
      var participants = this.input;

      if (this.options.symmetric) {
        participants.pairModels();
      } else {
        participants.pairModelsAsymmetric();
      }
    }
  });

  // score participants
  CommonStates.Score = StateApp.State.extend({
    name: "score",
    assignScore: function (participant) { // template method
      participant.set("score", -94);
    },

    assignScores: function (participants) {
      participants.each(this.assignScore, this);
    },

    run: function () {
      var participants = this.input;

      this.assignScores(participants);
    }
  });


  // buckets participants
  CommonStates.Bucket = StateApp.State.extend({
    name: "bucket",
    bucketAttribute: "score",
    numBuckets: 2,

    run: function () {
      var participants = this.input;
      if (participants instanceof CommonModels.GroupModel) {
        participants = participants.get("participants");
      }

      participants.bucket(this.bucketAttribute, this.numBuckets);
    }
  });


  /***** VIEW STATES *************************************************************************/

  CommonStates.Play = StateApp.ViewState.extend({
    name: "play",
    defaultChoice: "A", // choice made when a player does not play

    prepareParticipant: function (participant) {
      participant.reset();

      if (this.validChoices) {
        participant.set("validChoices", this.validChoices);
      }

      if (participant.bot) {
        participant.delayedPlay();
      }
    },

    // this.input is a participant participants.
    beforeRender: function () {
      var participants = this.participants = this.input;

      // listen for setting play
      this.stopListening();
      this.listenTo(participants, "change:choice", function (participant, choice) {
        participant.set("played", choice != null);

        if (participant.get("complete")) { // only update choice if it isn't complete.
          participant.attributes.choice = participant.previous("choice");
        }
      });

      // reset played and choices
      participants.each(this.prepareParticipant, this);
    },

    viewOptions: function () {
      return {
        participants: this.participants,
        config: this.config
      };
    },

    // outputs a participant participants
    onExit: function () {
      // if you haven't played, then you played the default choice.
      this.participants.each(function (participant) {
        if (participant.get("choice") == null && this.defaultChoice) {
          participant.set("choice", this.defaultChoice);
        }
      }, this);

      return this.participants;
    }
  });

  CommonStates.GroupPlay = StateApp.ViewState.extend({
    name: "group-play",
    defaultChoice: "A",
    groupModelOptions: { forceEven: true },

    prepareParticipant: function (participant) {
      participant.reset();


      if (this.validChoices) {
        participant.set("validChoices", this.validChoices);
      }

      if (participant.bot) {
        participant.delayedPlay();
      }
    },

    prepareParticipantGroup1: function (participant) {
      this.prepareParticipant(participant);
    },

    prepareParticipantGroup2: function (participant) {
      this.prepareParticipant(participant);
    },

    beforeRenderGroup1: function() {
      this.groupModel.get("group1").each(this.prepareParticipantGroup1, this);
    },

    beforeRenderGroup2: function() {
      this.groupModel.get("group2").each(this.prepareParticipantGroup2, this);
    },

    beforeRender: function () {
      // could receive input as participant participants or as a group model (if returning from receive play)
      if (this.input instanceof CommonModels.GroupModel) {
        this.groupModel = this.input;
      } else { // input is a participants, so create group model
        this.groupModel = new CommonModels.GroupModel({ participants: this.input }, this.groupModelOptions);
      }

      // listen for setting play
      this.stopListening();
      this.listenTo(this.groupModel.get("participants"), "change:choice", function (participant, choice) {
        participant.set("played", choice != null);

        if (participant.get("complete")) { // only update choice if it isn't complete.
          participant.attributes.choice = participant.previous("choice");
        }
      });

      this.beforeRenderGroup1();
      this.beforeRenderGroup2();
    },

    viewOptions: function () {
      return {
        model: this.groupModel,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name,
        group1NameSuffix: this.config.group1NameSuffix,
        group2NameSuffix: this.config.group2NameSuffix,
        config: this.config
      };
    },

    prepareParticipantOutput: function (participant) {
      // set the default choice if configured and the participant hasn't played
      if (participant.get("choice") == null && this.defaultChoice) {
        participant.set("choice", this.defaultChoice);
      }
    },

    prepareParticipantOutputGroup1: function (participant) {
      this.prepareParticipantOutput(participant);
    },

    prepareParticipantOutputGroup2: function (participant) {
      this.prepareParticipantOutput(participant);
    },

    prepareOutputGroup1: function () {
      this.groupModel.get("group1").each(this.prepareParticipantOutputGroup1, this);
    },

    prepareOutputGroup2: function () {
      this.groupModel.get("group2").each(this.prepareParticipantOutputGroup2, this);
    },

    handleConfigure: function () {
      app.controller.appController.updateView({ config: this.config }, "Viewer1"); // TODO: "Viewer1"
    },

    assignScore: function (participant) { // template method
      participant.set("score", 0);
    },

    assignScoreGroup1: function (participant) {
      this.assignScore(participant);
    },

    assignScoreGroup2: function (participant) {
      this.assignScore(participant);
    },

    assignScores: function () {
      this.assignScoresGroup1();
      this.assignScoresGroup2();
    },

    assignScoresGroup1: function () {
      this.groupModel.get("group1").each(this.assignScoreGroup1, this);
    },

    assignScoresGroup2: function () {
      this.groupModel.get("group2").each(this.assignScoreGroup2, this);
    },

    // outputs a GroupModel
    onExit: function () {
      this.prepareOutputGroup1();
      this.prepareOutputGroup2();

      this.assignScores();

      return this.groupModel;
    }
  });

  CommonStates.Results = StateApp.ViewState.extend({
    name: "results",
    beforeRender: function () {
      // this.input is a participant collection
      this.participants = this.input;
    },

    afterRender: function () {
      this.logResults();
    },

    viewOptions: function () {
      return {
        participants: this.participants,
        config: this.config
      };
    },

    handleConfigure: function () {
      this.render();
    },

    logResults: function () { }, // template method

    onExit: function () {
      return this.participants;
    }
  });

  CommonStates.GroupResults = StateApp.ViewState.extend({
    name: "group-results",
    beforeRender: function () {
      // this.input is a GroupModel
      this.groupModel = this.input;
    },

    afterRender: function () {
      this.logResults();
    },

    viewOptions: function () {
      return {
        model: this.groupModel,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name,
        group1NameSuffix: this.config.group1NameSuffix,
        group2NameSuffix: this.config.group2NameSuffix,
        config: this.config
      };
    },

    handleConfigure: function () {
      this.render();
    },

    logResults: function () { }, // template method

    onExit: function () {
      return this.groupModel;
    }
  });

  return CommonStates;
})