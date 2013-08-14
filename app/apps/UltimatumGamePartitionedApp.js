/**

Ultimatum Game (Partitioned)

Attendance -> Ultimatum Game Giver Play -> Receiver Play -> Ultimatum Game Results

*/
define([
	// Application.
	"app",

	"apps/StateApp",

	"modules/common/CommonStateApps",
	"modules/UltimatumGamePartitioned"
],

function(app, StateApp, CommonStateApps, UltimatumGamePartitioned) {

	/**
	 *  Team Prisoner's Dilemma App
	 */
	var UltimatumGamePartitionedApp = CommonStateApps.BasicGame.extend({
		version: "1.0",
		config: UltimatumGamePartitioned.config,
		PlayStates: [ UltimatumGamePartitioned.States.GiverPlay, UltimatumGamePartitioned.States.ReceiverPlay ],
		ResultsState: UltimatumGamePartitioned.States.Results,
	});

	// description for use in router
	UltimatumGamePartitionedApp.app = {
		instantiate: function (options) {
			return new UltimatumGamePartitionedApp(options);
		},
		configView: UltimatumGamePartitioned.Views.Configure,
		title: "Ultimatum Game (Partitioned)"
	};

	return UltimatumGamePartitionedApp;
});