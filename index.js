var express = require("express");
var cors = require("cors");  // NEW
var bodyParser = require("body-parser");  // NEW

var app = express();
var port = process.env.PORT || 3000;

app.use(cors());  // NEW
app.use(bodyParser.json());  // NEW
app.set('json spaces', 3);  // NEW

app.listen(port, () => {
  console.log("Server is running on port " + port);
});