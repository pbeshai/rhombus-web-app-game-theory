/**

N-Person Prisoner's Dilemma:

Attendance -> N-Person Prisoner's Dilemma Play -> N-Person Prisoner's Dilemam Results

*/
define([
  // Application.
  "app",

  "apps/StateApp",

  "modules/Participant",
  "modules/Attendance",
  "modules/NPrisonersDilemma"
],

function(app, StateApp, Participant, Attendance, NPrisonersDilemma) {

	/**
	 *  Prisoner's Dilemma App
	 */
	var NPrisonersDilemmaApp = function (options) {
		this.options = options || {};
		this.config = _.extend({
			payoff: {
				// See Goehring and Kahan (1976) The Uniform N-Person Prisoner's Dilemma Game : Construction and Test of an Index of Cooperation
				Rratio: .10, // Rratio = R*(n-1). 0 < R < n-1, closer to 1 means more incentive for cooperation
				H: 10 // score increment when gaining 1 more cooperator
			}
		}, this.options.config);
		this.initialize();
	};
	// description for use in router
	NPrisonersDilemmaApp.app = {
		instantiate: function (router) {
			return new NPrisonersDilemmaApp({ participants: router.participants });
		},
		configView: NPrisonersDilemma.Views.Configure,
		title: "N-Person Prisoner's Dilemma"
	};

	NPrisonersDilemmaApp.prototype = new StateApp.App();
	_.extend(NPrisonersDilemmaApp.prototype, {
		version: "1.0",

		defineStates: function () {
			var attendanceState = new Attendance.State({
				participants: this.options.participants,
				acceptNew: true,
				saveNew: false
			});

			var playState = new NPrisonersDilemma.States.Play();

			var resultsState = new NPrisonersDilemma.States.Results({
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
			console.log("pd app initialize");
		},

		handleConfigure: function () {
			// redraw if results are active
			if (this.currentState === this.states.results) {
				this.currentState.render();
			}
		},

		transitions: {
	  		attendance_play: function () {
	  			// take output from attendance and use it in grid
					console.log("going from attendance to play");

	  		},

	  		play_attendance: function () {
				  console.log("going from play to attendance");
				  this.options.participants.fetch(); // reset the participants that attendance uses
	  		},

	  		play_results: function () {
	  			console.log("going from play to results");
	  		}
		}
	});


  return NPrisonersDilemmaApp;
});