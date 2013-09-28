/**

Prisoner's Dilemma:

Attendance -> Prisoner's Dilemma Play -> Prisoner's Dilemam Results

*/
define([
	// Application.
	"framework/App",
	"framework/modules/StateApp/Module",
	"framework/modules/common/CommonStateApps",

	"apps/PrisonersDilemma/Module"
],

function (App, StateApp, CommonStateApps, PrisonersDilemma) {

	var PrisonersDilemmaApp = CommonStateApps.BasicGame.extend({
		id: "pd",
		version: "1.0",
		config: PrisonersDilemma.config,
		States: [ PrisonersDilemma.States.Play, PrisonersDilemma.States.Score, PrisonersDilemma.States.Stats, PrisonersDilemma.States.Results ]
	});

	// description for use in router
	PrisonersDilemmaApp.app = {
		instantiate: function (attrs) {
			return new PrisonersDilemmaApp(attrs);
		},
		AppControlsView: PrisonersDilemma.Views.AppControls,
		title: "Prisoner's Dilemma"
	};

	return PrisonersDilemmaApp;
});