/**

Ultimatum Game

Attendance -> Ultimatum Game Giver Play -> Receiver Play -> Ultimatum Game Results

*/
define([
	// Application.
	"framework/App",
	"framework/modules/StateApp/Module",
	"framework/modules/common/CommonStateApps",

	"apps/UltimatumGame/Module"
],

function (App, StateApp, CommonStateApps, UltimatumGame) {

	/**
	 *  Team Prisoner's Dilemma App
	 */
	var UltimatumGameApp = CommonStateApps.PhaseGame.extend({
		id: "ultimatum",
		version: "1.0",
		config: UltimatumGame.config(),
		prepend: { attendance: true, botCheck: true, partner: false, group: false },
		PhaseStates: [
			[ UltimatumGame.States.Phase, UltimatumGame.States.PhaseTotalBucket, UltimatumGame.States.PhaseResults ],
			[ UltimatumGame.States.Phase, UltimatumGame.States.PhaseTotalBucket, UltimatumGame.States.PhaseResults, UltimatumGame.States.TotalResults ],
			[ UltimatumGame.States.Phase, UltimatumGame.States.PhaseTotalBucket, UltimatumGame.States.PhaseResults, UltimatumGame.States.TotalResults ],
		],
		phaseConfigs: [{},{},{}],


		getPhaseRoundOptions: function (phaseIndex, stateIndex) {
			var phaseNum = phaseIndex + 1;
			return [
					{ symmetric: false }, // UltimatumGameStates.Partner,
					{ viewOptions: { header: "Giver Play Phase " + phaseNum } }, // UltimatumGameStates.GiverPlay,
					{ viewOptions: { header: "Receiver Play Phase " + phaseNum } }, // UltimatumGameStates.ReceiverPlay,
					undefined, // UltimatumGameStates.Score,
					undefined, // UltimatumGameStates.GiverBucket,
					{ viewOptions: { header: "Giver Results Phase " + phaseNum } }, // UltimatumGameStates.GiverResults,
					undefined, // UltimatumGameStates.ReceiverBucket,
					{ viewOptions: { header: "Receiver Results Phase " + phaseNum } }, // UltimatumGameStates.ReceiverResults,
					undefined, // UltimatumGameStates.ScoreBucket,
					{ viewOptions: { header: "Combined Results Phase " + phaseNum } }, // UltimatumGameStates.ReceiverResults,
				];
		},
	});

	// description for use in router
	UltimatumGameApp.app = {
		instantiate: function (attrs) {
			return new UltimatumGameApp(attrs);
		},
		AppControlsView: UltimatumGame.Views.AppControls,
		title: "Ultimatum Game"
	};

	return UltimatumGameApp;
});