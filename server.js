const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🔧 Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 📂 Serve static files (e.g., index.html, customActivity.js)
app.use(express.static(path.join(__dirname, 'public')));

// 🩺 Health check
app.get('/health', (req, res) => res.send('OK'));

// 🔐 Get Marketing Cloud access token
async function getAccessToken() {
  const authUrl = 'https://mc654h8rl6ypfygmq-qvwq3yrjrq.auth.marketingcloudapis.com/v2/token';
  const { CLIENT_ID, CLIENT_SECRET, ACCOUNT_ID } = process.env;

  const authResponse = await axios.post(authUrl, {
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    account_id: ACCOUNT_ID
  });

  return authResponse.data.access_token;
}

// 📦 GET all Automations
app.get('/automations', async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const response = await axios.get(
      'https://mc654h8rl6ypfygmq-qvwq3yrjrq.rest.marketingcloudapis.com/automation/v1/automations',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching automations:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch automations' });
  }
});

// 🚀 POST: Execute custom activity
app.post('/activity/execute', async (req, res) => {
  console.log('🔥 Execute called with payload:', JSON.stringify(req.body, null, 2));
  try {
    const inArgs = req.body?.inArguments?.reduce((acc, curr) => ({ ...acc, ...curr }), {}) || {};
    const { automationKey } = inArgs;

    if (!automationKey) {
      return res.status(400).json({ status: 'error', message: 'Automation key is missing.' });
    }

    const accessToken = await getAccessToken();
    const automationUrl = `https://mc654h8rl6ypfygmq-qvwq3yrjrq.rest.marketingcloudapis.com/automation/v1/automations/key:${automationKey}/actions/runallonce`;

    const triggerResponse = await axios.post(
      automationUrl,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Automation Triggered:', triggerResponse.data);
    res.status(200).json({ status: 'success', message: 'Automation triggered successfully' });
  } catch (error) {
    console.error('❌ Error triggering automation:', error.response?.data || error.message);
    res.status(500).json({ status: 'error', message: 'Failed to trigger automation' });
  }
});

// 📦 Lifecycle Events
app.post('/activity/save', (req, res) => res.status(200).json({ status: 'ok' }));
app.post('/activity/validate', (req, res) => res.status(200).json({ status: 'ok' }));
app.post('/activity/publish', (req, res) => res.status(200).json({ status: 'ok' }));
app.post('/activity/stop', (req, res) => res.status(200).json({ status: 'ok' }));

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
