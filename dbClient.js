require('dotenv').config()
const { MongoClient } = require('mongodb');

const uri = process.env.DATABASE; // Update with your MongoDB connection URI
const dbName = 'freshopure'; // Update with your database name

const client = new MongoClient(uri);

async function connect() {
  try {
    await client.connect();
    console.log('Connected to the database');
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

function getDatabase() {
  return client.db(dbName);
}

module.exports = {
  connect,
  getDatabase,
};