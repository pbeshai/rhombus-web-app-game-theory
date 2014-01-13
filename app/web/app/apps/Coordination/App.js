/**

Coordination Game

Attendance -> Play -> Results

*/
define([
	// Application.
	"framework/App",
	"framework/modules/StateApp/Module",
	"framework/modules/common/CommonStateApps",

	"apps/Coordination/Module"
],

function (App, StateApp, CommonStateApps, Coordination) {

	// Attendance -> Phase 1 (Play) -> Phase 1 (Results) -> Phase 2 Play -> Phase 2 Results -> Total Results -> ...
	var CoordinationApp = CommonStateApps.PhaseGame.extend({
		id: "coordination",
		version: "1.0",
		config: Coordination.config(),
		prepend: { attendance: true, botCheck: true, group: true },
		PhaseStates: [
			[ Coordination.States.Phase, Coordination.States.PhaseTotalBucket, Coordination.States.PhaseResults ],
			[ Coordination.States.Partner, Coordination.States.Phase, Coordination.States.PhaseTotalBucket, Coordination.States.PhaseResults, Coordination.States.TotalResults ],
			[ Coordination.States.Partner, Coordination.States.Phase, Coordination.States.PhaseTotalBucket, Coordination.States.PhaseResults, Coordination.States.TotalResults ],
		],
		phaseConfigs: [
			{ group1NameSuffix: "Human", group2NameSuffix: "Human" },
			{ group1NameSuffix: "Human", group2NameSuffix: "Computer" },
			{ group1NameSuffix: "Computer", group2NameSuffix: "Human" },
		],
	});

	// description for use in router
	CoordinationApp.app = {
		instantiate: function (attrs) {
			return new CoordinationApp(attrs);
		},
		AppControlsView: Coordination.Views.AppControls,
		title: "Coordination Game"
	};

	return CoordinationApp;
});