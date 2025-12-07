var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
var morgan = require("morgan");  // NEW

var app = express();
var port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));  // NEW
app.set('json spaces', 3);

// NEW
app.use((req, res, next) => {
  console.log("In comes a request to: " + req.url);
  next();
});

app.listen(port, () => {
  console.log("Server is running on port " + port);
});