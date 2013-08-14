/**

N-Person Prisoner's Dilemma:

Attendance -> N-Person Prisoner's Dilemma Play -> N-Person Prisoner's Dilemam Results

*/
define([
  // Application.
  "app",

  "apps/StateApp",

  "modules/common/CommonStateApps",
  "modules/NPrisonersDilemma"
],

function(app, StateApp, CommonStateApps, NPrisonersDilemma) {

	var NPrisonersDilemmaApp = CommonStateApps.BasicGame.extend({
		version: "1.0",
		config: NPrisonersDilemma.config,
		PlayStates: [ NPrisonersDilemma.States.Play ],
		ResultsState: NPrisonersDilemma.States.Results,
	});

	// description for use in router
	NPrisonersDilemmaApp.app = {
		instantiate: function (options) {
			return new NPrisonersDilemmaApp(options);
		},
		configView: NPrisonersDilemma.Views.Configure,
		title: "N-Person Prisoner's Dilemma"
	};

  return NPrisonersDilemmaApp;
});