const axios = require('axios');

// Step 1: Define your Marketing Cloud credentials
const clientId = '9pgjuv8byisnioxfbaqk820l';
const clientSecret = 'NCjoZUctnI8jYIcvWPsYtUup';
const accountId = '110007984'; // optional if not needed
const authUrl = 'https://mc654h8rl6ypfygmq-qvwq3yrjrq.auth.marketingcloudapis.com/v2/token';

const automationUrl = 'https://mc654h8rl6ypfygmq-qvwq3yrjrq.rest.marketingcloudapis.com/automation/v1/automations/key:a47dbac7-a8ba-4efc-973f-36a66f801890/actions/runallonce';

async function getAccessToken() {
  try {
    const payload = {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      account_id: accountId // optional; if not needed, remove
    };

    const response = await axios.post(authUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const { access_token, rest_instance_url } = response.data;
    console.log('✅ Access Token Received');
    return { access_token, rest_instance_url };

  } catch (error) {
    console.error('❌ Auth Error:', error.response?.data || error.message);
    throw error;
  }
}

async function triggerAutomation() {
  try {
    const { access_token } = await getAccessToken();

    const response = await axios.post(
      automationUrl,
      {},
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Automation Triggered:', response.data);
  } catch (error) {
    console.error('❌ Automation Trigger Error:', error.response?.data || error.message);
  }
}

// Run it standalone
triggerAutomation();
