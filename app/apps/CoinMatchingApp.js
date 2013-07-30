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
			{ group1Name: "Lab 1 - Human", group2Name: "Lab 2 - Human" },
			{ group1Name: "Lab 1 - Human", group2Name: "Lab 2 - Computer" },
			{ group1Name: "Lab 1 - Computer", group2Name: "Lab 2 - Human" },
			{ group1Name: "Lab 1 - Computer", group2Name: "Lab 2 - Computer" },
		],

		handleConfigure: function () {
			// maybe update individual phase config instead of "overall" one?
		},

		initConfigs: function () {
			_.each(this.phaseConfigs, function (phaseConfig) {
				_.defaults(phaseConfig, this.config)
			}, this);
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
				this.states["phase" + (i + 1)] = new CoinMatching.States.Round(_.extend({ config: this.phaseConfigs[i] }, roundStateOptions(i + 1)));
				this.states["results" + (i + 1)] = new CoinMatching.States.PhaseResults({
					config: this.phaseConfigs[i],
					phase: (i+1),
					viewOptions: {
						header: "Results for Phase " + (i + 1)
					}
				});

				if (i === 0) {
					this.states["phase" + (i + 1)].setPrev(this.states.attendance);
				} else {
					this.states["totalResults" + (i + 1)] = new CoinMatching.States.TotalResults({ config: this.config, numPhases: i + 1 });
					this.states["totalResults" + (i + 1)].setPrev(this.states["results" + (i + 1)]);
					if (i === 1) {
						this.states["phase" + (i + 1)].setPrev(this.states["results" + i]);
					} else {
						this.states["phase" + (i + 1)].setPrev(this.states["totalResults" + i]);
					}

				}

				this.states["results" + (i + 1)].setPrev(this.states["phase" + (i + 1)]);



			}, this);
		}
	});

	// description for use in router
	CoinMatchingApp.app = {
		instantiate: function (router) {
			return new CoinMatchingApp({ participants: router.participants });
		},
		configView: CoinMatching.Views.Configure,
		title: "Coin Matching Game"
	};

	return CoinMatchingApp;
});