const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3010;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/';
const DB_NAME = 'digital_academy';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
