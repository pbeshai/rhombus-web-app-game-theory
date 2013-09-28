define([
	"framework/App",

	"apps/UltimatumGame/Base",
	"apps/UltimatumGame/Views",
	"apps/UltimatumGame/States",
],
function (App, Base, Views, States) {
	return _.extend({
		Views: Views,
		States: States
	}, Base);
});