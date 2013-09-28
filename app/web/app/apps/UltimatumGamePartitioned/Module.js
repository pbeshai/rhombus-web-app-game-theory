define([
	"framework/App",

	"apps/UltimatumGamePartitioned/Base",
	"apps/UltimatumGamePartitioned/Views",
	"apps/UltimatumGamePartitioned/States",
],
function (App, Base, Views, States) {
	return _.extend({
		Views: Views,
		States: States
	}, Base);
});