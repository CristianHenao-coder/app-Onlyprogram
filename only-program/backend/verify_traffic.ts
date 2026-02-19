
import { TrafficService } from './src/services/traffic.service';

async function testTraffic() {
    console.log("🧪 Testing Traffic Service Integration...");

    // 1. Test Normal User Agent (Chrome)
    console.log("\n1. Testing Chrome (Should be ALLOWED)...");
    const chromeUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const result1 = await TrafficService.analyzeVisitor(chromeUA, {});
    console.log("Result:", result1);

    // 2. Test TikTok User Agent (Should be OVERLAY/BLOCK)
    console.log("\n2. Testing TikTok (Should be OVERLAY)...");
    const tiktokUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1 TikTok 21.1.0";
    const result2 = await TrafficService.analyzeVisitor(tiktokUA, {});
    console.log("Result:", result2);

    if (result1.action === 'allow' && (result2.action === 'show_overlay' || result2.type === 'tiktok')) {
        console.log("\n✅ SUCCESS: Traffic Service is communicating with Legacy System!");
    } else {
        console.error("\n❌ FAILURE: Unexpected results or connection error.");
        if (result1.debug) console.error("Chrome Debug:", result1.debug);
        if (result2.debug) console.error("TikTok Debug:", result2.debug);
    }
}

testTraffic();
