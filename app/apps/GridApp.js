/**

	Simple App for testing. Goes from Attendance -> Grid view.

*/
define([
  // Application.
  "app",

  "apps/StateApp",

  "modules/Participant",
  "modules/Attendance",
  "modules/Grid"
],

function(app, StateApp, Participant, Attendance, Grid) {

	/**
	 *  Grid App
	 */
	var GridApp = function (options) {
		this.options = options;
		this.initialize();
	};
	GridApp.app = {
		instantiate: function (router) {
			return new GridApp({ participants: router.participants });
		},
		configView: undefined,
		title: "Grid App"
	}
	GridApp.prototype = new StateApp.App();
	_.extend(GridApp.prototype, {
		defineStates: function () {
			console.log("define states");
			var attendanceState = new Attendance.State({
				participants: this.options.participants,
				acceptNew: true
			});
			var gridState = new Grid.State({
				participants: this.options.participants
			});

			this.states = {
		  	"attendance": attendanceState,
		  	"grid": gridState
	  	};

			attendanceState.setNext(gridState);
		},

		initialize: function () {
			StateApp.App.prototype.initialize.call(this);
			console.log("grid app initialize");
		},

		transitions: {
	  		attendance_grid: function () {
	  			console.log("going from attendance to grid");
	  		},

	  		grid_attendance: function () {
				  console.log("going from grid to attendance");
				  this.options.participants.fetch();
	  		}
		}
	});


  return GridApp;
});