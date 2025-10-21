export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const query = url.searchParams.get("q") || "laptop";

      // Get OAuth token from eBay
      const tokenResponse = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": "Basic " + btoa(`${env.EBAY_CLIENT_ID}:${env.EBAY_CLIENT_SECRET}`)
        },
        body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope"
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        return new Response(JSON.stringify({
          error: "OAuth token missing",
          details: tokenData
        }), {
          headers: { "Content-Type": "application/json" },
          status: 500
        });
      }

      const accessToken = tokenData.access_token;

      // Call eBay Browse API
      const ebayUrl = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=5`;

      const response = await fetch(ebayUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      // Simplify results for Blogger
      const items = (data.itemSummaries || []).map(item => ({
        title: item.title,
        price: item.price?.value + " " + item.price?.currency,
        image: item.image?.imageUrl,
        link: item.itemWebUrl
      }));

      return new Response(JSON.stringify(items, null, 2), {
        headers: { "Content-Type": "application/json" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500
      });
    }
  }
};