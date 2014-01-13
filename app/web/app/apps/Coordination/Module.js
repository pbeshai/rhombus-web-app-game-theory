/**

	Coordination Game for Peter Danielson's COGS 300 class

*/
define([
	// Application.
	"framework/App",

	"apps/Coordination/Base",
	"apps/Coordination/Views",
	"apps/Coordination/States",
],
function (App, Base, Views, States) {
	return _.extend({
		Views: Views,
		States: States
	}, Base);
});