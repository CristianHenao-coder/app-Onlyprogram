import axios from 'axios';
import { config as env } from '../config/env';

// Legacy System API URL (configurable via env or default to localhost:8000)
// If running in docker, use host.docker.internal or service name. For local dev, localhost:8000 is fine.
const LEGACY_API_URL = process.env.LEGACY_API_URL || 'http://localhost:8000/api/v1';

export interface TrafficAnalysisResult {
    action: 'show_overlay' | 'allow' | 'block';
    type?: string;
    debug?: any;
}

export const TrafficService = {
    /**
     * Queries the Legacy System to analyze visitor traffic.
     * @param userAgent The visitor's User-Agent string.
     * @param headers An object containing relevant request headers (e.g., x-requested-with).
     */
    async analyzeVisitor(userAgent: string, headers: any): Promise<TrafficAnalysisResult> {
        try {
            const response = await axios.post(`${LEGACY_API_URL}/analyze-traffic`, {
                userAgent,
                headers
            }, {
                timeout: 3000 // Short timeout to avoid blocking user experience
            });

            return response.data;
        } catch (error: any) {
            console.error('Traffic Analysis Error (Legacy API):', error.message);
            // Default to 'allow' if the legacy system is unreachable to avoid downtime
            // Or 'block' if strict security is desired. 'allow' is safer for UX.
            return { action: 'allow', debug: { error: error.message } };
        }
    }
};
