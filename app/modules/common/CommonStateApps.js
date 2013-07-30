define([
  "app",
  "apps/StateApp",
  "modules/Attendance",
],
function(app, StateApp, Attendance) {
  var CommonStateApps = {};

  CommonStateApps.BasicApp = StateApp.App.extend({
    attendanceOptions: {
      acceptNew: true,
      saveNew: false
    },

    defineStates: function () {
      this.states = {};

      var attendanceState = new Attendance.State(_.extend({
          participants: this.options.participants
        }, this.attendanceOptions));
      this.states.attendance = attendanceState;

      this.defineMainStates();
    },

    defineMainStates: function () { }
  });


  // attendance -> play [-> play2 ... ]-> results
  CommonStateApps.BasicGame = CommonStateApps.BasicApp.extend({
    PlayStates: null,
    ResultsState: null,
    playOptions: undefined,
    resultsOptions: undefined,

    initialize: function () {
      this.playOptions || (this.playOptions = []);
      CommonStateApps.BasicApp.prototype.initialize.call(this);
    },

    defineMainStates: function () {
      var resultsState = new this.ResultsState(_.extend({
        config: this.config
      }, this.resultsOptions));
      this.states.results = resultsState;


      _.each(this.PlayStates, function (PlayState, i) {
        var state = new PlayState(_.extend({ config: this.config }, this.playOptions[i]));

        // save the state as play1, play2, ... playn
        this.states["play" + (i + 1)] = state;
        if (i === 0) { // attendance -> play1
          state.setPrev(this.states.attendance)
        } else if (i > 0) { // playi -> playi+1
          state.setPrev(this.states["play" + i]);
        }
        if (i === this.PlayStates.length - 1) { // playn -> results
          state.setNext(resultsState);
        }
        return state;
      }, this);
    },
  });

  return CommonStateApps;
})