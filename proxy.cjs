const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/leetcode', async (req, res) => {
  try {
    console.log('➡️ Received request body:', req.body);

    const result = await axios.post('https://leetcode.com/graphql', req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
      },
    });

    res.json(result.data);
  } catch (err) {
    console.error('❌ Proxy request failed:', err.response?.data || err.message);
    res.status(500).json({ error: err.message, details: err.response?.data });
  }
});


app.listen(4000, () => {
  console.log('Proxy listening on http://localhost:4000');
});