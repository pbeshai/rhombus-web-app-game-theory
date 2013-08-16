/**

Prisoner's Dilemma:

Attendance -> Prisoner's Dilemma Play -> Prisoner's Dilemam Results

*/
define([
  // Application.
  "app",

  "apps/StateApp",

  "modules/common/CommonStateApps",
  "modules/PrisonersDilemma"
],

function(app, StateApp, CommonStateApps, PrisonersDilemma) {

	var PrisonersDilemmaApp = CommonStateApps.BasicGame.extend({
		version: "1.0",
		config: PrisonersDilemma.config,
		States: [ PrisonersDilemma.States.Play, PrisonersDilemma.States.Score, PrisonersDilemma.States.Results ]
	})

	// description for use in router
	PrisonersDilemmaApp.app = {
		instantiate: function (options) {
			return new PrisonersDilemmaApp(options);
		},
		configView: PrisonersDilemma.Views.Configure,
		title: "Prisoner's Dilemma"
	};

  return PrisonersDilemmaApp;
});