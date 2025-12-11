const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3010;
const MONGO_URI = 'mongodb+srv://daniel_db_user:f7yRNqE4g9k2Xcri@cluster0.hcu3jpe.mongodb.net/?appName=Cluster0';
const DB_NAME = 'digital_academy';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}]: ${req.method} ${req.url}`);
  next();
});

let db;
const connectDB = async () => {
  try {
    const client = await MongoClient.connect(MONGO_URI);
    db = client.db(DB_NAME);
    console.log('✓ Connected to MongoDB');
  } catch (err) {
    console.error('✗ MongoDB connection failed:', err);
    process.exit(1);
  }
};

app.get('/lessons', async (req, res) => {
  try {
    const lessons = await db.collection('lessons').find({}).toArray();
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/checkout', async (req, res) => {
  try {
    const { customerName, customerPhone, cart } = req.body;
    
    // Validate customer info
    if (!customerName || !customerPhone) {
      throw new Error('Customer name and phone are required');
    }
    
    if (!cart || cart.length === 0) {
      throw new Error('Cart is empty');
    }
    
    const lessonsCol = db.collection('lessons');
    
    // Validate and update spaces in a transaction-like manner
    for (const item of cart) {
      const lesson = await lessonsCol.findOne({ title: item.topic }); // Changed to 'title'
      
      if (!lesson) throw new Error(`Lesson "${item.topic}" not found`);
      if (lesson.spaces < item.quantity) { // Changed 'space' to 'spaces'
        throw new Error(`Insufficient spaces for "${item.topic}"`);
      }
      
      await lessonsCol.updateOne(
        { title: item.topic }, // Changed to 'title'
        { $inc: { spaces: -item.quantity } } // Changed 'space' to 'spaces'
      );
    }
    
    // Store order with all customer info
    await db.collection('orders').insertOne({
      customerName,
      customerPhone,
      cart,
      orderDate: new Date()
    });
    
    res.json({ success: true, message: 'Order placed successfully' });
  } catch (err) {
    console.error('Checkout error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.put('/lessons/:id', async (req, res) => {
  try {
    const result = await db.collection('lessons').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    
    result.matchedCount > 0 
      ? res.json({ success: true }) 
      : res.status(404).json({ error: 'Lesson not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server after DB connection
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
  });
});
