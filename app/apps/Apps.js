/**
	collection of all apps. Used by the router.
*/
define([
	"apps/GridApp",
	"apps/PrisonersDilemmaApp",
  "apps/PrisonersDilemmaMultiApp",
  "apps/NPrisonersDilemmaApp",
  "apps/TeamPrisonersDilemmaApp",
  "apps/UltimatumGameApp"
],
function (GridApp, PrisonersDilemmaApp, PrisonersDilemmaMultiApp, NPrisonersDilemmaApp,
	TeamPrisonersDilemmaApp, UltimatumGameApp) {
	var Apps = {
		"grid": GridApp.app,
		"pd": PrisonersDilemmaApp.app,
		"pdm": PrisonersDilemmaMultiApp.app,
		"npd": NPrisonersDilemmaApp.app,
		"teampd": TeamPrisonersDilemmaApp.app,
		"ultimatum": UltimatumGameApp.app
	};
	return Apps;
});