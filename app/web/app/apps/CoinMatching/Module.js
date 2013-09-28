/**

	Coin Matching for Peter Danielson's COGS 300 class

*/
define([
	// Application.
	"framework/App",

	"apps/CoinMatching/Base",
	"apps/CoinMatching/Views",
	"apps/CoinMatching/States",
],
function (App, Base, Views, States) {
	return _.extend({
		Views: Views,
		States: States
	}, Base);
});