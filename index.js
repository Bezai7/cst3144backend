var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
var morgan = require("morgan");
var path = require("path");  
var fs = require("fs");  
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

app.get('/search', async (req, res) => {
  var query = req.query.query;
  if (!query) {
    return res.status(400).json({ error: 'Need query parameter' });
  }
  
  try {
    var regex = new RegExp(query, 'i');
    var results = await lessonsCollection.find({
      $or: [
        { subject: { $regex: regex } },
        { location: { $regex: regex } },
        { price: { $regex: regex } },
        { spaces: { $regex: regex } }
      ]
    }).toArray();
    
    console.log('Search results:', results.length);
    res.json(results);
  } catch (err) {
    console.error('Error searching lessons:', err);
    res.status(500).json({ error: 'Failed to search lessons' });
  }
});

app.post('/order', async (req, res) => {
  var order = req.body;
  console.log('New order:', order);
  
  try {
    var result = await ordersCollection.insertOne(order);
    if (result.insertedId) {
      var newOrder = await ordersCollection.findOne({ _id: result.insertedId });
      res.status(201).json(newOrder);
    } else {
      res.status(500).json({ error: 'Failed to create order' });
    }
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.put('/lessons', async (req, res) => {
  var updates = req.body;
  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: 'Expected an array of updates' });
  }
  
  try {
    var operations = updates.map(update => {
      var updateFields = {};
      if (update.update) {
        updateFields = update.update;
      } else if (update.spaces !== undefined) {
        updateFields = { spaces: update.spaces };
      }
      
      return {
        updateOne: {
          filter: { _id: new ObjectId(update.id) },
          update: { $set: updateFields }
        }
      };
    });
    
    var result = await lessonsCollection.bulkWrite(operations);
    console.log('Bulk update result:', result.modifiedCount + ' lessons updated');
    res.json({ 
      message: 'Lessons updated successfully',
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    console.error('Error updating lessons:', err);
    res.status(500).json({ error: 'Failed to update lessons' });
  }
});


app.get('/images/:filename', (req, res) => {
  var imagesPath = path.join(__dirname, 'images');
  var filename = req.params.filename;
  var filePath = path.join(imagesPath, filename);
  
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.status(404).json({ error: 'Image file not found' });
    } else {
      res.sendFile(filePath, (sendErr) => {
        if (sendErr) {
          res.status(404).json({ error: 'Image file not found' });
        }
      });
    }
  });
});


app.use((req, res) => {
  res.status(404).json({ error: "Resource not found" });
});


app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'An error occurred' });
});


app.listen(port, () => {
  console.log("Server is running on port " + port);
});