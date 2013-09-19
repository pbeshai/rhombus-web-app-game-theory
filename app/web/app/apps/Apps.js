/**
	collection of all apps. Used by the router.
*/
define([
	"framework/App",

	"framework/apps/GridApp",
	"apps/PrisonersDilemmaApp",
	"apps/PrisonersDilemmaMultiApp",
	"apps/NPrisonersDilemmaApp",
	"apps/TeamPrisonersDilemmaApp",
	"apps/UltimatumGameApp",
	"apps/UltimatumGamePartitionedApp",
	"apps/CoinMatchingApp",
	"apps/QuestionApp"
],
function (App, GridApp, PrisonersDilemmaApp, PrisonersDilemmaMultiApp, NPrisonersDilemmaApp,
	TeamPrisonersDilemmaApp, UltimatumGameApp, UltimatumGamePartitionedApp, CoinMatchingApp,
	QuestionApp) {

	var Apps = {
		"grid": GridApp.app,
		"pd": PrisonersDilemmaApp.app,
		"pdm": PrisonersDilemmaMultiApp.app,
		"npd": NPrisonersDilemmaApp.app,
		"teampd": TeamPrisonersDilemmaApp.app,
		"ultimatum": UltimatumGameApp.app,
		"ultimatum-partitioned": UltimatumGamePartitionedApp.app,
		"coin-matching": CoinMatchingApp.app,
		"q": QuestionApp.app
	};

	return Apps;
});