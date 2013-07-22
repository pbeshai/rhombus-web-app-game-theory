/**

Ultimatum Game

Attendance -> Ultimatum Game Giver Play -> Receiver Play -> Ultimatum Game Results

*/
define([
	// Application.
	"app",

	"apps/StateApp",

	"modules/Participant",
	"modules/Attendance",
	"modules/UltimatumGame"
],

function(app, StateApp, Participant, Attendance, UltimatumGame) {

	/**
	 *  Team Prisoner's Dilemma App
	 */
	var UltimatumGameApp = function (options) {
		this.options = options || {};
		this.config = _.extend({}, UltimatumGame.config, this.options.config);
		this.initialize();
	};
	// description for use in router
	UltimatumGameApp.app = {
		instantiate: function (router) {
			return new UltimatumGameApp({ participants: router.participants });
		},
		configView: UltimatumGame.Views.Configure,
		title: "Ultimatum Game"
	};

	UltimatumGameApp.prototype = new StateApp.App();
	_.extend(UltimatumGameApp.prototype, {
		version: "1.0",

		defineStates: function () {
			var attendanceState = new Attendance.State({
				participants: this.options.participants,
				acceptNew: true,
				saveNew: false
			});

			var giverPlayState = new UltimatumGame.States.GiverPlay({
				config: this.config
			});

			var receiverPlayState = new UltimatumGame.States.ReceiverPlay({
				config: this.config
			});

			var resultsState = new UltimatumGame.States.Results({
				config: this.config
			});

			this.states = {
				"attendance": attendanceState,
				"giverPlay": giverPlayState,
				"receiverPlay": receiverPlayState,
				"results": resultsState
			};

			attendanceState.setNext(giverPlayState);
			giverPlayState.setNext(receiverPlayState);
			receiverPlayState.setNext(resultsState);
		},

		initialize: function () {
			StateApp.App.prototype.initialize.call(this);
		},

		handleConfigure: function () {
			this.currentState.handleConfigure();
			// redraw if results are active
			if (this.currentState === this.states.results) {
				this.currentState.render();
			} else if (this.currentState === this.states.giverPlay || this.currentState === this.states.receiverPlay) {
				this.currentState.render();
			}
		},

		transitions: {
				attendance_giverPlay: function () {
					// take output from attendance and use it in grid
				},

				giverPlay_attendance: function () {
					this.options.participants.fetch(); // reset the participants that attendance uses
				},

				giverPlay_receiverPlay: function () {

				},

				receiverPlay_results: function () {
				}
		}
	});


	return UltimatumGameApp;
});