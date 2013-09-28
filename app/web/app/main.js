require([
  "framework/main",

  // Application.
  "framework/App",

  "/api/apps", // get the dynamically generated dependencies for apps
],

function (frameworkMain, App, Apps) {
  // load user applications
	App.registerApplications(Apps);

	if (frameworkMain) {
		frameworkMain();
	}
});
