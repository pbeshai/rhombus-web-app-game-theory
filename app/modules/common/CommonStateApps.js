define([
  "app",
  "apps/StateApp",
  "modules/Attendance",
  "modules/common/Common",
],
function(app, StateApp, Attendance, Common) {
  var CommonStateApps = {};

  CommonStateApps.BasicApp = StateApp.App.extend({
    stateOptions: undefined,
    States: null,
    prepend: { attendance: true },
    attendanceOptions: {
      acceptNew: true,
      saveNew: false
    },

    initialize: function () {
      this.prependStates = [];
      this.stateOptions || (this.stateOptions = []);
      StateApp.App.prototype.initialize.call(this);
    },

    defineStates: function () {
      this.states = {};
      // add in the prepend states

      this.definePrependStates();
      if (this.prependStates.length) {
        this.States = _.pluck(this.prependStates, "state").concat(this.States);
        this.stateOptions = _.pluck(this.prependStates, "options").concat(this.stateOptions);
      }

      this.defineMainStates();
    },

    definePrependStates: function () {
      // add in attendance unless false
      if (this.prepend.attendance) {
        var attendanceOptions = _.extend({ participants: this.get("participants") }, this.attendanceOptions)
        this.prependStates.push({ state: Attendance.State, options: attendanceOptions });
      }
    },

    defineMainStates: function () {
      _.each(this.States, function (State, i) {
        var state = new State(_.extend({ config: this.config }, this.stateOptions[i]), this);
        console.log("adding state", state.name);
        this.states["state-" + (i + 1)] = state;
        if (i > 0) {
          state.setPrev(this.states["state-" + i]);
        }
      }, this);
    },
  });

  // attendance -> play [-> play2 ... ]-> results
  CommonStateApps.BasicGame = CommonStateApps.BasicApp.extend({
    partnerOptions: undefined,
    botCheckOptions: undefined,
    groupOptions: undefined,
    prepend: { attendance: true, partner: true, botCheck: true, group: false },

    definePrependStates: function () {
      CommonStateApps.BasicApp.prototype.definePrependStates.call(this);

      if (this.prepend.botCheck) {
        this.prependStates.push({ state: Common.States.BotCheck, options: this.botCheckOptions });
      }

      if (this.prepend.partner) {
        this.prependStates.push({ state: Common.States.Partner, options: this.partnerOptions });
      }

      if (this.prepend.group) {
        this.prependStates.push({ state: Common.States.Group, options: this.groupOptions });
      }
    },
  });

  return CommonStateApps;
})