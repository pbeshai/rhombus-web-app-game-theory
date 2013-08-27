/**

	A place to test things.

*/
define([
  // Application.
  "app",

  "modules/common/Common",

  "modules/Participant",

  "apps/StateApp",
],

function (app, Common, Participant, StateApp) {

  var SequenceAliaser = app.module();

  SequenceAliaser.config = {
    sequenceLength: 4,
    sequenceAliasMap: {
      "ABCD": "Kelly",
      "AAAA": "Peter",
      "BBBB": "Junhao"
    }
  };

  SequenceAliaser.Instructions = Common.Models.Instructions.extend({
    buttonConfig: {
      A: { description: "A" },
      B: { description: "B" },
      C: { description: "C" },
      D: { description: "D" },
      E: { description: "Clear Sequence", className: "danger" }
    }
  });

  SequenceAliaser.Views.Participant = Common.Views.ParticipantImageDisplay.extend({
    actionAnimations: {
      "A": "pulse",
      "B": "bounce",
      "C": "shake",
      "D": "swing"
    },

    cssClass: function (model) {
      if (model.get("action")) {
        return "animated " + this.actionAnimations[model.get("action")];
      }
    },

    overlay: function (model) {
      if (model.get("action")) {
        return "choice-" + model.get("action").toLowerCase();
      }
    },

    idText: function (model) {
      return model.get("seqAlias");
    },

    mainText: function (model) {
      return model.get("action");
    },

    image: function (model) {
      var img;
      switch (model.get("seqAlias")) {
        case "Kelly":
          img = "kelly.jpg";
          break;
        case "Peter":
          img = "peter.jpg";
          break;
        case "Junhao":
          img = "junhao.jpg";
          break;
      }

      if (img) {
        img = "/img/" + img;
      }
      return img;
    },
  })

  SequenceAliaser.Views.Layout = app.registerView("seq-alias::layout", Common.Views.SimpleLayout.extend({
    header: "Sequence Aliaser",
    // ParticipantView: SequenceAliaser.Views.Participant,
    InstructionsModel: SequenceAliaser.Instructions,
    ParticipantView: SequenceAliaser.Views.Participant,
    acceptNew: true,
  }));

  SequenceAliaser.State = StateApp.ViewState.extend({
    name: "sequence-aliaser",
    view: "seq-alias::layout",

    runAction: function (participant, choice) {
      console.log("running action", choice);
      participant.set("action", choice);
    },

    updateSequence: function (participant, choice) {
      if (choice === "E") {
        participant.set({ sequence: null, seqAlias: null, action: null });
        return;
      }
      var sequence = participant.get("sequence") || "";

      // already has a sequence, now interpret actions
      if (sequence.length === this.config.sequenceLength) {
        this.runAction(participant, choice);
      } else {
        // add to the sequence
        sequence += choice;

        // final choice in sequence made, so
        if (sequence.length === this.config.sequenceLength) {
          var alias = this.config.sequenceAliasMap[sequence];

          if (alias) {
            participant.set("seqAlias", alias);

          } else { // invalid sequence, restart
            sequence = null;
          }
        }

        participant.set("sequence", sequence);
      }
    },

    beforeRender: function () {
      var participants = this.participants = this.input.participants;

      // listen for setting play
      this.stopListening();
      this.listenTo(participants, "update:choice", this.updateSequence);
    },

    viewOptions: function () {
      return {
        participants: this.options.participants,
      };
    },
  });

  return SequenceAliaser;
});