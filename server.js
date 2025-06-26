const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT; // For Azure compatibility

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => res.send('OK'));

// Function to get Marketing Cloud access token
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

// Log to Data Extension
async function logToDataExtension({ contactKey, automationKey, status, errorMessage, activityId, definitionInstanceId }) {
  try {
    const accessToken = await getAccessToken();
    const payload = {
      items: [
        {
          LogID: uuidv4(),
          ContactKey: contactKey || '',
          AutomationKey: automationKey || '',
          TriggerTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          Status: status,
          ErrorMessage: errorMessage || '',
          ActivityId: activityId || '',
          DefinitionInstanceId: definitionInstanceId || '',
          JourneyId: definitionInstanceId || '' // Using definitionInstanceId as JourneyId
        }
      ]
    };

    await axios.post(
      `https://mc654h8rl6ypfygmq-qvwq3yrjrq.rest.marketingcloudapis.com/data/v1/async/dataextensions/key:69DE292E-4D00-44E3-AD84-01AE5CC68CF4/rows`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (err) {
    console.error('❌ Logging to DE failed:', err.response?.data || err.message);
  }
}

// Get automations
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

// Execute custom activity
app.post('/activity/execute', async (req, res) => {
  console.log('🔥 Execute called with payload:', JSON.stringify(req.body, null, 2));

  const inArgs = req.body?.inArguments?.reduce((acc, curr) => ({ ...acc, ...curr }), {}) || {};
  const contactKey = req.body?.keyValue || '';
  const { automationKey } = inArgs;

  const activityId = req.body?.activityId;
  const definitionInstanceId = req.body?.definitionInstanceId;
  const journeyId = definitionInstanceId; // Treating as journeyId

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
        }
      }
    );

    console.log('✅ Automation Triggered:', triggerResponse.data);

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

// Lifecycle endpoints
app.post('/activity/save', (req, res) => res.status(200).json({ status: 'ok' }));
app.post('/activity/validate', (req, res) => res.status(200).json({ status: 'ok' }));
app.post('/activity/publish', (req, res) => res.status(200).json({ status: 'ok' }));
app.post('/activity/stop', (req, res) => res.status(200).json({ status: 'ok' }));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
