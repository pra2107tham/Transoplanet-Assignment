import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import xml2js from 'xml2js';
import cheerio from 'cheerio';
import https from 'https';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const agent = new https.Agent({
  rejectUnauthorized: false,
});

app.use(cors());
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.post('/api/products', async (req, res) => {
  try {
    console.log('Received request for /api/products with body:', req.body);
    const siteUrl = req.body.url;
    if (!siteUrl) {
      console.error('URL is required');
      return res.status(400).json({ error: 'URL is required' });
    }

    const urlResponse = await axios.post('http://localhost:3000/api/test', { domain: siteUrl });
    const url = urlResponse.data;
    console.log('Product sitemap URL:', url);

    const response = await axios.get(url);
    const xml = response.data;
    const result = await xml2js.parseStringPromise(xml);
    const products = result.urlset.url.map((product) => {
      const loc = product.loc ? product.loc[0] : null;
      const images = product['image:image'] ? product['image:image'].map((image) => ({
        url: image['image:loc'] ? image['image:loc'][0] : null,
        title: image['image:title'] ? image['image:title'][0] : null,
      })) : [];

      return { loc, images };
    });

    const summarizedProducts = await Promise.all(
      products.slice(0, 6).map(async (product) => {
        const description = await getDescription(product.loc);
        const summary = await getSummary(description);
        return {
          ...product,
          summary,
        };
      })
    );

    res.status(200).json({
      products: summarizedProducts,
      message: 'Products fetched successfully!',
    });
  } catch (error) {
    console.error('Error in /api/products:', error.message);
    res.status(500).json({ error: 'Error fetching or parsing XML', message: error.message });
  }
});

app.post('/api/test', async (req, res) => {
  try {
    console.log('Received request for /api/test with body:', req.body);
    const domain = req.body.domain;
    if (!domain) {
      console.error('Domain is required');
      return res.status(400).json({ error: 'Domain is required' });
    }

    const response = await axios.get(`${domain}/robots.txt`);
    const robotsTxt = response.data;
    console.log('Fetched robots.txt:', robotsTxt);

    const sitemapUrlMatch = robotsTxt.match(/Sitemap: (.*)/);
    if (!sitemapUrlMatch) {
      console.error('Sitemap URL not found in robots.txt');
      return res.status(400).json({ error: 'Sitemap URL not found in robots.txt' });
    }

    const siteMapUrl = sitemapUrlMatch[1];
    const links = await axios.get(siteMapUrl);
    const sitexml = links.data;
    const site = await xml2js.parseStringPromise(sitexml);
    console.log('Parsed sitemap index:', site);

    const productSitemapUrl = site.sitemapindex.sitemap[0].loc[0];
    console.log('Product sitemap URL:', productSitemapUrl);
    res.status(200).send(productSitemapUrl);
  } catch (error) {
    console.error('Error in /api/test:', error.message);
    res.status(500).json({ error: 'Error fetching robots.txt', message: error.message });
  }
});

const getDescription = async (url) => {
  try {
    console.log('Fetching description for URL:', url);
    const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
      params: {
        api_key: process.env.SCRAPINGBEE_API_KEY,
        url: url,
        json_response: 'true',
      },
      // httpsAgent: agent,
    });

    let description = response.data.meta_description || '';
    let paragraphs = '';

    if (response.data.body) {
      const $ = cheerio.load(response.data.body);
      $('p').slice(0, 10).each((index, element) => {
        paragraphs += $(element).text() + '\n';
      });

      if (!description) {
        description = paragraphs.trim() || 'No suitable description found';
      }
    } else {
      description = 'No HTML body found in the response';
    }

    console.log('Fetched description:', description);
    return description;
  } catch (error) {
    console.error('Error fetching description:', error.message);
    return 'Failed to fetch description';
  }
};

const getSummary = async (description) => {
  try {
    console.log('Generating summary for description:', description);
    const apikey = process.env.GEMINI_API_KEY;
    const instruction = "Filter and summarize the given text based on the product in 3 very short bullet points: ";
    const genAI = new GoogleGenerativeAI(apikey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `${instruction} ${description}`;
    const result = await model.generateContent(prompt);
    const answer = result.response.text();
    const cleanedSummary = answer.split('\n\n').slice(1).join(' ').trim();

    console.log('Generated summary:', cleanedSummary);
    return cleanedSummary;
  } catch (error) {
    console.error('Error summarizing description:', error.message);
    return 'Failed to summarize description';
  }
};

app.post('/api/summarize', async (req, res) => {
  const { description } = req.body;
  try {
    console.log('Received request for /api/summarize with body:', req.body);
    const summary = await getSummary(description);
    res.status(200).json({ summary, message: 'Summary fetched successfully' });
  } catch (error) {
    console.error('Error in /api/summarize:', error.message);
    res.status(500).json({ error: 'Error summarizing content', message: error.message });
  }
});

app.post('/api/content', async (req, res) => {
  const url = req.body.url;
  if (!url) {
    console.error('URL is required');
    return res.status(400).json({ error: 'URL is required' });
  }
  try {
    console.log('Received request for /api/content with body:', req.body);
    const description = await getDescription(url);
    res.status(200).json({ description });
  } catch (error) {
    console.error('Error in /api/content:', error.message);
    res.status(500).json({ error: 'An error occurred', details: error.message });
  }
});
