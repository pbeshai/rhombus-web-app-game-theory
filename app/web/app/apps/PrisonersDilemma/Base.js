define([
	"framework/App",
	"framework/modules/common/Common",
],
function (App, Common) {

	var PrisonersDilemma = {};
	PrisonersDilemma.config = {
		scoringMatrix: {
			CC: 3,
			CD: 0,
			DC: 5,
			DD: 1
		}
	};

	PrisonersDilemma.Instructions = {};
	PrisonersDilemma.Instructions.Play = Common.Models.Instructions.extend({
		layout: { description: "right" },
		description: { template: "app/apps/PrisonersDilemma/templates/instructions" },
		buttonConfig: {
			"C": { description: "Cooperate" },
			"D": { description: "Defect" },
		}
	});

	PrisonersDilemma.Instructions.Results = PrisonersDilemma.Instructions.Play.extend({
		buttonConfig: {}
	});

	PrisonersDilemma.Util = {};
	// simplify participant to just the relevant results
	PrisonersDilemma.Util.participantResults = function (participant) {
		return {
			alias: participant.get("alias"),
			score: participant.get("score"),
			choice: participant.get("choice"),
			pairChoices: participant.get("pairChoices")
		};
	};
	PrisonersDilemma.Util.labelChoice = function (choice) {
		if (choice === "C") {
			return "C";
		} else if (choice === "D") {
			return "D";
		}
		return "#";
	};

	return PrisonersDilemma;
});