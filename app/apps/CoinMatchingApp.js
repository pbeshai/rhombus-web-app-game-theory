/**

Coin Matching Game

Attendance -> Play -> Results

*/
define([
	// Application.
	"app",

	"apps/StateApp",

	"modules/common/CommonStateApps",
	"modules/CoinMatching"
],

function(app, StateApp, CommonStateApps, CoinMatching) {

	// Attendance -> Phase 1 (Play) -> Phase 1 (Results) -> Phase 2 Play -> Phase 2 Results -> Total Results -> ...
	var CoinMatchingApp = CommonStateApps.BasicApp.extend({
		version: "1.0",
		config: CoinMatching.config,
		phaseConfigs: [
			{ group1NameSuffix: "Human", group2NameSuffix: "Human" },
			{ group1NameSuffix: "Human", group2NameSuffix: "Computer" },
			{ group1NameSuffix: "Computer", group2NameSuffix: "Human" },
			{ group1NameSuffix: "Computer", group2NameSuffix: "Computer" },
		],

		initConfigs: function () {
			_.each(this.phaseConfigs, function (phaseConfig) {
				_.defaults(phaseConfig, this.config)
			}, this);
		},

		handleConfigure: function () {
			// update numrounds in each of the rounds
			_.each(this.states, function (state) {
				if (state instanceof StateApp.RoundState) {
					state.numRounds = this.config.roundsPerPhase;
				}
			}, this);

			// update the phase configs
			_.each(this.phaseConfigs, function (phaseConfig) {
				_.extend(phaseConfig, this.config);
			}, this);

			CommonStateApps.BasicApp.prototype.handleConfigure.call(this);
		},

		defineMainStates: function () {
			this.initConfigs();

			var roundStateOptions = function (phaseNum) {
				return {
					stateOptions:
					[
						{ viewOptions: { header: "Play Phase " + phaseNum } },
						{ viewOptions: { header: "Results Phase " + phaseNum } }
					]
				};
			};
			_.each(this.phaseConfigs, function (phaseConfig, i) {
				var phaseNum = i+1;

				var phaseState = this.states["phase" + phaseNum] = new CoinMatching.States.Round(_.extend({ config: this.phaseConfigs[i] }, roundStateOptions(phaseNum)));
				var resultsState = this.states["results" + phaseNum] = new CoinMatching.States.PhaseResults({
					config: this.phaseConfigs[i],
					phase: (i+1),
					viewOptions: {
						header: "Results for Phase " + phaseNum
					}
				});

				if (i === 0) {
					phaseState.setPrev(this.states.attendance);
				} else {
					var totalResultsState = this.states["totalResults" + phaseNum] = new CoinMatching.States.TotalResults({
						config: this.config,
						numPhases: i + 1,
						viewOptions: {
							header: "Total Results after Phase " + phaseNum
						}
					});
					totalResultsState.setPrev(resultsState);
					if (i === 1) {
						// previous results state (no total results after phase 1)
						phaseState.setPrev(this.states["results" + i]); // only
					} else {
						// previous total results
						phaseState.setPrev(this.states["totalResults" + i]);
					}
				}

			 	resultsState.setPrev(phaseState);

			}, this);
		}
	});

	// description for use in router
	CoinMatchingApp.app = {
		instantiate: function (options) {
			return new CoinMatchingApp(options);
		},
		configView: CoinMatching.Views.Configure,
		title: "Coin Matching Game"
	};

	return CoinMatchingApp;
});