const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔧 Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 📂 Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// 🩺 Health check
app.get('/health', (req, res) => {
  res.send('OK');
});

// 🚀 Execute activity
app.post('/activity/execute', async (req, res) => {
  console.log('⚙️ Execute called:', JSON.stringify(req.body, null, 2));
  try {
    const inArgs = req.body?.inArguments?.reduce((acc, curr) => ({ ...acc, ...curr }), {}) || {};
    const { automationKey, email } = inArgs;

    if (!email) {
      console.log('❗Email is missing. Skipping automation trigger.');
      return res.status(200).json({ status: 'skipped', message: 'Email is missing. Skipped triggering automation.' });
    }

    if (!automationKey) {
      return res.status(400).json({ status: 'error', message: 'Automation key is missing.' });
    }

    // 🔐 Auth
    const clientId = '9pgjuv8byisnioxfbaqk820l';
    const clientSecret = 'NCjoZUctnI8jYIcvWPsYtUup';
    const accountId = '110007984';
    const authUrl = 'https://mc654h8rl6ypfygmq-qvwq3yrjrq.auth.marketingcloudapis.com/v2/token';
    const automationUrl = `https://mc654h8rl6ypfygmq-qvwq3yrjrq.rest.marketingcloudapis.com/automation/v1/automations/key:${automationKey}/actions/runallonce`;

    // 🪙 Get access token
    const authResponse = await axios.post(authUrl, {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      account_id: accountId
    });

    const accessToken = authResponse.data.access_token;

    // ▶️ Trigger automation
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

// 🔧 Activity lifecycle endpoints
app.post('/activity/save', (req, res) => {
  console.log('📝 Save called:', JSON.stringify(req.body, null, 2));
  res.status(200).json({ status: 'ok' });
});

app.post('/activity/validate', (req, res) => {
  console.log('🔎 Validate called:', JSON.stringify(req.body, null, 2));
  res.status(200).json({ status: 'ok' });
});

app.post('/activity/publish', (req, res) => {
  console.log('🚀 Publish called:', JSON.stringify(req.body, null, 2));
  res.status(200).json({ status: 'ok' });
});

// 🖥️ Start
app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
