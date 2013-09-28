/**

Ultimatum Game (Partitioned)

Attendance -> Ultimatum Game Giver Play -> Receiver Play -> Ultimatum Game Results

*/
define([
	// Application.
	"framework/App",
	"framework/modules/StateApp/Module",
	"framework/modules/common/CommonStateApps",

	"apps/UltimatumGamePartitioned/Module"
],

function (App, StateApp, CommonStateApps, UltimatumGamePartitioned) {

	/**
	 *  Team Prisoner's Dilemma App
	 */
	var UltimatumGamePartitionedApp = CommonStateApps.BasicGame.extend({
		id: "ultimatum-partitioned",
		version: "1.0",
		config: UltimatumGamePartitioned.config,
		States: [ UltimatumGamePartitioned.States.GiverPlay, UltimatumGamePartitioned.States.ReceiverPlay,
							UltimatumGamePartitioned.States.Score, UltimatumGamePartitioned.States.Results ],
		prepend: { attendance: true, botCheck: true, group: true }
	});

	// description for use in router
	UltimatumGamePartitionedApp.app = {
		instantiate: function (attrs) {
			return new UltimatumGamePartitionedApp(attrs);
		},
		AppControlsView: UltimatumGamePartitioned.Views.AppControls,
		title: "Ultimatum Game (Partitioned)"
	};

	return UltimatumGamePartitionedApp;
});