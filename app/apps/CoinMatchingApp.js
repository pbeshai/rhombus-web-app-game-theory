/**

Coin Matching Game

Attendance -> Play -> Results

*/
define([
	// Application.
	"app",

	"apps/StateApp",

	"modules/Participant",
	"modules/Attendance",
	"modules/CoinMatching"
],

function(app, StateApp, Participant, Attendance, CoinMatching) {

	/**
	 *  Team Prisoner's Dilemma App
	 */
	var CoinMatchingApp = function (options) {
		this.options = options || {};
		this.config = _.extend({}, CoinMatching.config, this.options.config);
		this.initialize();
	};

	// description for use in router
	CoinMatchingApp.app = {
		instantiate: function (router) {
			return new CoinMatchingApp({ participants: router.participants });
		},
		configView: CoinMatching.Views.Configure,
		title: "Coin Matching Game"
	};

	CoinMatchingApp.prototype = new StateApp.App();
	_.extend(CoinMatchingApp.prototype, {
		version: "1.0",

		defineStates: function () {
			var attendanceState = new Attendance.State({
				participants: this.options.participants,
				acceptNew: true,
				saveNew: false
			});

			var playState = new CoinMatching.States.Play({
				config: this.config
			});

			var resultsState = new CoinMatching.States.Results({
				config: this.config
			});

			this.states = {
				"attendance": attendanceState,
				"play": playState,
				"results": resultsState
			};

			attendanceState.setNext(playState);
			playState.setNext(resultsState);
		},

		initialize: function () {
			StateApp.App.prototype.initialize.call(this);
		},

		handleConfigure: function () {
			this.currentState.handleConfigure();
			// redraw if results are active
			if (this.currentState === this.states.results) {
				this.currentState.render();
			} else if (this.currentState === this.states.play) {
				this.currentState.render();
			}
		},

		transitions: {
				attendance_play: function () {
					// take output from attendance and use it in grid
				},

				play_attendance: function () {
					this.options.participants.fetch(); // reset the participants that attendance uses
				},

				play_results: function () {

				},
		}
	});


	return CoinMatchingApp;
});