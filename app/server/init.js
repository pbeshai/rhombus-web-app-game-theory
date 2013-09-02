module.exports = {
	webInit: webInit,
	webSocketInit: webSocketInit
};

var fs = require("fs"),
		fwInit = require("../../framework/server/init");


// function to do extra initialization before starting web server
function webInit(site, options) {
	console.log("app webInit");
	console.log("initializing app_results");
	require("./app_results").initialize(site, options);

	fwInit.webInit(site, options);

}

// function to do extra initialization after listening with websocket
function webSocketInit(io, options) {
	console.log("app webSocketInit");
	io.set('log level', 1); // reduces logging.
	fwInit.webSocketInit(io, options);
}