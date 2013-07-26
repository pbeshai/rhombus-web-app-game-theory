define([
  "app",
  "apps/StateApp",
  "modules/Attendance",
],
function(app, StateApp, Attendance) {
  var CommonStateApps = {};


  // attendance -> play [-> play2 ... ]-> results

  CommonStateApps.BasicGame = StateApp.App.extend({
    PlayStates: null,
    ResultsState: null,
    attendanceOptions: {
      acceptNew: true,
      saveNew: false
    },
    playOptions: undefined,
    resultsOptions: undefined,

    initialize: function () {
      this.playOptions || (this.playOptions = []);
      StateApp.App.prototype.initialize.call(this);
    },

    defineStates: function () {
      this.states = {};

      var attendanceState = new Attendance.State(_.extend({
          participants: this.options.participants
        }, this.attendanceOptions));
      this.states.attendance = attendanceState;

      var resultsState = new this.ResultsState(_.extend({
        config: this.config
      }, this.resultsOptions));
      this.states.results = resultsState;

      _.each(this.PlayStates, function (PlayState, i) {
        var state = new PlayState(_.extend({ config: this.config }, this.playOptions[i]));
        this.states["play" + (i + 1)] = state;
        if (i === 0) {
          state.setPrev(attendanceState)
        } else if (i > 0) {
          state.setPrev(this.states["play" + i]);
        }
        if (i === this.PlayStates.length - 1) {
          state.setNext(resultsState);
        }
        return state;
      }, this);

      if (this.states.play1) {
        attendanceState.setNext(this.states.play1);
      }
    },

    transitions: {
      play1_attendance: function () {
        // reset the participants that attendance uses
        this.options.participants.fetch();
      },
    }
  });

  return CommonStateApps;
})