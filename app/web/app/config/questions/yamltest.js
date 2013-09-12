require('js-yaml');

// Get document, or throw exception on error
try {
  var doc = require('./post_game_questions.yaml');
  console.log(doc);
  console.log(doc.questions);
} catch (e) {
  console.log(e);
}