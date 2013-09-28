/**

Coin Matching Game

Attendance -> Play -> Results

*/
define([
	// Application.
	"framework/App",
	"framework/apps/StateApp",
	"framework/modules/common/CommonStateApps",

	"apps/CoinMatching/Module"
],

function (App, StateApp, CommonStateApps, CoinMatching) {

	// Attendance -> Phase 1 (Play) -> Phase 1 (Results) -> Phase 2 Play -> Phase 2 Results -> Total Results -> ...
	var CoinMatchingApp = CommonStateApps.PhaseGame.extend({
		id: "coin-matching",
		version: "1.2",
		config: CoinMatching.config,
		prepend: { attendance: true, botCheck: true, group: true },
		PhaseStates: [
			[ CoinMatching.States.Phase, CoinMatching.States.PhaseTotalBucket, CoinMatching.States.PhaseResults ],
			[ CoinMatching.States.Partner, CoinMatching.States.Phase, CoinMatching.States.PhaseTotalBucket, CoinMatching.States.PhaseResults, CoinMatching.States.TotalResults ],
			[ CoinMatching.States.Partner, CoinMatching.States.Phase, CoinMatching.States.PhaseTotalBucket, CoinMatching.States.PhaseResults, CoinMatching.States.TotalResults ],
			[ CoinMatching.States.Partner, CoinMatching.States.Phase, CoinMatching.States.PhaseTotalBucket, CoinMatching.States.PhaseResults, CoinMatching.States.TotalResults ],
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
							header: "Results for Phase " + phaseNum
						}
					};

				case "total-results": // options for total results
					return {
						config: this.config,
						numPhases: phaseNum,
						viewOptions: {
							header: "Total Results after Phase " + phaseNum
						}
					};
			}
		},

		handleConfigure: function () {
			// update numrounds in each of the rounds
			_.each(this.states, function (state) {
				if (state instanceof StateApp.RoundState) {
					state.numRounds = this.config.roundsPerPhase;
				}
			}, this);

			CommonStateApps.PhaseGame.prototype.handleConfigure.call(this);
		},

		addNewParticipants: function () {
			var currState = this.get("currentState");
			if (currState && currState.addNewParticipants) {
				currState.addNewParticipants(true); // true to render
			} else {
				console.log("Could not add in new participants to " + currState);
			}
		}
	});

	// description for use in router
	CoinMatchingApp.app = {
		instantiate: function (attrs) {
			return new CoinMatchingApp(attrs);
		},
		AppControlsView: CoinMatching.Views.AppControls,
		title: "Coin Matching Game"
	};

	return CoinMatchingApp;
});