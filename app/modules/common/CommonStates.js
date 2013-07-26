define([
  "app",
  "modules/common/CommonModels",

  "apps/StateApp",
],
function(app, CommonModels, StateApp) {
  var CommonStates = {};

  CommonStates.Play = StateApp.defineState({
    botCheck: function (collection) { return collection.length === 1; },
    pairModels: true,
    defaultChoice: "A", // choice made when a player does not play

    processBeforeRender: function () { }, // template method

    // this.input is a participant collection.
    beforeRender: function () {
      var collection = this.collection = this.input;
      if (this.botCheck && this.botCheck(collection)) {
        collection.addBot();
      }

      // re-partners each render
      if (this.pair === true) {
        console.log("pairing models");
        collection.pairModels();
      } else if (this.pairModels === "asymmetric") {
        console.log("pairing asymmetrically");
        collection.pairModelsAsymmetric();
      }

      // reset played and choices
      collection.each(function (participant) {
        participant.reset();

        if (this.validChoices) {
          participant.set("validChoices", this.validChoices);
        }

        if (participant.bot) {
          participant.delayedPlay();
        }
      }, this);

      this.processBeforeRender();
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        collection: this.collection,
        config: this.config
      };
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

  CommonStates.GroupPlay = StateApp.defineState({
    defaultChoice: "A",
    groupModelOptions: { forceEven: true },

    processBeforeRender: function () { }, // template method

    beforeRender: function () {
      // could receive input as participant collection or as a group model (if returning from receive play)
      if (this.input instanceof CommonModels.GroupModel) {
        this.groupModel = this.input;

        // reset played and choices
        this.groupModel.get("participants").each(function (participant) {
          participant.reset();

          if (this.validChoices) {
            participant.set("validChoices", this.validChoices);
          }

          if (participant.bot) {
            participant.delayedPlay();
          }
        });
      } else {
        // reset played and choices
        this.input.each(function (participant) {
          participant.reset();
        });

        this.groupModel = new CommonModels.GroupModel({ participants: this.input }, this.groupModelOptions);
      }

      this.processBeforeRender();
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        model: this.groupModel,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name,
        config: this.config
      };
    },

    processOutput: function () { }, // template method

    // outputs a GroupModel
    getOutput: function () {
      // if you haven't played, then you played "A".
      this.groupModel.get("participants").each(function (participant) {
        if (participant.get("choice") === undefined && this.defaultChoice) {
          participant.set("choice", this.defaultChoice);
        }
      }, this);

      this.processOutput();

      return this.groupModel;
    }
  });

  CommonStates.Results = StateApp.defineState({
    beforeRender: function () {
      // this.input is a participant collection
      this.collection = this.input;

      this.assignScores(this.collection);

      this.logResults(this.collection);
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        collection: this.collection,
        config: this.config
      };
    },

    assignScore: function (participant) { // template method
      return 0;
    },

    assignScores: function (collection) {
      collection.each(function (participant) {
        this.assignScore(participant);
      }, this);
    },

    logResults: function (collection) { }, // template method

    getOutput: function () { }
  });

  CommonStates.GroupResults = StateApp.defineState({
    beforeRender: function () {
      // this.input is a GroupModel
      this.groupModel = this.input;

      this.assignScores(this.groupModel);

      this.logResults(this.groupModel);
    },

    setViewOptions: function () {
      this.options.viewOptions = {
        model: this.groupModel,
        group1Name: this.config.group1Name,
        group2Name: this.config.group2Name,
        config: this.config
      };
    },

    assignScore: function (participant) { // template method
      return 0;
    },

    assignScores: function (groupModel) {
      groupModel.get("participants").each(function (participant) {
        this.assignScore(participant);
      }, this);
    },

    logResults: function (groupModel) { }, // template method

    getOutput: function () { }
  });


  return CommonStates;
})