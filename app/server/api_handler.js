module.exports = {
	initialize: initialize
};

var fs = require('fs'),
		_ = require('lodash');


function initialize(site) {
	site.get("/api/apps/q/sets", questionListSets);
	site.get("/api/apps/q/get/:set", questionGetSet);
}

function questionListSets(req, res) {
	fs.readdir("app/web/app/config/questions", function (err, files) {
		// match .yaml files and return an array without the extension
		var questionSets = _.chain(files)
			.filter(function (file) { return file.match(/\.yaml$/); })
			.map(function (file) { return file.slice(0, -5); })
			.value();
		res.send(200, { "question-sets": questionSets });
	});
}

function questionGetSet(req, res) {
	// read file
	var questionSet = req.params.set;
	if (questionSet[0] === "." || questionSet[0] === "/" || questionSet[0] === "\\") {
		res.send(404);
		return;
	}

	if (!fs.existsSync("app/web/app/config/questions/" + questionSet + ".yaml")) {
		res.send(404);
		return;
	}

	res.send(200, require("../web/app/config/questions/" + questionSet + ".yaml"));
}