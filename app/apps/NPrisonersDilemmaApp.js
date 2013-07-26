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
		this.config = _.extend({}, NPrisonersDilemma.config, this.options.config);
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
	  		},

	  		play_attendance: function () {
				  this.options.participants.fetch(); // reset the participants that attendance uses
	  		},

	  		play_results: function () {
	  		}
		}
	});


  return NPrisonersDilemmaApp;
});