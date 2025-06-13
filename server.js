const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Health check
app.get('/health', (req, res) => {
  res.send('OK');
});

// ✅ Execute endpoint: called when journey executes the custom activity
app.post('/activity/execute', async (req, res) => {
  try {
    const clientId = '9pgjuv8byisnioxfbaqk820l';
    const clientSecret = 'NCjoZUctnI8jYIcvWPsYtUup';
    const accountId = '110007984';
    const authUrl = 'https://mc654h8rl6ypfygmq-qvwq3yrjrq.auth.marketingcloudapis.com/v2/token';
    const automationUrl = 'https://mc654h8rl6ypfygmq-qvwq3yrjrq.rest.marketingcloudapis.com/automation/v1/automations/key:a47dbac7-a8ba-4efc-973f-36a66f801890/actions/runallonce';

    // 🔐 Step 1: Authenticate
    const authResponse = await axios.post(authUrl, {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      account_id: accountId
    });

    const accessToken = authResponse.data.access_token;

    // 🚀 Step 2: Trigger the Automation
    const runResponse = await axios.post(
      automationUrl,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Automation Started:', runResponse.data);
    res.status(200).send({ status: 'success', message: 'Automation triggered successfully' });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    res.status(500).send({ status: 'error', message: 'Failed to trigger automation' });
  }
});

// ✅ Save config (called when saving inside Journey Builder UI)
app.post('/activity/save', (req, res) => {
  console.log('🔧 Save Called:', JSON.stringify(req.body, null, 2));
  res.status(200).send({ status: 'ok' });
});

// ✅ Publish journey (called when publishing the Journey)
app.post('/activity/publish', (req, res) => {
  console.log('🚀 Publish Called:', JSON.stringify(req.body, null, 2));
  res.status(200).send({ status: 'ok' });
});

// ✅ Validate config (called to validate before publishing)
app.post('/activity/validate', (req, res) => {
  console.log('✅ Validate Called:', JSON.stringify(req.body, null, 2));
  res.status(200).send({ status: 'ok' });
});

// ✅ Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
