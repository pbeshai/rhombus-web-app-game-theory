/**
	collection of all apps. Used by the router.
*/
define([
	"framework/App",

	"apps/GridApp",
	"apps/PrisonersDilemmaApp",
	"apps/PrisonersDilemmaMultiApp",
	"apps/NPrisonersDilemmaApp",
	"apps/TeamPrisonersDilemmaApp",
	"apps/UltimatumGameApp",
	"apps/UltimatumGamePartitionedApp",
	"apps/CoinMatchingApp"
],
function (App, GridApp, PrisonersDilemmaApp, PrisonersDilemmaMultiApp, NPrisonersDilemmaApp,
	TeamPrisonersDilemmaApp, UltimatumGameApp, UltimatumGamePartitionedApp, CoinMatchingApp) {

	var Apps = {
		"grid": GridApp.app,
		"pd": PrisonersDilemmaApp.app,
		"pdm": PrisonersDilemmaMultiApp.app,
		"npd": NPrisonersDilemmaApp.app,
		"teampd": TeamPrisonersDilemmaApp.app,
		"ultimatum": UltimatumGameApp.app,
		"ultimatum-partitioned": UltimatumGamePartitionedApp.app,
		"coin-matching": CoinMatchingApp.app,
	};

	return Apps;
});