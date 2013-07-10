/**
	collection of all apps. Used by the router.
*/
define([
	"apps/GridApp",
	"apps/PrisonersDilemmaApp",
  "apps/PrisonersDilemmaMultiApp",
  "apps/NPrisonersDilemmaApp"
],
function (GridApp, PrisonersDilemmaApp, PrisonersDilemmaMultiApp, NPrisonersDilemmaApp) {
	var Apps = {
		"grid": GridApp.app,
		"pd": PrisonersDilemmaApp.app,
		"pdm": PrisonersDilemmaMultiApp.app,
		"npd": NPrisonersDilemmaApp.app
	};
	return Apps;
});