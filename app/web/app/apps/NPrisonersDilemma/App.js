/**

N-Person Prisoner's Dilemma:

Attendance -> N-Person Prisoner's Dilemma Play -> N-Person Prisoner's Dilemam Results

*/
define([
	// Application.
	"framework/App",
	"framework/modules/StateApp/Module",
	"framework/modules/common/CommonStateApps",

	"apps/NPrisonersDilemma/Module"
],

function (App, StateApp, CommonStateApps, NPrisonersDilemma) {

	var NPrisonersDilemmaApp = CommonStateApps.BasicGame.extend({
		id: "npd",
		version: "1.0",
		config: NPrisonersDilemma.config,
		States: [ NPrisonersDilemma.States.Play, NPrisonersDilemma.States.Score, NPrisonersDilemma.States.Stats, NPrisonersDilemma.States.Results]
	});

	// description for use in router
	NPrisonersDilemmaApp.app = {
		instantiate: function (attrs) {
			return new NPrisonersDilemmaApp(attrs);
		},
		AppControlsView: NPrisonersDilemma.Views.AppControls,
		title: "N-Person Prisoner's Dilemma"
	};

	return NPrisonersDilemmaApp;
});