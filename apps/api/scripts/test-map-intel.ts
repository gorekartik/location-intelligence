
import axios from 'axios';
import fs from 'fs';

async function testMapIntel() {
    const baseUrl = 'http://localhost:3001';
    // Example coordinates: Times Square (approx)
    const lat = 40.7580;
    const lng = -73.9855;
    const logStream = fs.createWriteStream('test_output.txt');
    const log = (msg: string) => {
        console.log(msg);
        logStream.write(msg + '\n');
    };

    log(`Testing /api/location-intel with lat=${lat}, lng=${lng}...`);

    const start = Date.now();
    try {
        const response = await axios.get(`${baseUrl}/api/location-intel`, {
            params: { lat, lng }
        });
        const duration = Date.now() - start;

        log(`Status: ${response.status}`);
        log(`Duration: ${duration}ms`);

        // Validate structure
        const data = response.data;
        if (data.zones && data.zones.green && Array.isArray(data.zones.green)) {
            log('✅ Structure: Zones present');
            log(`   - Green Zone Landmarks: ${data.zones.green.length}`);
            log(`   - Yellow Zone Landmarks: ${data.zones.yellow.length}`);
            log(`   - Blue Zone Landmarks: ${data.zones.blue.length}`);
        } else {
            log('❌ Structure: Zones missing or invalid');
        }

        if (data.connectivity && Array.isArray(data.connectivity)) {
            log(`✅ Structure: Connectivity present (${data.connectivity.length} items)`);
            const noUTurns = data.connectivity.filter((i: any) => i.type === 'node' && i.tags && i.tags.restriction === 'no_u_turn');
            log(`   - No U-Turn Nodes: ${noUTurns.length}`);
        } else {
            log('❌ Structure: Connectivity missing');
        }

        if (data.summary && typeof data.summary === 'string') {
            log('✅ Structure: Summary present');
            log('--- Summary ---');
            log(data.summary);
            log('---------------');
        } else {
            log('❌ Structure: Summary missing');
        }

        if (data.debug) {
            log('--- Timing (Server Side) ---');
            log(`- Spatial: ${data.debug.spatial}ms`);
            log(`- Roads: ${data.debug.roads}ms`);
            log(`- Gemini: ${data.debug.gemini}ms`);
            log(`- Total: ${data.debug.total}ms`);
        }

        if (duration > 800) {
            log('⚠️ Performance: > 800ms');
        } else {
            log('✅ Performance: < 800ms');
        }

    } catch (error: any) {
        log('Test Failed: ' + error.message);
        if (error.response) {
            log('Response Status: ' + error.response.status);
            log('Response Data: ' + JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        logStream.end();
    }
}

testMapIntel();
