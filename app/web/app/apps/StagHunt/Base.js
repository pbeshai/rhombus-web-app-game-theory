define([
	"framework/App",
	"framework/modules/common/Common",
],
function (App, Common) {

	var StagHunt = {};

	StagHunt.config = function () {
		return {
			scoringMatrix: {
				AA: 3,
				AB: 0,
				BA: 2,
				BB: 1
			},
			roundsPerPhase: 5,
			group1Name: "Team 1",
			group2Name: "Team 2",
		};
	};

	StagHunt.Instructions = Common.Models.Instructions.extend({
		layout: { description: "right" },
		description: { template: "app/apps/StagHunt/templates/instructions" },
		buttonConfig: {
			"A": { description: "Hunt a Stag" },
			"B": { description: "Hunt a Hare" }
		}
	});

	StagHunt.Util = {};
	StagHunt.Util.labelChoice = function (choice) {
		if (choice === "A") {
			return "S";
		} else if (choice === "B") {
			return "H";
		}
		return "#";
	};

	return StagHunt;
});