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
		prepend: { attendance: true, botCheck: false, partner: false, group: false },
		PhaseStates: [
			[ UltimatumGame.States.Phase, UltimatumGame.States.PhaseTotalBucket, UltimatumGame.States.PhaseResults ],
			[ UltimatumGame.States.Phase, UltimatumGame.States.PhaseTotalBucket, UltimatumGame.States.PhaseResults, UltimatumGame.States.TotalResults ],
			[ UltimatumGame.States.Phase, UltimatumGame.States.PhaseTotalBucket, UltimatumGame.States.PhaseResults, UltimatumGame.States.TotalResults ],
		],
		phaseConfigs: [{},{},{}],


		getPhaseRoundOptions: function (phaseIndex, stateIndex) {
			var phaseNum = phaseIndex + 1;
			var options = [
					{ symmetric: false }, // UltimatumGameStates.Partner,
					{ viewOptions: { header: "Giver Play Phase " + phaseNum } }, // UltimatumGameStates.GiverPlay,
					{ viewOptions: { header: "Receiver Play Phase " + phaseNum } }, // UltimatumGameStates.ReceiverPlay,
					undefined, // UltimatumGameStates.Score,4
					undefined, // UltimatumGameStates.GiverBucket,
					{ viewOptions: { header: "Giver Results P" + phaseNum } }, // UltimatumGameStates.GiverResults,
					undefined, // UltimatumGameStates.ReceiverBucket,
					{ viewOptions: { header: "Receiver Results P" + phaseNum } }, // UltimatumGameStates.ReceiverResults,
					undefined, // UltimatumGameStates.ScoreBucket,
					{ viewOptions: { header: "Combined Results P" + phaseNum } }, // UltimatumGameStates.ReceiverResults,
				];

				if (phaseNum === 2) {
					options[2].viewOptions.header = "Comp. Receiver Play";
				} else if (phaseNum === 3) {
					options[1].viewOptions.header = "Comp. Giver Play";
				}

			return options;

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