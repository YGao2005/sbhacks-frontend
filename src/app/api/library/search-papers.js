// pages/api/search-papers.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const { query } = req.body;
      
      // Encode the query parameters
      const encodedQuery = encodeURIComponent(query);
      const fields = encodeURIComponent('paperId,title,url,openAccessPdf');
      
      // Make request to Semantic Scholar API
      const response = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/search/match?query=${encodedQuery}&fields=${fields}`
      );
  
      if (!response.ok) {
        throw new Error('Failed to fetch from Semantic Scholar API');
      }
  
      const data = await response.json();
      
      // Find the first paper with an openAccessPdf URL
      const paper = data.papers?.find(p => p.openAccessPdf?.url);
      
      if (!paper?.openAccessPdf?.url) {
        return res.status(404).json({ error: 'No open access PDF found for this query' });
      }
  
      return res.status(200).json({ 
        pdfUrl: paper.openAccessPdf.url,
        title: paper.title
      });
  
    } catch (error) {
      console.error('Search papers error:', error);
      return res.status(500).json({ error: 'Failed to search for papers' });
    }
  }