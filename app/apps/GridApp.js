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
	var GridApp = StateApp.App.extend({
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

	// description for use in router
	GridApp.app = {
		instantiate: function (router) {
			var app = new GridApp({ participants: router.participants });
			return app;
		},
		configView: undefined,
		title: "Grid App"
	}

  return GridApp;
});