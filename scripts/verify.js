const http = require('http');

console.log("Checking API compilation & routing endpoints...\n");

// Test HTTP connection to health status
const checkHealth = () => {
  http.get('http://localhost:5000/api/health', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log("Health Check Status Code:", res.statusCode);
      console.log("Health Check Response:", data);
      
      if (res.statusCode === 200) {
        console.log("\n[SUCCESS] Backend API runs and is healthy!");
      } else {
        console.log("\n[FAILURE] Health check endpoint returned invalid status.");
      }
    });
  }).on('error', (err) => {
    console.log("[STATUS] Backend is offline or not running yet. Run 'docker compose up' or 'npm run dev' to spin it up.");
  });
};

checkHealth();
