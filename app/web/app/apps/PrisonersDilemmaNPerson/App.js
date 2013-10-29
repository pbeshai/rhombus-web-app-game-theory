/**

N-Person Prisoner's Dilemma:

Attendance -> N-Person Prisoner's Dilemma Play -> N-Person Prisoner's Dilemam Results

*/
define([
	// Application.
	"framework/App",
	"framework/modules/StateApp/Module",
	"framework/modules/common/CommonStateApps",

	"apps/PrisonersDilemmaNPerson/Module"
],

function (App, StateApp, CommonStateApps, PrisonersDilemmaNPerson) {

	var NPrisonersDilemmaApp = CommonStateApps.BasicGame.extend({
		id: "pdn",
		version: "1.0",
		config: PrisonersDilemmaNPerson.config,
		States: [ PrisonersDilemmaNPerson.States.Play, PrisonersDilemmaNPerson.States.Score, PrisonersDilemmaNPerson.States.Stats, PrisonersDilemmaNPerson.States.Results]
	});

	// description for use in router
	NPrisonersDilemmaApp.app = {
		instantiate: function (attrs) {
			return new NPrisonersDilemmaApp(attrs);
		},
		AppControlsView: PrisonersDilemmaNPerson.Views.AppControls,
		title: "Prisoner's Dilemma (n_person)"
	};

	return NPrisonersDilemmaApp;
});