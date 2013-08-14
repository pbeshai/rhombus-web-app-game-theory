/**

Ultimatum Game

Attendance -> Ultimatum Game Giver Play -> Receiver Play -> Ultimatum Game Results

*/
define([
	// Application.
	"app",

	"apps/StateApp",

	"modules/common/CommonStateApps",
	"modules/UltimatumGame"
],

function(app, StateApp, CommonStateApps, UltimatumGame) {

	/**
	 *  Team Prisoner's Dilemma App
	 */
	var UltimatumGameApp = CommonStateApps.BasicGame.extend({
		version: "1.0",
		config: UltimatumGame.config,
		PlayStates: [ UltimatumGame.States.GiverPlay, UltimatumGame.States.ReceiverPlay ],
		ResultsState: UltimatumGame.States.Results,
	});

	// description for use in router
	UltimatumGameApp.app = {
		instantiate: function (options) {
			return new UltimatumGameApp(options);
		},
		configView: UltimatumGame.Views.Configure,
		title: "Ultimatum Game"
	};

	return UltimatumGameApp;
});