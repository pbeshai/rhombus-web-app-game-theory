define([
	"framework/App",

	"apps/StagHunt/Base",
	"apps/StagHunt/Views",
	"apps/StagHunt/States",
],
function (App, Base, Views, States) {
	return _.extend({
		Views: Views,
		States: States
	}, Base);
});