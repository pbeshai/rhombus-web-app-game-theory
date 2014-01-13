define([
	"framework/App",
	"framework/modules/common/Common",
],
function (App, Common) {

	var Coordination = {};

	Coordination.config = function () {
		return {
			pointsPerRound: 1,
			roundsPerPhase: 10,
			group1Name: "Team 1",
			group2Name: "Team 2",
		};
	};

	Coordination.Instructions = Common.Models.Instructions.extend({
		buttonConfig: {
			"A": { description: "A" },
			"B": { description: "B" }
		}
	});

	Coordination.Util = {};
	Coordination.Util.labelChoice = function (choice) {
		if (choice === "A") {
			return "A";
		} else if (choice === "B") {
			return "B";
		}
		return "#";
	};

	return Coordination;
});