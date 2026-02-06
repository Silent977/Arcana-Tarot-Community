const { Client } = require('@notionhq/client');

// Notion client init
const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // GET method only
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    // Check if environment variables are set
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
      console.error('Missing environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Server configuration error'
        })
      };
    }

    // Query Notion database
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      sorts: [
        {
          property: 'day',
          direction: 'ascending'
        }
      ]
    });

    // Format data
    const horoscopes = response.results.map(page => {
      const props = page.properties;
      
      // day property (Select type)
      let day = '';
      if (props.day && props.day.select) {
        day = props.day.select.name;
      }

      // date_range property (Rich Text or Title type)
      let date_range = '';
      if (props.date_range) {
        if (props.date_range.rich_text && props.date_range.rich_text.length > 0) {
          date_range = props.date_range.rich_text[0].plain_text;
        } else if (props.date_range.title && props.date_range.title.length > 0) {
          date_range = props.date_range.title[0].plain_text;
        }
      }

      // horoscope property (Rich Text type)
      let horoscope = '';
      if (props.horoscope && props.horoscope.rich_text) {
        horoscope = props.horoscope.rich_text.map(rt => rt.plain_text).join('');
      }

      return {
        day,
        date_range,
        horoscope
      };
    });

    // Success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: horoscopes,
        updated_at: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Notion API Error:', error.message);
    
    // Error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch horoscope data',
        message: error.message
      })
    };
  }
};
