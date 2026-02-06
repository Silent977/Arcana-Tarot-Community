const { Client } = require('@notionhq/client');

// Notion client ဖန်တီးခြင်း
const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET method only
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    // Check if environment variables are set
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
      console.error('Missing environment variables');
      res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
      return;
    }

    // Notion database မှ data query လုပ်ခြင်း
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      sorts: [
        {
          property: 'day',
          direction: 'ascending'
        }
      ]
    });

    // Data ကို format လုပ်ခြင်း
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
    res.status(200).json({
      success: true,
      data: horoscopes,
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Notion API Error:', error.message);
    
    // Error response
    res.status(500).json({
      success: false,
      error: 'Failed to fetch horoscope data',
      message: error.message
    });
  }
};
