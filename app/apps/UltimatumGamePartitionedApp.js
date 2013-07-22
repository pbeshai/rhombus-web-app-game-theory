/**

Ultimatum Game (Partitioned)

Attendance -> Ultimatum Game Play -> Ultimatum Game Results

*/
define([
	// Application.
	"app",

	"apps/StateApp",

	"modules/Participant",
	"modules/Attendance",
	"modules/UltimatumGamePartitioned"
],

function(app, StateApp, Participant, Attendance, UltimatumGamePartitioned) {

	/**
	 *  Team Prisoner's Dilemma App
	 */
	var UltimatumGamePartitionedApp = function (options) {
		this.options = options || {};
		this.config = _.extend({}, UltimatumGamePartitioned.config, this.options.config);
		this.initialize();
	};
	// description for use in router
	UltimatumGamePartitionedApp.app = {
		instantiate: function (router) {
			return new UltimatumGamePartitionedApp({ participants: router.participants });
		},
		configView: UltimatumGamePartitioned.Views.Configure,
		title: "Ultimatum Game"
	};

	UltimatumGamePartitionedApp.prototype = new StateApp.App();
	_.extend(UltimatumGamePartitionedApp.prototype, {
		version: "1.0",

		defineStates: function () {
			var attendanceState = new Attendance.State({
				participants: this.options.participants,
				acceptNew: true,
				saveNew: false
			});

			var giverPlayState = new UltimatumGamePartitioned.States.GiverPlay({
				config: this.config
			});

			var receiverPlayState = new UltimatumGamePartitioned.States.ReceiverPlay({
				config: this.config
			});

			var resultsState = new UltimatumGamePartitioned.States.Results({
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
			// redraw if results are active
			if (this.currentState === this.states.results) {
				this.currentState.render();
			} else if (this.currentState === this.states.play) {
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


	return UltimatumGamePartitionedApp;
});