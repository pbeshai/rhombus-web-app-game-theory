/**

Coin Matching Game

Attendance -> Play -> Results

*/
define([
	// Application.
	"framework/App",
	"framework/modules/StateApp/Module",
	"framework/modules/common/CommonStateApps",

	"apps/CoinMatching/Module"
],

function (App, StateApp, CommonStateApps, CoinMatching) {

	// Attendance -> Phase 1 (Play) -> Phase 1 (Results) -> Phase 2 Play -> Phase 2 Results -> Total Results -> ...
	var CoinMatchingApp = CommonStateApps.PhaseGame.extend({
		id: "coin-matching",
		version: "1.3",
		config: CoinMatching.config,
		prepend: { attendance: true, botCheck: true, group: true },
		PhaseStates: [
			[ CoinMatching.States.Phase, CoinMatching.States.PhaseTotalBucket, CoinMatching.States.PhaseResults ],
			[ CoinMatching.States.Partner, CoinMatching.States.Phase, CoinMatching.States.PhaseTotalBucket, CoinMatching.States.PhaseResults, CoinMatching.States.TotalResults ],
			[ CoinMatching.States.Partner, CoinMatching.States.Phase, CoinMatching.States.PhaseTotalBucket, CoinMatching.States.PhaseResults, CoinMatching.States.TotalResults ],
		],
		phaseConfigs: [
			{ group1NameSuffix: "Human", group2NameSuffix: "Human" },
			{ group1NameSuffix: "Human", group2NameSuffix: "Computer" },
			{ group1NameSuffix: "Computer", group2NameSuffix: "Human" },
		],
	});

	// description for use in router
	CoinMatchingApp.app = {
		instantiate: function (attrs) {
			return new CoinMatchingApp(attrs);
		},
		AppControlsView: CoinMatching.Views.AppControls,
		title: "Coin Matching Game"
	};

	return CoinMatchingApp;
});