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
		States: [ UltimatumGamePartitioned.States.GiverPlay, UltimatumGamePartitioned.States.ReceiverPlay,
							UltimatumGamePartitioned.States.Score, UltimatumGamePartitioned.States.Results ],
		prepend: { attendance: true, botCheck: true, group: true }
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