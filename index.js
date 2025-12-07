var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
var morgan = require("morgan");
var { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require('dotenv').config();

var app = express();
var port = process.env.PORT || 3000;

var uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

var client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

var db;
var lessonsCollection;
var ordersCollection;

async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db(process.env.DB_NAME || 'lavenderacademy');
    lessonsCollection = db.collection('lesson');
    ordersCollection = db.collection('order');
    console.log('Collections ready');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

connectDB();

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));
app.set('json spaces', 3);

app.use((req, res, next) => {
  console.log("In comes a request to: " + req.url);
  next();
});

// NEW - GET /lessons route
app.get('/lessons', async (req, res) => {
  try {
    var lessons = await lessonsCollection.find({}).toArray();
    console.log('Retrieved ' + lessons.length + ' lessons');
    res.json(lessons);
  } catch (err) {
    console.error('Error fetching lessons:', err);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// NEW - GET /lessons/:id route
app.get('/lessons/:id', async (req, res) => {
  try {
    var lesson = await lessonsCollection.findOne({_id: new ObjectId(req.params.id)});
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.json(lesson);
  } catch (err) {
    console.error('Error fetching lesson:', err);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});
// END NEW

app.listen(port, () => {
  console.log("Server is running on port " + port);
});