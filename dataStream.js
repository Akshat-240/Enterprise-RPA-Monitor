/**
 * ============================================================================
 * OFFICIAL HACKATHON TELEMETRY PIPELINE ENGINE (dataStream.js) - Aligned Version
 * ============================================================================
 */

(function() {
  let memoryPool = [];
  let isInitialized = false;

  const randomRange = (min, max) => Math.random() * (max - min) + min;

  /**
   * Native, highly-optimized CSV Parser
   */
  const parseCSV = (csvText) => {
    console.log("⚡ [Pipeline Engine] Parsing Official Hackathon CSV into Memory Pool...");
    const lines = csvText.trim().split('\n');
    
    const headers = lines[0].split('\t').length > lines[0].split(',').length 
      ? lines[0].split('\t').map(h => h.trim()) 
      : lines[0].split(',').map(h => h.trim());
    
    const parsedData = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].includes('\t') ? lines[i].split('\t') : lines[i].split(','); 
      
      if (values.length === headers.length) {
        let rowObject = { internal_uid: `uid-row-${i}` }; // Primary key for unique DOM tracking
        
        headers.forEach((header, index) => {
          let val = values[index].trim();
          
          // Cast values to strict types for proper sorting and calculations
          if (['robots_deployed', 'budget_usd', 'annual_savings_usd', 'employee_hours_saved'].includes(header)) {
            rowObject[header] = parseInt(val, 10) || 0;
          } else if (header === 'roi_percent') {
            rowObject[header] = parseFloat(val) || 0.00;
          } else {
            rowObject[header] = val; // Metadata strings
          }
        });
        parsedData.push(rowObject);
      }
    }
    return parsedData;
  };

  /**
   * Global Stream Initialization Hook
   */
  window.initializeRpaStream = async function(callback, csvUrl = '/rpa_database_2026.csv') {
    if (typeof callback !== 'function') {
      console.error("❌ [Pipeline Error] initializeRpaStream requires a callback function execution loop.");
      return;
    }

    if (isInitialized) {
      console.warn("⚠️ [Pipeline Warning] Telemetry stream has already been initialized.");
      return;
    }

    try {
      console.log(`📦 [Pipeline Engine] Fetching schema baseline from target destination: ${csvUrl}`);
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP network error! status: ${response.status}`);
      }

      const csvText = await response.text();
      memoryPool = parseCSV(csvText);
      isInitialized = true;
      
      console.log(`✅ [Pipeline Engine] Successfully mapped ${memoryPool.length} rows directly into RAM.`);
      console.log("🚀 [Pipeline Engine] Starting high-frequency 200ms background execution firehose...");

      // Telemetry firehose tick rate matching strict hackathon runtime constraints
      setInterval(() => {
        if (memoryPool.length === 0) return;

        // Fluctuates an active cluster of records every cycle (5 to 50 updates per tick)
        const batchSize = Math.floor(randomRange(5, 50)); 
        const incomingBatch = [];

        for (let i = 0; i < batchSize; i++) {
          const targetIndex = Math.floor(randomRange(0, memoryPool.length));
          const row = { ...memoryPool[targetIndex] }; // Shallow clone to decouple references

          const isAnomaly = Math.random() > 0.95; // 5% chance of critical macro shifts
          
          if (isAnomaly) {
            // Volatility injection affecting annual savings, employee hours and ROI
            row.annual_savings_usd += Math.floor(randomRange(-50000, 50000));
            row.employee_hours_saved += Math.floor(randomRange(-1000, 1000));
            row.roi_percent = parseFloat((row.roi_percent + randomRange(-150, 20)).toFixed(2));
            row.project_status = Math.random() > 0.5 ? 'Failed' : 'Active';
          } else {
            // High-frequency standard operational telemetry noise
            row.annual_savings_usd += Math.floor(randomRange(-5000, 10000));
            row.robots_deployed += Math.floor(randomRange(-1, 2));
            row.employee_hours_saved += Math.floor(randomRange(-20, 50));
            row.roi_percent = parseFloat((row.roi_percent + randomRange(-2, 4)).toFixed(2));
          }

          // Strict downstream constraints: sanitize limits before pushing to components
          row.annual_savings_usd = Math.max(0, row.annual_savings_usd);
          row.robots_deployed = Math.max(1, row.robots_deployed);
          row.employee_hours_saved = Math.max(0, row.employee_hours_saved);

          // Reflect metrics mutation in state cache
          memoryPool[targetIndex] = row;
          incomingBatch.push(row);
        }

        // Blast payload batch array to client-side callback system
        callback(incomingBatch);
      }, 200);

    } catch (error) {
      console.error("❌ [Pipeline Critical Crash] Could not initialize telemetry stream:", error);
    }
  };
})();