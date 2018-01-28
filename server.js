const path = require('path');
const express = require('express');

const app = express();
// Run the app by serving the static files
// in the dist directory
app.use(express.static(__dirname + '/public'));
// Start the app by listening on the default
// Heroku port

app.use("*", function (req, res) {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(process.env.PORT || 8080);
