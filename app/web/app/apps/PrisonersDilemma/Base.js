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

	PrisonersDilemma.Instructions = Common.Models.Instructions.extend({
		description: { template: "app/apps/PrisonersDilemma/templates/instructions" },
		buttonConfig: {
			"C": { description: "Cooperate" },
			"D": { description: "Defect" },
		}
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

	return PrisonersDilemma;
});