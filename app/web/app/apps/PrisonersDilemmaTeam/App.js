/**

Stag Hunt

*/
define([
	"framework/App",
	"framework/modules/StateApp/Module",
	"framework/modules/common/CommonStateApps",

	"apps/PrisonersDilemmaTeam/Module"
],

function (App, StateApp, CommonStateApps, PrisonersDilemmaTeam) {

	// Attendance -> Phase 1 (Play) -> Phase 1 (Results) -> Phase 2 Play -> Phase 2 Results -> Total Results -> ...
	var PrisonersDilemmaTeamApp = CommonStateApps.PhaseGame.extend({
		id: "pdteam",
		version: "1.0",
		config: PrisonersDilemmaTeam.config(),
		prepend: { attendance: true, botCheck: true, group: true },
		PhaseStates: [
			[ PrisonersDilemmaTeam.States.Phase, PrisonersDilemmaTeam.States.PhaseTotalBucket, PrisonersDilemmaTeam.States.PhaseResults ],
			[ PrisonersDilemmaTeam.States.Partner, PrisonersDilemmaTeam.States.Phase, PrisonersDilemmaTeam.States.PhaseTotalBucket, PrisonersDilemmaTeam.States.PhaseResults, PrisonersDilemmaTeam.States.TotalResults ],
			[ PrisonersDilemmaTeam.States.Partner, PrisonersDilemmaTeam.States.Phase, PrisonersDilemmaTeam.States.PhaseTotalBucket, PrisonersDilemmaTeam.States.PhaseResults, PrisonersDilemmaTeam.States.TotalResults ],
		],
		phaseConfigs: [
			{ group1NameSuffix: "Human", group2NameSuffix: "Human" },
			{ group1NameSuffix: "Human", group2NameSuffix: "Computer" },
			{ group1NameSuffix: "Computer", group2NameSuffix: "Human" }
		],
	});

	// description for use in router
	PrisonersDilemmaTeamApp.app = {
		instantiate: function (attrs) {
			return new PrisonersDilemmaTeamApp(attrs);
		},
		AppControlsView: PrisonersDilemmaTeam.Views.AppControls,
		title: "Prisoner's Dilemma (teams)"
	};

	return PrisonersDilemmaTeamApp;
});