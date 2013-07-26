/**

Coin Matching Game

Attendance -> Play -> Results

*/
define([
	// Application.
	"app",

	"apps/StateApp",

	"modules/common/CommonStateApps",
	"modules/CoinMatching"
],

function(app, StateApp, CommonStateApps, CoinMatching) {

	var CoinMatchingApp = CommonStateApps.BasicGame.extend({
		version: "1.0",
		config: CoinMatching.config,
		PlayStates: [ CoinMatching.States.Play ],
		ResultsState: CoinMatching.States.Results,
	});

	// description for use in router
	CoinMatchingApp.app = {
		instantiate: function (router) {
			return new CoinMatchingApp({ participants: router.participants });
		},
		configView: CoinMatching.Views.Configure,
		title: "Coin Matching Game"
	};

	return CoinMatchingApp;
});