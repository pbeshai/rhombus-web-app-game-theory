/**

Team Prisoner's Dilemma:

Attendance -> Team Prisoner's Dilemma Play -> Team Prisoner's Dilemam Results

*/
define([
  // Application.
  "app",

  "apps/StateApp",

  "modules/Participant",
  "modules/Attendance",
  "modules/TeamPrisonersDilemma"
],

function(app, StateApp, Participant, Attendance, TeamPrisonersDilemma) {

	/**
	 *  Team Prisoner's Dilemma App
	 */
	var TeamPrisonersDilemmaApp = function (options) {
		this.options = options || {};
		this.config = _.extend({}, TeamPrisonersDilemma.config, this.options.config);
		this.initialize();
	};
	// description for use in router
	TeamPrisonersDilemmaApp.app = {
		instantiate: function (router) {
			return new TeamPrisonersDilemmaApp({ participants: router.participants });
		},
		configView: TeamPrisonersDilemma.Views.Configure,
		title: "Team Prisoner's Dilemma"
	};

	TeamPrisonersDilemmaApp.prototype = new StateApp.App();
	_.extend(TeamPrisonersDilemmaApp.prototype, {
		version: "1.0",

		defineStates: function () {
			var attendanceState = new Attendance.State({
				participants: this.options.participants,
				acceptNew: true,
				saveNew: false
			});

			var playState = new TeamPrisonersDilemma.States.Play({
				config: this.config
			});

			var resultsState = new TeamPrisonersDilemma.States.Results({
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
				this.currentState.renderView();
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


  return TeamPrisonersDilemmaApp;
});