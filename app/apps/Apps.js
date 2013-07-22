/**
	collection of all apps. Used by the router.
*/
define([
	"apps/GridApp",
	"apps/PrisonersDilemmaApp",
  "apps/PrisonersDilemmaMultiApp",
  "apps/NPrisonersDilemmaApp",
  "apps/TeamPrisonersDilemmaApp",
  "apps/UltimatumGameApp",
  "apps/UltimatumGamePartitionedApp"
],
function (GridApp, PrisonersDilemmaApp, PrisonersDilemmaMultiApp, NPrisonersDilemmaApp,
	TeamPrisonersDilemmaApp, UltimatumGameApp, UltimatumGamePartitionedApp) {
	var Apps = {
		"grid": GridApp.app,
		"pd": PrisonersDilemmaApp.app,
		"pdm": PrisonersDilemmaMultiApp.app,
		"npd": NPrisonersDilemmaApp.app,
		"teampd": TeamPrisonersDilemmaApp.app,
		"ultimatum": UltimatumGameApp.app,
		"ultimatum-partitioned": UltimatumGamePartitionedApp.app
	};
	return Apps;
});