const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT; // Do NOT fallback to 3000 in Azure

// 🔄 In-memory deduplication map
const deduplicationMap = new Map();

// 🔧 Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 📂 Serve static UI
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Health Check
app.get('/health', (req, res) => res.send('OK'));

// 🔐 Get OAuth Access Token
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

// 📝 Log Automation Execution to DE
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
    console.error('📛 DE Logging Error:', err.response?.data || err.message);
  }
}

// 🔁 GET: List All Automations
app.get('/automations', async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const response = await axios.get(
      'https://mc654h8rl6ypfygmq-qvwq3yrjrq.rest.marketingcloudapis.com/automation/v1/automations',
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error('❌ Error fetching automations:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch automations' });
  }
});

// 🚀 POST: Execute Automation
app.post('/activity/execute', async (req, res) => {
  console.log('🔥 Execute Payload:', JSON.stringify(req.body, null, 2));
  const inArgs = req.body?.inArguments?.reduce((acc, curr) => ({ ...acc, ...curr }), {}) || {};
  const contactKey = req.body?.keyValue || '';
  const { automationKey } = inArgs;

  const activityId = req.body?.activityId;
  const definitionInstanceId = req.body?.definitionInstanceId;
  const dedupeKey = `${activityId}-${definitionInstanceId}`;

  // ✅ Deduplication check
  if (deduplicationMap.has(dedupeKey)) {
    console.warn(`⚠️ Skipped duplicate execution for ${dedupeKey}`);
    return res.status(200).json({ status: 'duplicate', message: 'Duplicate execution skipped' });
  }

  deduplicationMap.set(dedupeKey, true); // mark execution

  if (!automationKey) {
    await logToDataExtension({
      contactKey,
      automationKey: '',
      status: 'Failed',
      errorMessage: 'Missing automationKey',
      activityId,
      definitionInstanceId
    });
    return res.status(400).json({ status: 'error', message: 'Missing automationKey' });
  }

  try {
    const accessToken = await getAccessToken();
    const url = `https://mc654h8rl6ypfygmq-qvwq3yrjrq.rest.marketingcloudapis.com/automation/v1/automations/key:${automationKey}/actions/runallonce`;

    const triggerRes = await axios.post(url, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 8000
    });

    console.log('✅ Triggered Automation:', triggerRes.data);

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
    console.error('❌ Automation error:', error.response?.data || error.message);
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

// 📦 Lifecycle Events
app.post('/activity/save', (req, res) => res.status(200).json({ status: 'ok' }));
app.post('/activity/validate', (req, res) => res.status(200).json({ status: 'ok' }));
app.post('/activity/publish', (req, res) => res.status(200).json({ status: 'ok' }));
app.post('/activity/stop', (req, res) => res.status(200).json({ status: 'ok' }));

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server started on Azure port ${PORT}`);
});
