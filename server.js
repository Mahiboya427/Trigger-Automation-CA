// 🌐 External Modules
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// 🏁 Initialize App
const app = express();
const PORT = process.env.PORT || 3000;

// 🛡️ Deduplication Map (in-memory — use Redis/db for production)
const deduplicationMap = new Map();

// 🔧 Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 📂 Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// 🌍 Root Route (REQUIRED for Azure ping check)
app.get('/', (req, res) => {
  res.send('✅ SFMC Automation Trigger is running!');
});

// 🩺 Health Check
app.get('/health', (req, res) => res.send('OK'));

// 🔐 Get Access Token from SFMC
async function getAccessToken() {
  const { CLIENT_ID, CLIENT_SECRET, ACCOUNT_ID } = process.env;
  const authUrl = 'https://mc654h8rl6ypfygmq-qvwq3yrjrq.auth.marketingcloudapis.com/v2/token';

  const response = await axios.post(authUrl, {
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    account_id: ACCOUNT_ID
  });

  return response.data.access_token;
}

// 📝 Log to Data Extension
async function logToDataExtension({ contactKey, automationKey, status, errorMessage, activityId, definitionInstanceId }) {
  try {
    const accessToken = await getAccessToken();

    const payload = {
      items: [
        {
          LogID: uuidv4(),
          ContactKey: contactKey || '',
          AutomationKey: automationKey || '',
          TriggerTime: new Date().toISOString(),
          Status: status,
          ErrorMessage: errorMessage || '',
          ActivityId: activityId || '',
          DefinitionInstanceId: definitionInstanceId || ''
        }
      ]
    };

    await axios.post(
      'https://mc654h8rl6ypfygmq-qvwq3yrjrq.rest.marketingcloudapis.com/data/v1/async/dataextensions/key:69DE292E-4D00-44E3-AD84-01AE5CC68CF4/rows',
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (err) {
    console.error('📛 Logging to DE failed:', err.response?.data || err.message);
  }
}

// 📦 Fetch All Automations
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
    console.error('❌ Error fetching automations:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch automations' });
  }
});

// 🚀 Execute Custom Activity
app.post('/activity/execute', async (req, res) => {
  console.log('🔥 Execute called with payload:', JSON.stringify(req.body, null, 2));

  const inArgs = req.body?.inArguments?.reduce((acc, curr) => ({ ...acc, ...curr }), {}) || {};
  const contactKey = req.body?.keyValue || '';
  const { automationKey } = inArgs;

  const activityId = req.body?.activityId;
  const definitionInstanceId = req.body?.definitionInstanceId;
  const dedupeKey = `${activityId}-${definitionInstanceId}`;

  // ✅ Deduplication
  if (deduplicationMap.has(dedupeKey)) {
    console.warn(`⚠️ Duplicate execution skipped for ${dedupeKey}`);
    return res.status(200).json({ status: 'duplicate', message: 'Duplicate execution skipped.' });
  }

  deduplicationMap.set(dedupeKey, true);

  try {
    if (!automationKey) {
      await logToDataExtension({
        contactKey,
        automationKey: '',
        status: 'Failed',
        errorMessage: 'Missing automation key',
        activityId,
        definitionInstanceId
      });
      return res.status(400).json({ status: 'error', message: 'Missing automation key' });
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
        },
        timeout: 8000
      }
    );

    console.log('✅ Automation triggered:', triggerResponse.data);

    await logToDataExtension({
      contactKey,
      automationKey,
      status: 'Success',
      errorMessage: '',
      activityId,
      definitionInstanceId
    });

    res.status(200).json({ status: 'success', message: 'Automation triggered successfully' });
  } catch (error) {
    console.error('❌ Error triggering automation:', error.response?.data || error.message);

    await logToDataExtension({
      contactKey,
      automationKey,
      status: 'Failed',
      errorMessage: error.message,
      activityId,
      definitionInstanceId
    });

    res.status(500).json({ status: 'error', message: 'Failed to trigger automation' });
  }
});

// 🔁 Lifecycle Events
app.post('/activity/save', (req, res) => res.status(200).json({ status: 'ok' }));
app.post('/activity/validate', (req, res) => res.status(200).json({ status: 'ok' }));
app.post('/activity/publish', (req, res) => res.status(200).json({ status: 'ok' }));
app.post('/activity/stop', (req, res) => res.status(200).json({ status: 'ok' }));

// 🚀 Boot the Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
