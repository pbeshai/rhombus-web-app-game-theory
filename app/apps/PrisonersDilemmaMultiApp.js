/**

Multi-round Prisoner's Dilemma:

Attendance -> Prisoner's Dilemma Play -> Prisoner's Dilemma Results

play many rounds

*/
define([
  // Application.
  "app",

  "apps/StateApp",

  "modules/Participant",
  "modules/Attendance",
  "modules/PrisonersDilemma",
  "modules/PrisonersDilemmaMulti"
],

function(app, StateApp, Participant, Attendance, PrisonersDilemma, PrisonersDilemmaMulti) {
	var PrisonersDilemmaMultiApp = function (options) {
		this.options = options || {};
		this.config = _.extend({}, PrisonersDilemmaMulti.config, this.options.config);
		this.initialize();
	};
	// description for use in router
	PrisonersDilemmaMultiApp.app = {
		instantiate: function (router) {
			return new PrisonersDilemmaMultiApp({ participants: router.participants });
		},
		configView: PrisonersDilemmaMulti.Views.Configure,
		title: "Multiround Prisoner's Dilemma"
	};

	PrisonersDilemmaMultiApp.prototype = new StateApp.App();
	_.extend(PrisonersDilemmaMultiApp.prototype, {
		version: "1.0",

		defineStates: function () {
			var attendanceState = new Attendance.State({
				participants: this.options.participants,
				acceptNew: true,
				saveNew: false
			});

			var playState = new PrisonersDilemmaMulti.States.Play({
				config: this.config
			});
			var resultsState = new PrisonersDilemmaMulti.States.Results({
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
			}
		},

		transitions: {
	  		attendance_play: function (output) {
	  			if (output.length === 0) {
	  				this.options.participants.fetch();
	  				throw "Playing requires at least one participant.";
	  			}
		      this.config.numRounds = Math.round(Math.random() * (this.config.maxRounds - this.config.minRounds)) + this.config.minRounds;
		      output.pairModels();

					// for each participant, set the number of rounds left.
					output.each(function (participant) {
						if (participant.get("roundsLeft") === undefined) {
							var roundsLeft = this.config.numRounds;
							participant.set("roundsLeft", roundsLeft);
							participant.get("partner").set("roundsLeft", roundsLeft);
						}
					}, this);

					this.round = 1;
					this.config.gameOver = false;
					this.config.newRound = true;

		      // return output;
	  		},

	  		play_attendance: function () {
				  this.options.participants.fetch(); // reset the participants that attendance uses
	  		},

	  		play_results: function () {
	  			if (this.config.numRounds === this.round) { // if we've reached the final round
	  				this.config.gameOver = true;
	  			}
	  		},

	  		results_play: function (output) {
	  			output.each(function (participant) {
	  				participant.set("choice", undefined);
	  				if (participant.bot) {
	  					participant.delayedPlay();
	  				}
  					var roundsLeft = Math.max(0, participant.get("roundsLeft") - 1);
		        participant.set("roundsLeft", roundsLeft);
		        if (roundsLeft === 0) {
		          participant.set("complete", true);
		        }
	  			});
	  			if (this.config.numRounds > this.round) {
	  				this.round += 1;
	  				this.config.newRound = true;
	  			} else {
	  				this.config.newRound = false;
	  			}
	  		}
		}
	});


  return PrisonersDilemmaMultiApp;
});