/**

	Coin Matching for Peter Danielson's COGS 300 class

*/
define([
	// Application.
	"framework/App",
	"framework/modules/common/Common",
],
function (App, Common) {

	var CoinMatching = {};

	CoinMatching.config = {
		pointsPerRound: 1,
		roundsPerPhase: 2,
		group1Name: "Matchers",
		group2Name: "Mismatchers",
	};

	CoinMatching.Instructions = Common.Models.Instructions.extend({
		buttonConfig: {
			"A": { description: "Heads" },
			"B": { description: "Tails" }
		}
	});

	CoinMatching.Util = {};
	CoinMatching.Util.labelChoice = function (choice) {
		if (choice === "A" || choice === "C") {
			return "H";
		} else if (choice === "B" || choice === "D") {
			return "T";
		}
		return "#";
	};

	return CoinMatching;
});