define([
  "app",
  "modules/common/CommonModels",

  "apps/StateApp",
],
function(app, CommonModels, StateApp) {
  var CommonStates = {};

  CommonStates.Play = StateApp.State.extend({
    botCheck: function (participants) { return participants.length === 1; },
    pairModels: true,
    defaultChoice: "A", // choice made when a player does not play

    processBeforeRender: function () { }, // template method

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
      if (this.botCheck && this.botCheck(participants)) {
        participants.addBot();
      }

      // re-partners each render
      if (this.pairModels === true) {
        participants.pairModels();
      } else if (this.pairModels === "asymmetric") {
        participants.pairModelsAsymmetric();
      }

      // listen for setting play
      this.stopListening();
      this.listenTo(participants, "change:choice", function (participant, choice) {
        console.log("!!! change choice in play state", arguments);
        participant.set("played", choice != null);

        if (participant.get("complete")) { // only update choice if it isn't complete.
          participant.attributes.choice = participant.previous("choice");
        }
      });

      // reset played and choices
      participants.each(this.prepareParticipant, this);

      this.processBeforeRender();
    },

    setViewOptions: function () {
      this.options.viewOptions = _.defaults({
        participants: this.participants,
        config: this.config
      }, this.options.viewOptions);
    },


    assignScore: function (participant) { }, // template method

    assignScores: function () {
      this.participants.each(this.assignScore, this);
    },

    processOutput: function () { }, // template method

    // outputs a participant participants
    getOutput: function () {
      // if you haven't played, then you played "A".
      this.participants.each(function (participant) {
        if (participant.get("choice") === undefined && this.defaultChoice) {
          participant.set("choice", this.defaultChoice);
        }
      }, this);

      this.assignScores();
      this.processOutput();

      return this.participants;
    }
  });

  CommonStates.GroupPlay = StateApp.State.extend({
    defaultChoice: "A",
    groupModelOptions: { forceEven: true },

    processBeforeRender: function () { }, // template method

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
        console.log("!!! change choice in play state", arguments);
        participant.set("played", choice != null);

        if (participant.get("complete")) { // only update choice if it isn't complete.
          participant.attributes.choice = participant.previous("choice");
        }
      });


      this.beforeRenderGroup1();
      this.beforeRenderGroup2();

      this.processBeforeRender();
    },

    setViewOptions: function () {
      this.options.viewOptions = _.defaults({
        model: this.groupModel,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name,
        group1NameSuffix: this.config.group1NameSuffix,
        group2NameSuffix: this.config.group2NameSuffix,
        config: this.config
      }, this.options.viewOptions);
    },

    processOutput: function () { }, // template method

    prepareParticipantOutput: function (participant) {
      // set the default choice if configured and the participant hasn't played
      if (participant.get("choice") === undefined && this.defaultChoice) {
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
      this.renderView(); // ensures team names show update
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
    getOutput: function () {
      this.prepareOutputGroup1();
      this.prepareOutputGroup2();

      this.assignScores();
      this.processOutput();

      return this.groupModel;
    }
  });

  CommonStates.Results = StateApp.State.extend({
    beforeRender: function () {
      // this.input is a participant participants
      this.participants = this.input;

      this.processBeforeRender();

      if (this.bucket) {
        this.groupModel.get("participants").bucket(this.bucketAttribute, this.numBuckets);
      }

      this.logResults();
    },

    processBeforeRender: function () { }, // template method

    setViewOptions: function () {
      this.options.viewOptions = _.defaults({
        participants: this.participants,
        config: this.config
      }, this.options.viewOptions);
    },

    handleConfigure: function () {
      this.render();
    },

    logResults: function () { }, // template method

    getOutput: function () {
      return this.participants;
    }
  });

  CommonStates.GroupResults = StateApp.State.extend({
    beforeRender: function () {
      // this.input is a GroupModel
      this.groupModel = this.input;

      this.processBeforeRender();

      if (this.bucket) {
        this.groupModel.get("participants").bucket(this.bucketAttribute, this.numBuckets);
      }

      this.logResults();
    },

    processBeforeRender: function () { }, // template method

    setViewOptions: function () {
      this.options.viewOptions = _.defaults({
        model: this.groupModel,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name,
        group1NameSuffix: this.config.group1NameSuffix,
        group2NameSuffix: this.config.group2NameSuffix,
        config: this.config
      }, this.options.viewOptions);
    },

    handleConfigure: function () {
      this.render();
    },

    logResults: function () { }, // template method

    getOutput: function () {
      return this.groupModel;
    }
  });

  return CommonStates;
})