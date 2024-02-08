const AWS = require('aws-sdk');
const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.DYNAMODB_TABLE;

app.get('/todos/:id', async (req, res) => {
  const { id } = req.params;
  const params = {
    TableName: TABLE_NAME,
    Key: {
      id: id,
    },
  };

  try {
    const { Item } = await dynamoDb.get(params).promise();
    if (!Item) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    res.json({ todo: Item });
  } catch (error) {
    console.error('Error getting todo:', error);
    res.status(500).json({ error: 'Could not retrieve todo' });
  }
});

app.get('/todos', async (req, res) => {
  const params = {
    TableName: TABLE_NAME,
  };

  try {
    const { Items } = await dynamoDb.scan(params).promise();
    res.json({ todos: Items });
  } catch (error) {
    console.error('Error getting todos:', error);
    res.status(500).json({ error: 'Could not retrieve todos' });
  }
});

app.post('/todos', async (req, res) => {
  const { id, description } = req.body;

  const params = {
    TableName: TABLE_NAME,
    Item: {
      id: id,
      description: description,
    },
  };

  try {
    await dynamoDb.put(params).promise();
    res.json({ id, description });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Could not create todo' });
  }
});

app.put('/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  const params = {
    TableName: TABLE_NAME,
    Key: {
      id: id,
    },
    UpdateExpression: 'SET description = :description',
    ExpressionAttributeValues: {
      ':description': description,
    },
    ReturnValues: 'ALL_NEW',
  };

  try {
    const { Attributes } = await dynamoDb.update(params).promise();
    res.json({ id, description: Attributes.description });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Could not update todo' });
  }
});

app.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;

  const params = {
    TableName: TABLE_NAME,
    Key: {
      id: id,
    },
  };

  try {
    await dynamoDb.delete(params).promise();
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Could not delete todo' });
  }
});

module.exports.handler = serverless(app);
