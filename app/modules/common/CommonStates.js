define([
  "app",
  "modules/common/CommonModels",

  "apps/StateApp",
],
function(app, CommonModels, StateApp) {
  var CommonStates = {};

  CommonStates.Play = StateApp.State.extend({
    botCheck: function (collection) { return collection.length === 1; },
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

    // this.input is a participant collection.
    beforeRender: function () {
      var collection = this.collection = this.input;
      if (this.botCheck && this.botCheck(collection)) {
        collection.addBot();
      }

      // re-partners each render
      if (this.pairModels === true) {
        console.log("pairing models");
        collection.pairModels();
      } else if (this.pairModels === "asymmetric") {
        console.log("pairing asymmetrically");
        collection.pairModelsAsymmetric();
      }

      // reset played and choices
      collection.each(this.prepareParticipant, this);

      this.processBeforeRender();
    },

    setViewOptions: function () {
      this.options.viewOptions = _.defaults({
        collection: this.collection,
        config: this.config
      }, this.options.viewOptions);
    },

    processOutput: function () { }, // template method

    // outputs a participant collection
    getOutput: function () {
      // if you haven't played, then you played "A".
      this.collection.each(function (participant) {
        if (participant.get("choice") === undefined && this.defaultChoice) {
          participant.set("choice", this.defaultChoice);
        }
      }, this);

      this.processOutput();

      return this.collection;
    }
  });

  CommonStates.GroupPlay = StateApp.State.extend({
    defaultChoice: "A",
    groupModelOptions: { forceEven: true },

    processBeforeRender: function () { }, // template method

    prepareParticipant: function (participant) {
      participant.reset();


      if (this.validChoices) {
        console.log("setting valid choices as ", this.validChoices);
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
      // could receive input as participant collection or as a group model (if returning from receive play)
      if (this.input instanceof CommonModels.GroupModel) {
        this.groupModel = this.input;
      } else { // input is a collection, so create group model
        this.groupModel = new CommonModels.GroupModel({ participants: this.input }, this.groupModelOptions);
      }

      this.beforeRenderGroup1();
      this.beforeRenderGroup2();

      this.processBeforeRender();
    },

    setViewOptions: function () {
      this.options.viewOptions = _.defaults({
        model: this.groupModel,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name,
        config: this.config
      }, this.options.viewOptions);
    },

    processOutput: function () { }, // template method

    prepareParticipantOutput: function (participant) {
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
      // if you haven't played, then you played "A".
      this.groupModel.get("group1").each(this.prepareParticipantOutputGroup1, this);
    },

    prepareOutputGroup2: function () {
      // if you haven't played, then you played "A".
      this.groupModel.get("group2").each(this.prepareParticipantOutputGroup2, this);
    },

    handleConfigure: function () {
      this.renderView(); // ensures team names show update
    },

    // outputs a GroupModel
    getOutput: function () {
      this.prepareOutputGroup1();
      this.prepareOutputGroup2();

      this.processOutput();

      return this.groupModel;
    }
  });

  CommonStates.Results = StateApp.State.extend({
    beforeRender: function () {
      // this.input is a participant collection
      this.collection = this.input;

      this.assignScores();

      if (this.bucket) {
        this.groupModel.get("participants").bucket(this.bucketAttribute, this.numBuckets);
      }

      this.logResults();
    },

    setViewOptions: function () {
      this.options.viewOptions = _.defaults({
        collection: this.collection,
        config: this.config
      }, this.options.viewOptions);
    },

    handleConfigure: function () {
      this.render();
    },

    assignScore: function (participant) { // template method
      participant.set("score", 0);
    },

    assignScores: function () {
      this.collection.each(this.assignScore, this);
    },

    logResults: function () { }, // template method

    getOutput: function () {
      return this.collection;
    }
  });

  CommonStates.GroupResults = StateApp.State.extend({
    beforeRender: function () {
      // this.input is a GroupModel
      this.groupModel = this.input;

      this.assignScores();

      if (this.bucket) {
        this.groupModel.get("participants").bucket(this.bucketAttribute, this.numBuckets);
      }

      this.logResults();
    },

    setViewOptions: function () {
      this.options.viewOptions = _.defaults({
        model: this.groupModel,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name,
        config: this.config
      }, this.options.viewOptions);
    },

    handleConfigure: function () {
      this.render();
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

    logResults: function () { }, // template method

    getOutput: function () {
      return this.groupModel;
    }
  });


  return CommonStates;
})