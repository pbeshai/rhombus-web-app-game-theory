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
		config: PrisonersDilemmaMulti.config,
		States: [ PrisonersDilemmaMulti.States.Phase ]

	});

	// description for use in router
	PrisonersDilemmaMultiApp.app = {
		instantiate: function (options) {
			return new PrisonersDilemmaMultiApp(options);
		},
		AppControlsView: PrisonersDilemmaMulti.Views.AppControls,
		title: "Multiround Prisoner's Dilemma"
	};

	return PrisonersDilemmaMultiApp;
});