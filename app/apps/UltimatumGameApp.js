/**

Ultimatum Game

Attendance -> Ultimatum Game Play -> Ultimatum Game Results

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
		this.config = _.extend({
			amount: 10,
			offerMap: {
				"A": 5,
				"B": 4,
				"C": 3,
				"D": 2,
				"E": 1
			},
			group1Name: "Givers",
			group2Name: "Receivers"
		}, this.options.config);
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

			var playState = new UltimatumGame.States.Play({
				config: this.config
			});

			var resultsState = new UltimatumGame.States.Results({
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
	  		}
		}
	});


  return UltimatumGameApp;
});