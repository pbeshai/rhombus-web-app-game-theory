/**

Team Prisoner's Dilemma:

Attendance -> Team Prisoner's Dilemma Play -> Team Prisoner's Dilemam Results

*/
define([
  // Application.
  "app",

  "apps/StateApp",

  "modules/common/CommonStateApps",
  "modules/TeamPrisonersDilemma"
],

function(app, StateApp, CommonStateApps, TeamPrisonersDilemma) {

	var TeamPrisonersDilemmaApp = CommonStateApps.BasicGame.extend({
		version: "1.0",
		config: TeamPrisonersDilemma.config,
		PlayStates: [ TeamPrisonersDilemma.States.Play ],
		ResultsState: TeamPrisonersDilemma.States.Results,
	});

	// description for use in router
	TeamPrisonersDilemmaApp.app = {
		instantiate: function (router) {
			return new TeamPrisonersDilemmaApp({ participants: router.participants });
		},
		configView: TeamPrisonersDilemma.Views.Configure,
		title: "Team Prisoner's Dilemma"
	};

  return TeamPrisonersDilemmaApp;
});