define([
	"framework/App",

	"apps/Question/Base",
	"apps/Question/Views",
	"apps/Question/States",
],
function (App, Base, Views, States) {
	return _.extend({
		Views: Views,
		States: States
	}, Base);
});