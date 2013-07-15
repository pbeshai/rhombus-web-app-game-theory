/**
	collection of all apps. Used by the router.
*/
define([
	"apps/GridApp",
	"apps/PrisonersDilemmaApp",
  "apps/PrisonersDilemmaMultiApp",
  "apps/NPrisonersDilemmaApp",
  "apps/TeamPrisonersDilemmaApp"
],
function (GridApp, PrisonersDilemmaApp, PrisonersDilemmaMultiApp, NPrisonersDilemmaApp, TeamPrisonersDilemmaApp) {
	var Apps = {
		"grid": GridApp.app,
		"pd": PrisonersDilemmaApp.app,
		"pdm": PrisonersDilemmaMultiApp.app,
		"npd": NPrisonersDilemmaApp.app,
		"teampd": TeamPrisonersDilemmaApp.app
	};
	return Apps;
});