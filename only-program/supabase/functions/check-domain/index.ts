import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();

    if (!domain) {
      return new Response(JSON.stringify({ error: "Domain is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // This is where you would call Domainr or Cloudflare API
    // For now, we use a more advanced simulation that can be easily replaced
    const isAvailable =
      !domain.includes("google") &&
      !domain.includes("facebook") &&
      domain.length > 3;

    // TLD Pricing Simulation
    const getPrice = (d: string) => {
      if (d.endsWith(".com")) return "$10.00 / año";
      if (d.endsWith(".net")) return "$12.00 / año";
      if (d.endsWith(".vip")) return "$15.00 / año";
      return "$10.00 / año";
    };

    const result = {
      domain,
      available: isAvailable,
      price: isAvailable ? getPrice(domain) : null,
      suggestions: isAvailable
        ? []
        : [
            `${domain.split(".")[0]}-official.com`,
            `${domain.split(".")[0]}link.com`,
            `${domain.split(".")[0]}.net`,
          ],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
