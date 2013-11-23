/**

Multi-round Prisoner's Dilemma:

Attendance -> Prisoner's Dilemma Play -> Prisoner's Dilemma Results

play many rounds

*/
define([
	// Application.
	"framework/App",
	"framework/modules/StateApp/Module",
	"framework/modules/common/CommonStateApps",

	"apps/PrisonersDilemmaMulti/Module"
],

function (App, StateApp, CommonStateApps, PrisonersDilemmaMulti) {
	var PrisonersDilemmaMultiApp = CommonStateApps.BasicGame.extend({
		id: "pdm",
		version: "1.0",
		config: PrisonersDilemmaMulti.config(),
		States: [ PrisonersDilemmaMulti.States.Phase, PrisonersDilemmaMulti.States.PhaseTotalBucket, PrisonersDilemmaMulti.States.PhaseResults ]
	});

	// description for use in router
	PrisonersDilemmaMultiApp.app = {
		instantiate: function (attrs, options) {
			return new PrisonersDilemmaMultiApp(attrs);
		},
		AppControlsView: PrisonersDilemmaMulti.Views.AppControls,
		title: "Prisoner's Dilemma (multiround)"
	};

	return PrisonersDilemmaMultiApp;
});