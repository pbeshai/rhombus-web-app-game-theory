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
		version: "1.0",
		config: StagHunt.config,
		prepend: { attendance: true, botCheck: true, group: true },
		PhaseStates: [
			[ StagHunt.States.Phase, StagHunt.States.PhaseTotalBucket, StagHunt.States.PhaseResults ],
			[ StagHunt.States.Partner, StagHunt.States.Phase, StagHunt.States.PhaseTotalBucket, StagHunt.States.PhaseResults, StagHunt.States.TotalResults ],
			[ StagHunt.States.Partner, StagHunt.States.Phase, StagHunt.States.PhaseTotalBucket, StagHunt.States.PhaseResults, StagHunt.States.TotalResults ],
			[ StagHunt.States.Partner, StagHunt.States.Phase, StagHunt.States.PhaseTotalBucket, StagHunt.States.PhaseResults, StagHunt.States.TotalResults ],
		],
		phaseConfigs: [
			{ group1NameSuffix: "Human", group2NameSuffix: "Human" },
			{ group1NameSuffix: "Human", group2NameSuffix: "Computer" },
			{ group1NameSuffix: "Computer", group2NameSuffix: "Human" },
			{ group1NameSuffix: "Computer", group2NameSuffix: "Computer" },
		],

		getPhaseStateOptions: function (phaseIndex, stateIndex) {
			var phaseNum = phaseIndex + 1;
			var phaseStates = this.PhaseStates[phaseIndex];
			var state = phaseStates[stateIndex];

			switch (state.prototype.name) {
				case "phase": // options for Round
					return _.extend({
						config: this.phaseConfigs[phaseIndex],
						name: "phase " + phaseNum,
						roundOptions: [
								{ viewOptions: { header: "Play Phase " + phaseNum } },
								undefined, // score
								undefined, // bucket
								{ viewOptions: { header: "Results Phase " + phaseNum } }
							]
					});

				case "bucket": // options for phase total bucket
					return { phase: phaseNum };

				case "phase-results": // options for phase results
					return {
						config: this.phaseConfigs[phaseIndex],
						phase: phaseNum,
						viewOptions: {
							header: "Phase " + phaseNum + " Total Results"
						}
					};

				case "total-results": // options for total results
					var header = "Total Results from Phase";
					if (phaseNum === 1) {
						header += " 1";
					} else if (phaseNum === 2) {
						header += "s 1 &amp; 2";
					} else {
						header += "s 1 to " + phaseNum;
					}
					return {
						config: this.config,
						numPhases: phaseNum,
						viewOptions: {
							header: header
						}
					};
			}
		},

		handleConfigure: function () {
			// TODO: update numrounds in each of the rounds
			CommonStateApps.PhaseGame.prototype.handleConfigure.call(this);
		},
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