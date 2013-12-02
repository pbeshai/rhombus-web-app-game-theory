module.exports = {
	initialize: initialize
};

var fs = require('fs'),
	_ = require('lodash'),
	logger = require("../../log/logger");

function initialize(site) {
	site.post("/api/apps/pd/log", pdResults);
	site.post("/api/apps/pdm/log", pdmResults);
	site.post("/api/apps/pdn/log", pdnResults);
	site.post("/api/apps/pdteam/log", pdteamResults);
	site.post("/api/apps/ultimatum/log", ultimatumResults);
	site.post("/api/apps/coin-matching/log", coinMatchingResults);
	site.post("/api/apps/stag-hunt/log", stagHuntResults);
	site.post("/api/apps/q/log", questionResults);
}


function z(str) { // add leading zero
	return ("0"+str).slice(-2);
}

function filenameFormat(date) {
	return date.getFullYear()+z(date.getMonth()+1)+z(date.getDate())+"_"+z(date.getHours())+z(date.getMinutes())+z(date.getSeconds());
}


function pdResults(req, res) {
	var now = new Date();
	var results = req.body.results;
	var config = req.body.config;
	var version = req.body.version;

	var stream = fs.createWriteStream("log/pd/results." + filenameFormat(now) + ".csv");

	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output("Prisoner's Dilemma Results (v" + version + ")");
		output(now.toString());
		if (config.message) {
			output(config.message);
		}
		if (config.scoringMatrix) {
			output("CC," + config.scoringMatrix.CC + ",CD," + config.scoringMatrix.CD);
			output("DC," + config.scoringMatrix.DC + ",DD," + config.scoringMatrix.DD);
		}

		output("Alias,Choice,Payoff,PartnerAlias,PartnerChoice,PartnerPayoff");
		_.each(results, function (result) {
			output(result.alias + "," + result.choice + "," + result.score + "," + result.partner.alias + "," + result.partner.choice + "," + result.partner.score);
		});
		stream.end();
	});
	res.send(200);
}

function phaseMatrixResults(req, res, appDir, appName, numPhases, choiceMap) {
	var now = new Date();
	var config = req.body.config;
	var version = req.body.version;
	var roundsPerPhase = config.roundsPerPhase || config.numRepeats;

	var flags = req.body.flags;

	if (flags && flags.round) {
		roundResults(req, res, appDir, appName, choiceMap, participantDataFromRounds);
		return;
	}

	var stream = fs.createWriteStream("log/" +appDir + "/results." + filenameFormat(now) + ".csv");
	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output(appName + " Results (v" + version + ")");
		output(now.toString());

		if (config.message) {
			output(config.message);
		}

		output(numPhases + " phases, " + roundsPerPhase + " rounds per phase");

		if (config.scoringMatrix) {
			output("");
			output("Scoring Matrix");
			_.each(_.keys(config.scoringMatrix), function (key) {
				output(key + "," + config.scoringMatrix[key]);
			});
		}

		output("");
		if (choiceMap) {
			output("Choice Map");
			output(_.map(_.keys(choiceMap), function (key) { return key + " -> " + choiceMap[key]; }).join(","));
		}

		var totals = {};

		for (var i = 0; i < numPhases; i++) {
			outputPhase(i + 1);
		}

		// output totals
		output("");
		output("");
		output("Totals");
		output("======");
		var header = "Alias";
		if (numPhases > 1) {
			for (i = 0; i < numPhases; i++) {
				header += ",Phase" + (i + 1) + "Total";
			}
		}

		header += ",OverallTotal";
		output(header);

		_.each(_.keys(totals), function (alias) {
			var data = alias;
			if (numPhases > 1) {
				for (var i = 0; i < numPhases; i++) {
					data += "," + totals[alias]["phase" + (i + 1)];
				}
			}
			data += "," + totals[alias].total;

			output(data);
		});

		function outputPhase(phaseNum) {
			var phase = req.body["phase" + phaseNum];
			if (phase == null) return;

			var pconfig = phase.config;

			output("");
			output("Phase " + phaseNum);
			output("-------");
			var r, header = "Alias";
			for (r = 1; r <= roundsPerPhase; r++) {
				header += ",P" + phaseNum + "R" + r + "Choice,P" + phaseNum + "R" + r + "Score,P" + phaseNum + "R" + r + "Partner";
			}
			header += ",P" + phaseNum + "Total";
			output(header);

			// use last round of phase to catch as many latecomers as possible
			if (!phase.results) return;
			_.each(phase.results[phase.results.length - 1], function (participant, i) {
				var data = participant.alias;
				var choice, partner;
				var phaseTotal = 0;

				var matchAlias = function (p) { return p.alias === participant.alias; };
				// for each round
				for (r = 0; r < roundsPerPhase; r++) {
					// may not match index in different rounds if a bot drops out in a phase or somebody is added, so look up by alias
					roundData = _.find(phase.results[r], matchAlias);

					if (roundData) {
						choice = choiceMap[roundData.choice];
						score = roundData.score;
						partner = roundData.partner;
					}	else {
						choice = "X"; // missing (e.g. they were late and didn't play)
						score = 0;
						partner = "X";
					}
					data += "," + choice + "," + score + "," + partner;
					phaseTotal += parseInt(score, 10);
				}

				data += "," + phaseTotal;

				if (totals[participant.alias] === undefined) {
					totals[participant.alias] = {};
				}
				totals[participant.alias]["phase" + phaseNum] = phaseTotal;
				totals[participant.alias].total = (totals[participant.alias].total || 0) + phaseTotal;
				output(data);
			});
		}

		stream.end();
	});

	res.send(200);
}

function participantDataFromRounds(roundOutputs) {
	var participantData = {}; // collect the data by participant to make it easier to work with
	var r, i, participant, roundData;
	var numRounds = 1 + ((roundOutputs.previous === undefined) ? 0 : roundOutputs.previous.length);

	for (r = 1; r <= numRounds; r++) {
		if (r === numRounds) {
			roundData = roundOutputs.current;
		} else {
			roundData = roundOutputs.previous[r - 1];
		}

		// add to the participant data
		for (i = 0; i < roundData.length; i++) {
			participant = roundData[i];
			if (participantData[participant.alias] === undefined) {
				participantData[participant.alias] = [];
			}
			participantData[participant.alias][r - 1] = participant; // save the data for this round
		}
	}

	return participantData;
}

function participantDataFromRoundsGrouped(roundOutputs) {
	var participantData = {}; // collect the data by participant to make it easier to work with
	var r, i, participant, roundData;
	var numRounds = 1 + ((roundOutputs.previous === undefined) ? 0 : roundOutputs.previous.length);

	for (r = 1; r <= numRounds; r++) {
		if (r === numRounds) {
			roundData = roundOutputs.current;
		} else {
			roundData = roundOutputs.previous[r - 1];
		}

		// add to the participant data
		if (roundData.group1) {
			for (i = 0; i < roundData.group1.length; i++) {
				participant = roundData.group1[i];
				participant._group = 1;
				if (participantData[participant.alias] === undefined) {
					participantData[participant.alias] = [];
				}
				participantData[participant.alias][r - 1] = participant; // save the data for this round
			}
		}
		if (roundData.group2) {
			for (i = 0; i < roundData.group2.length; i++) {
				participant = roundData.group2[i];
				participant._group = 2;
				if (participantData[participant.alias] === undefined) {
					participantData[participant.alias] = [];
				}
				participantData[participant.alias][r - 1] = participant; // save the data for this round
			}
		}
	}

	return participantData;
}

function capitalize(str) {
	if (str) {
		return str[0].toUpperCase() + str.substring(1)
	}
	return str;
}

// used for intermediate logging after each round
function roundResults(req, res, appDir, appName, choiceMap, participantDataFunc, grouped, participantAttributes) {
	var now = new Date();
	var roundOutputs = req.body.roundOutputs; // { current, phase, previous }
	var config = req.body.config;
	var version = req.body.version;
	var roundsPerPhase = config.roundsPerPhase || config.numRepeats;
	participantAttributes = participantAttributes || [ "choice", "score", "partner" ];
	console.log("RR");
	var stream = fs.createWriteStream("log/" +appDir + "/rounds/round_results." + filenameFormat(now) + ".csv");
	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output(appName + " Intermediate Round Results (v" + version + ")");
		output(now.toString());

		if (config.message) {
			output(config.message);
		}

		output("Phase," + roundOutputs.phase);
		var numRounds = 1 + ((roundOutputs.previous === undefined) ? 0 : roundOutputs.previous.length);
		output("Rounds completed," + numRounds);
		output(roundsPerPhase + " rounds per phase");

		if (config.scoringMatrix) {
			output("");
			output("Scoring Matrix");
			_.each(_.keys(config.scoringMatrix), function (key) {
				output(key + "," + config.scoringMatrix[key]);
			});
		}

		if (choiceMap) {
			output("");
			output("Choice Map");
			output(_.map(_.keys(choiceMap), function (key) { return key + " -> " + choiceMap[key]; }).join(","));
		}

		output("");

		// collect the data by participant to make it easier to work with
		var participantData = participantDataFunc(roundOutputs);
		var r, i;
		var header = "Alias";

		if (grouped) {
			header = "Team," + header;
		}
		for (r = 1; r <= numRounds; r++) {
			for (i = 0; i < participantAttributes.length; i++) {
				header += ",R" + r + capitalize(participantAttributes[i]);
			}
		}

		output(header);

		_.each(_.keys(participantData), function (alias) {
			var data, choice, score, partner;
			var participant = participantData[alias];
			var addedGroup = false;
			var roundData, attr, value;
			data = alias;
			for (r = 1; r <= numRounds; r++) {
				roundData = participant[r - 1];

				if (roundData) {
					if (grouped && !addedGroup) {
						data = "Team " + roundData._group + "," + data;
						addedGroup = true;
					}

					for (i = 0; i < participantAttributes.length; i++) {
						attr = participantAttributes[i];
						value = roundData[attr];

						if (attr === "choice") {
							value = choiceMap[value];
						}
						data += "," + value;
					}
				}	else {
					for (i = 0; i < participantAttributes.length; i++) {
						// missing (e.g. they were late and didn't play)
						attr = participantAttributes[i];
						value = "X";

						if (attr === "score") {
							value = 0;
						}
						data += "," + value;
					}
				}
			}

			if (grouped && !addedGroup) { // team was unknown (shouldn't happen)
				data = "," + data;
			}
			output(data);
		});


	});

	res.send(200);
}

function pdmResults(req, res) {
	var numPhases = 1;
	var choiceMap = {
		"C" : "C",
		"D" : "D"
	};

	phaseMatrixResults(req, res, "pdm", "Prisoner's Dilemma (multiround)", numPhases, choiceMap);

	return;
}

function pdnResults(req, res) {
	var now = new Date();
	var results = req.body.results;
	var config = req.body.config;
	var version = req.body.version;
	var payoff = req.body.payoff;
	var N = (payoff !== undefined) ? (parseInt(payoff.numCooperators, 10) + parseInt(payoff.numDefectors, 10)) : 0;

	var stream = fs.createWriteStream("log/pdn/results." + filenameFormat(now) + ".csv");
	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output("N-Person Prisoner's Dilemma Results (v" + version + ")");
		output(now.toString());
		if (config.message) {
			output(config.message);
		}
		if (config.Rratio) {
			output("Rratio," + config.Rratio + ",R,"+ (config.Rratio*(N-1)).toFixed(2));
		}
		if (config.H) {
			output("H," + config.H);
		}

		if (payoff) {
			output("N," + N);
			output("Cooperator Payoff," + payoff.cooperatorPayoff + ",# Cooperators," + payoff.numCooperators);
			output("Defector Payoff," + payoff.defectorPayoff + ",# Defectors," + payoff.numDefectors);
			output("Total Payoff," + payoff.totalPayoff);
			output("Max Possible Total Payoff," + payoff.maxPayoff);
		}

		output("Alias,Choice,Payoff");
		_.each(results, function (result) {
			output(result.alias + "," + result.choice + "," + result.score);
		});
		stream.end();
	});

	res.send(200);
}


function ultimatumResults(req, res) {
	var now = new Date();
	var results = req.body.results;
	var config = req.body.config;
	var version = req.body.version;

	var flags = req.body.flags;

	if (flags && flags.round) {
		console.log("ROUND");
		roundResults(req, res, "ultimatum", "Ultimatum Game", null, participantDataFromRounds, false,
			[ "giverOffer", "giverScore", "giverPartner", "receiverOffer", "receiverScore", "receiverPartner"]);
		return;
	}

	var numPhases = 3;
	var offerMap = config.offerMap;
	var totals = {};

	var stream = fs.createWriteStream("log/ultimatum/results." + filenameFormat(now) + ".csv");
	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output("Ultimatum Game Results (v" + version + ")");
		output(now.toString());
		if (config.message) {
			output(config.message);
		}
		output("Total Amount," + config.amount);
		output("Offer Map," + _.map(_.keys(offerMap), function (key) { return key + ":" + offerMap[key]; }).join(","));
		output("");

		// output results for each phase
		for (var i = 0 ; i < numPhases; i++) {
			outputPhase(i + 1);
		}

		// output totals
		output("");
		output("");
		output("Totals");
		output("======");
		var header = "Alias";
		for (i = 0; i < numPhases; i++) {
			header += ",Phase" + (i + 1) + "Total";
		}
		header += ",OverallTotal";
		output(header);

		_.each(_.keys(totals), function (alias) {
			var data = alias;
			for (var i = 0; i < numPhases; i++) {
				data += "," + (totals[alias]["phase" + (i + 1)] || 0);
			}
			data += "," + (totals[alias].total || 0);

			output(data);
		});


		function outputPhase(phaseNum) {
			var phase = req.body["phase" + phaseNum];

			output("");
			output("Phase " + phaseNum);
			output("-------");


			// output for each round
			var header = "Alias";
			for (var r = 1; r <= config.roundsPerPhase; r++) {
				header += ",P"+phaseNum+"R"+r+"GiverDemand,P"+phaseNum+"R"+r+"GiverScore,P"+phaseNum+"R"+r+"GiverPartner,P" +
									phaseNum+"R"+r+"ReceiverOffer,P"+phaseNum+"R"+r+"ReceiverScore,P"+phaseNum+"R"+r+"ReceiverPartner";
			}
			header += ",P"+phaseNum+"Total";
			output(header);



			// use last round of phase to catch as many latecomers as possible
			_.each(phase.results[phase.results.length - 1], function (participant, i) {
				var data = participant.alias;
				var giverOffer, giverScore, giverPartner, receiverOffer, receiverScore, receiverPartner;
				var phaseTotal = 0;

				var matchAlias = function (p) { return p.alias === participant.alias; };
				// for each round
				for (r = 0; r < config.roundsPerPhase; r++) {
					// may not match index in different rounds if a bot drops out in a phase or somebody is added, so look up by alias
					roundData = _.find(phase.results[r], matchAlias);

					if (roundData) {
						giverOffer = roundData.giverOffer;
						giverScore = roundData.giverScore;
						giverPartner = roundData.giverPartner;
						receiverOffer = roundData.receiverOffer;
						receiverScore = roundData.receiverScore;
						receiverPartner = roundData.receiverPartner;
					}	else { // missing (e.g. they were late and didn't play)
						giverOffer = "X";
						giverScore = 0;
						giverPartner = "X";
						receiverOffer = "X";
						receiverScore = 0;
						receiverPartner = "X";
					}
					data += "," + giverOffer + "," + giverScore + "," + giverPartner +
						"," + receiverOffer + "," + receiverScore + "," + receiverPartner;
					phaseTotal += parseInt(giverScore, 10) + parseInt(receiverScore, 10);
				}

				data += "," + phaseTotal;

				if (totals[participant.alias] === undefined) {
					totals[participant.alias] = {};
				}
				totals[participant.alias]["phase" + phaseNum] = phaseTotal;
				totals[participant.alias].total = (totals[participant.alias].total || 0) + phaseTotal;
				output(data);
			});
		}

		// output the totals

		stream.end();
	});

	res.send(200);
}


function coinMatchingResults(req, res) {
	var numPhases = 3;
	var choiceMap = {
		A: "H",
		B: "T",
	};

	teamPhaseMatrixResults(req, res, "stag-hunt", "Stag Hunt", numPhases, choiceMap);
}


function stagHuntResults(req, res) {
	var numPhases = 3;
	var choiceMap = {
		A: "S",
		B: "H",
	};

	teamPhaseMatrixResults(req, res, "stag-hunt", "Stag Hunt", numPhases, choiceMap);
}

function pdteamResults(req, res) {
	var numPhases = 3;
	var choiceMap = {
		C: "C",
		D: "D",
	};

	teamPhaseMatrixResults(req, res, "pdteam", "Prisoner's Dilemma (team)", numPhases, choiceMap);
}

function teamPhaseMatrixResults(req, res, appDir, appName, numPhases, choiceMap) {
	var now = new Date();
	var config = req.body.config;
	var version = req.body.version;

	var flags = req.body.flags;

	if (flags && flags.round) {
		roundResults(req, res, appDir, appName, choiceMap, participantDataFromRoundsGrouped, true);
		return;
	}


	var stream = fs.createWriteStream("log/" +appDir + "/results." + filenameFormat(now) + ".csv");
	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output(appName + " Results (v" + version + ")");
		output(now.toString());

		if (config.message) {
			output(config.message);
		}

		output(numPhases + " phases, " + config.roundsPerPhase + " rounds per phase");

		if (config.scoringMatrix) {
			output("");
			output("Scoring Matrix");
			_.each(_.keys(config.scoringMatrix), function (key) {
				output(key + "," + config.scoringMatrix[key]);
			});
		}

		output("");
		if (choiceMap) {
			output("Choice Map");
			output(_.map(_.keys(choiceMap), function (key) { return key + " -> " + choiceMap[key]; }).join(","));
		}

		var totals = {};

		for (var i = 0; i < numPhases; i++) {
			outputPhase(i + 1);
		}

		// output totals
		output("");
		output("");
		output("Totals");
		output("======");
		var header = "Alias";
		for (i = 0; i < numPhases; i++) {
			header += ",Phase" + (i + 1) + "Total";
		}
		header += ",OverallTotal";
		output(header);

		_.each(_.keys(totals), function (alias) {
			var data = alias;
			for (var i = 0; i < numPhases; i++) {
				data += "," + (totals[alias]["phase" + (i + 1)] || 0);
			}
			data += "," + (totals[alias].total || 0);

			output(data);
		});

		function outputPhase(phaseNum) {
			var phase = req.body["phase" + phaseNum];
			if (phase == null) return;

			var pconfig = phase.config;
			pconfig.group1Name = pconfig.group1Name || "Group 1";
			pconfig.group2Name = pconfig.group2Name || "Group 2";
			if (pconfig.group1NameSuffix) {
				pconfig.group1Name = pconfig.group1Name + " - " + pconfig.group1NameSuffix;
			}
			if (pconfig.group2NameSuffix) {
				pconfig.group2Name = pconfig.group2Name + " - " + pconfig.group2NameSuffix;
			}

			var groupNames = [ pconfig.group1Name, pconfig.group2Name ];


			output("");
			output("Phase " + phaseNum +"," + groupNames[0] + "," + groupNames[1]);
			output("-------");
			var r, header = "Team,Alias";
			for (r = 1; r <= config.roundsPerPhase; r++) {
				header += ",P" + phaseNum + "R" + r + "Choice,P" + phaseNum + "R" + r + "Score,P" + phaseNum + "R" + r + "Partner";
			}
			header += ",P" + phaseNum + "Total";


			output(header);

			outputGroup(1);
			outputGroup(2);

			// for each participant, output choices and scores from each round in each phase
			function outputGroup(groupNum) {
				// use last round of phase to catch as many latecomers as possible
				_.each(phase.results[phase.results.length - 1]["group" + groupNum], function (participant, i) {
					var data = groupNames[groupNum - 1] + "," + participant.alias;
					var choice, partner;
					var phaseTotal = 0;

					var matchAlias = function (p) { return p.alias === participant.alias; };
					// for each round
					for (r = 0; r < config.roundsPerPhase; r++) {
						// may not match index in different rounds if a bot drops out in a phase or somebody is added, so look up by alias
						roundData = _.find(phase.results[r]["group" + groupNum], matchAlias);

						if (roundData) {
							choice = choiceMap[roundData.choice] || "#";
							score = roundData.score;
							partner = roundData.partner;
						}	else {
							choice = "X"; // missing (e.g. they were late and didn't play)
							score = 0;
							partner = "X";
						}
						data += "," + choice + "," + score + "," + partner;
						phaseTotal += parseInt(score, 10);
					}

					data += "," + phaseTotal;

					if (totals[participant.alias] === undefined) {
						totals[participant.alias] = {};
					}
					totals[participant.alias]["phase" + phaseNum] = phaseTotal;
					totals[participant.alias].total = (totals[participant.alias].total || 0) + phaseTotal;
					output(data);
				});
			}
		}

		stream.end();
	});

	res.send(200);
}


function questionResults(req, res) {
	var now = new Date();
	var results = req.body.results;
	var config = req.body.config;
	var version = req.body.version;
	var questions = config.questions;
	if (!questions) {
		logger.warn("log Questions with no questions.");
		res.send(200);
		return;
	}

	var stream = fs.createWriteStream("log/q/results." + filenameFormat(now) + ".csv");
	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output("Question Results (v" + version + ")");
		output(now.toString());
		if (config.message) {
			output(config.message);
		}

		var allResults = {};
		var allAnswerCounts = [];
		// output each question
		_.each(questions, function (q, i) {
			output("");
			output("");
			output("Question " + (i + 1) + "," + q.question);
			output("-----------");

			var results = req.body["question " + (i + 1)];
			var answerCount = { A: 0, B: 0, C: 0, D: 0, E: 0 };
			_.each(results, function (result) {
				answerCount[result.choice] = (answerCount[result.choice] || 0) + 1;
			});
			allAnswerCounts.push(answerCount);

			// output answers and counts
			output("");
			output("Count,Answer");
			_.each(_.keys(q.answers), function (key) {
				output((answerCount[key] || 0) + "," + key + " - " + q.answers[key]);
			});

			// output results
			output("");
			output("Alias,Answer");
			_.each(results, function (result) {
				output(result.alias + "," + result.choice);

				// save for summary
				if (allResults[result.alias] === undefined) {
					allResults[result.alias] = [];
				}
				allResults[result.alias][i] = result.choice;
			});
		});

		output("");
		output("");
		output("Alias Summary Table");
		output("-------------------");
		var header = "Alias";
		_.each(questions, function (q, i) {
			header += ",Q" + (i + 1);
		});
		output(header)
		_.each(_.keys(allResults), function (alias) {
			output(alias + "," + allResults[alias].join(","));
		});

		output("");
		output("");
		output("Question Summary Table");
		output("----------------------");
		output("#,Question,A,B,C,D,E");
		_.each(questions, function (q, i) {
			output((i + 1) + "," + q.question + "," + _.values(allAnswerCounts[i]).join(","))
		});

		stream.end();
	});

	res.send(200);
}