/**

Stag Hunt

*/
define([
	"framework/App",
	"framework/modules/StateApp/Module",
	"framework/modules/common/CommonStateApps",

	"apps/StagHunt/Module"
],

function (App, StateApp, CommonStateApps, StagHunt) {

	// Attendance -> Phase 1 (Play) -> Phase 1 (Results) -> Phase 2 Play -> Phase 2 Results -> Total Results -> ...
	var StagHuntApp = CommonStateApps.PhaseGame.extend({
		id: "stag-hunt",
		version: "1.1",
		config: StagHunt.config(),
		prepend: { attendance: true, botCheck: true, group: true },
		PhaseStates: [
			[ StagHunt.States.Phase, StagHunt.States.PhaseTotalBucket, StagHunt.States.PhaseResults ],
			[ StagHunt.States.Phase, StagHunt.States.PhaseTotalBucket, StagHunt.States.PhaseResults, StagHunt.States.TotalResults ],
			[ StagHunt.States.Phase, StagHunt.States.PhaseTotalBucket, StagHunt.States.PhaseResults, StagHunt.States.TotalResults ],
		],
		phaseConfigs: [
			{ group1NameSuffix: "Human", group2NameSuffix: "Human" },
			{ group1NameSuffix: "Human", group2NameSuffix: "Computer" },
			{ group1NameSuffix: "Computer", group2NameSuffix: "Human" }
		],

		// default implementation assumes phases are structured: Play, Score, Bucket, Results
		getPhaseRoundOptions: function (phaseIndex, stateIndex) {
			// our structure is: Partner, Play, Score, Bucket, Results.
			var options = CommonStateApps.PhaseGame.prototype.getPhaseRoundOptions.apply(this, arguments);
			options.unshift(null);
			return options;
		}
	});

	// description for use in router
	StagHuntApp.app = {
		instantiate: function (attrs) {
			return new StagHuntApp(attrs);
		},
		AppControlsView: StagHunt.Views.AppControls,
		title: "Stag Hunt"
	};

	return StagHuntApp;
});