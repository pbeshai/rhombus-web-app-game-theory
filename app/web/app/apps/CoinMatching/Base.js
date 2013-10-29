define([
	"framework/App",
	"framework/modules/common/Common",
],
function (App, Common) {

	var CoinMatching = {};

	CoinMatching.config = function () {
		return {
			pointsPerRound: 1,
			roundsPerPhase: 10,
			group1Name: "Matchers",
			group2Name: "Mismatchers",
		};
	};

	CoinMatching.Instructions = Common.Models.Instructions.extend({
		buttonConfig: {
			"A": { description: "Heads" },
			"B": { description: "Tails" }
		}
	});

	CoinMatching.Util = {};
	CoinMatching.Util.labelChoice = function (choice) {
		if (choice === "A") {
			return "H";
		} else if (choice === "B") {
			return "T";
		}
		return "#";
	};

	return CoinMatching;
});