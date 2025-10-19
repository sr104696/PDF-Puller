/**
 * Puppeteer Error Monitor and Auto-Recovery System
 * Handles common runtime errors and implements self-healing mechanisms
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class PuppeteerErrorMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      logPath: options.logPath || '/tmp/puppeteer-errors.log',
      maxRestarts: options.maxRestarts || 5,
      restartDelay: options.restartDelay || 5000,
      enableAutoRecovery: options.enableAutoRecovery !== false,
      healthCheckInterval: options.healthCheckInterval || 30000,
      ...options
    };
    
    this.browserInstance = null;
    this.restartCount = 0;
    this.lastError = null;
    this.isHealthy = true;
    this.healthCheckTimer = null;
    
    this.errorHandlers = this.initializeErrorHandlers();
  }

  /**
   * Initialize error handlers for different error types
   */
  initializeErrorHandlers() {
    return {
      // Missing library errors
      MISSING_LIBRARY: {
        pattern: /cannot open shared object file/i,
        severity: 'CRITICAL',
        handler: async (error) => {
          await this.logError('MISSING_LIBRARY', error);
          console.error('❌ Missing system library detected');
          console.error('Run: sudo bash install-chrome-deps.sh');
          return { canRecover: false, action: 'INSTALL_DEPS' };
        }
      },

      // Browser crash
      BROWSER_CRASH: {
        pattern: /Protocol error.*Target closed/i,
        severity: 'HIGH',
        handler: async (error) => {
          await this.logError('BROWSER_CRASH', error);
          console.error('❌ Browser crashed unexpectedly');
          
          if (this.options.enableAutoRecovery && this.restartCount < this.options.maxRestarts) {
            return { canRecover: true, action: 'RESTART_BROWSER' };
          }
          return { canRecover: false, action: 'MANUAL_INTERVENTION' };
        }
      },

      // Timeout errors
      TIMEOUT: {
        pattern: /timeout|Timeout/i,
        severity: 'MEDIUM',
        handler: async (error) => {
          await this.logError('TIMEOUT', error);
          console.warn('⚠️  Timeout detected');
          return { canRecover: true, action: 'RETRY_WITH_LONGER_TIMEOUT' };
        }
      },

      // Navigation errors
      NAVIGATION_FAILED: {
        pattern: /net::ERR_|Navigation timeout|Failed to navigate/i,
        severity: 'MEDIUM',
        handler: async (error) => {
          await this.logError('NAVIGATION_FAILED', error);
          console.warn('⚠️  Navigation failed');
          return { canRecover: true, action: 'RETRY_NAVIGATION' };
        }
      },

      // Memory issues
      OUT_OF_MEMORY: {
        pattern: /out of memory|Cannot allocate memory/i,
        severity: 'HIGH',
        handler: async (error) => {
          await this.logError('OUT_OF_MEMORY', error);
          console.error('❌ Out of memory');
          console.error('Consider: Increase system RAM or use --single-process flag');
          return { canRecover: true, action: 'RESTART_WITH_REDUCED_RESOURCES' };
        }
      },

      // Shared memory issues
      SHM_ISSUE: {
        pattern: /\/dev\/shm|shared memory/i,
        severity: 'HIGH',
        handler: async (error) => {
          await this.logError('SHM_ISSUE', error);
          console.error('❌ Shared memory issue');
          console.error('Add flag: --disable-dev-shm-usage');
          return { canRecover: true, action: 'RESTART_WITH_NO_SHM' };
        }
      },

      // Page crash
      PAGE_CRASH: {
        pattern: /Page crashed/i,
        severity: 'MEDIUM',
        handler: async (error) => {
          await this.logError('PAGE_CRASH', error);
          console.warn('⚠️  Page crashed');
          return { canRecover: true, action: 'RECREATE_PAGE' };
        }
      },

      // Connection refused
      CONNECTION_REFUSED: {
        pattern: /ECONNREFUSED|Connection refused/i,
        severity: 'HIGH',
        handler: async (error) => {
          await this.logError('CONNECTION_REFUSED', error);
          console.error('❌ Connection refused - browser may not be running');
          return { canRecover: true, action: 'RESTART_BROWSER' };
        }
      },

      // Sandbox errors
      SANDBOX_ERROR: {
        pattern: /sandbox|SUID/i,
        severity: 'MEDIUM',
        handler: async (error) => {
          await this.logError('SANDBOX_ERROR', error);
          console.warn('⚠️  Sandbox error detected');
          console.warn('Add flags: --no-sandbox --disable-setuid-sandbox');
          return { canRecover: true, action: 'RESTART_NO_SANDBOX' };
        }
      }
    };
  }

  /**
   * Classify and handle error
   */
  async handleError(error) {
    const errorMessage = error.message || error.toString();
    this.lastError = error;
    this.isHealthy = false;

    // Find matching error handler
    for (const [type, handler] of Object.entries(this.errorHandlers)) {
      if (handler.pattern.test(errorMessage)) {
        console.log(`\n🔍 Detected error type: ${type}`);
        const result = await handler.handler(error);
        
        this.emit('error-detected', {
          type,
          severity: handler.severity,
          error,
          result
        });
        
        return result;
      }
    }

    // Unknown error
    await this.logError('UNKNOWN', error);
    console.error('❌ Unknown error:', errorMessage);
    return { canRecover: false, action: 'MANUAL_INTERVENTION' };
  }

  /**
   * Log error to file
   */
  async logError(type, error) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message: error.message,
      stack: error.stack,
      restartCount: this.restartCount
    };

    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(this.options.logPath, logLine);
    } catch (err) {
      console.error('Failed to write error log:', err);
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring(browser, browserManager) {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.browserInstance = browser;
    
    this.healthCheckTimer = setInterval(async () => {
      try {
        const healthy = await browserManager.healthCheck();
        
        if (!healthy && this.isHealthy) {
          console.warn('⚠️  Health check failed - browser appears unresponsive');
          this.isHealthy = false;
          
          this.emit('health-check-failed', {
            timestamp: new Date().toISOString()
          });

          if (this.options.enableAutoRecovery) {
            await this.attemptRecovery(browserManager);
          }
        } else if (healthy && !this.isHealthy) {
          console.log('✓ Browser recovered');
          this.isHealthy = true;
          this.emit('browser-recovered');
        }
      } catch (error) {
        console.error('Health check error:', error.message);
      }
    }, this.options.healthCheckInterval);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Attempt automatic recovery
   */
  async attemptRecovery(browserManager) {
    if (this.restartCount >= this.options.maxRestarts) {
      console.error('❌ Maximum restart attempts reached');
      this.emit('max-restarts-reached');
      return false;
    }

    this.restartCount++;
    console.log(`🔄 Attempting recovery (${this.restartCount}/${this.options.maxRestarts})...`);

    try {
      // Close existing browser
      if (this.browserInstance) {
        try {
          await this.browserInstance.close();
        } catch (err) {
          console.warn('Error closing browser:', err.message);
        }
      }

      // Wait before restart
      await new Promise(resolve => setTimeout(resolve, this.options.restartDelay));

      // Restart browser
      await browserManager.launch();
      this.isHealthy = true;
      
      console.log('✓ Recovery successful');
      this.emit('recovery-successful', {
        attemptNumber: this.restartCount
      });
      
      return true;
    } catch (error) {
      console.error('❌ Recovery failed:', error.message);
      this.emit('recovery-failed', {
        attemptNumber: this.restartCount,
        error
      });
      return false;
    }
  }

  /**
   * Generate error report
   */
  async generateReport() {
    try {
      const logs = await fs.readFile(this.options.logPath, 'utf8');
      const entries = logs.trim().split('\n').map(line => JSON.parse(line));

      const report = {
        totalErrors: entries.length,
        errorsByType: {},
        recentErrors: entries.slice(-10),
        restartCount: this.restartCount,
        currentHealth: this.isHealthy
      };

      // Count errors by type
      entries.forEach(entry => {
        report.errorsByType[entry.type] = (report.errorsByType[entry.type] || 0) + 1;
      });

      return report;
    } catch (error) {
      return {
        error: 'Failed to generate report',
        message: error.message
      };
    }
  }

  /**
   * Clear error logs
   */
  async clearLogs() {
    try {
      await fs.writeFile(this.options.logPath, '');
      console.log('✓ Error logs cleared');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  /**
   * Get suggestions based on error history
   */
  async getSuggestions() {
    const report = await this.generateReport();
    const suggestions = [];

    if (report.error) {
      return ['Unable to analyze error history'];
    }

    // Analyze error patterns
    if (report.errorsByType.MISSING_LIBRARY > 0) {
      suggestions.push('Install system dependencies: sudo bash install-chrome-deps.sh');
    }

    if (report.errorsByType.OUT_OF_MEMORY > 2) {
      suggestions.push('Increase system memory or use --single-process flag');
    }

    if (report.errorsByType.TIMEOUT > 3) {
      suggestions.push('Increase timeout values or check network connectivity');
    }

    if (report.errorsByType.SHM_ISSUE > 0) {
      suggestions.push('Add --disable-dev-shm-usage flag or increase shm_size in Docker');
    }

    if (report.restartCount >= this.options.maxRestarts) {
      suggestions.push('Consider manual intervention - automatic recovery has been exhausted');
    }

    if (suggestions.length === 0) {
      suggestions.push('No specific issues detected. Browser is operating normally.');
    }

    return suggestions;
  }
}

// Export
module.exports = PuppeteerErrorMonitor;

// Example usage
if (require.main === module) {
  (async () => {
    const RobustBrowser = require('./puppeteer-robust-setup');
    const monitor = new PuppeteerErrorMonitor({
      enableAutoRecovery: true,
      maxRestarts: 3,
      healthCheckInterval: 10000
    });

    // Listen to events
    monitor.on('error-detected', (data) => {
      console.log('Error event:', data.type, '- Severity:', data.severity);
    });

    monitor.on('browser-recovered', () => {
      console.log('🎉 Browser has recovered successfully');
    });

    monitor.on('max-restarts-reached', () => {
      console.log('⚠️  Maximum restart attempts reached - manual intervention required');
    });

    const browserManager = new RobustBrowser();

    try {
      console.log('Launching browser with monitoring...');
      const browser = await browserManager.launch();
      
      // Start health monitoring
      monitor.startHealthMonitoring(browser, browserManager);

      // Simulate some work
      const page = await browserManager.newPage();
      await browserManager.navigateWithRetry(page, 'https://example.com');

      console.log('\nMonitoring active. Press Ctrl+C to stop.\n');

      // Keep process alive
      await new Promise(resolve => {
        process.on('SIGINT', async () => {
          console.log('\nShutting down...');
          monitor.stopHealthMonitoring();
          
          // Generate final report
          const report = await monitor.generateReport();
          console.log('\nFinal Report:');
          console.log(JSON.stringify(report, null, 2));
          
          const suggestions = await monitor.getSuggestions();
          console.log('\nSuggestions:');
          suggestions.forEach(s => console.log(`  - ${s}`));
          
          await browserManager.close();
          resolve();
        });
      });

    } catch (error) {
      const result = await monitor.handleError(error);
      console.log('\nError handling result:', result);
      
      const suggestions = await monitor.getSuggestions();
      console.log('\nSuggestions:');
      suggestions.forEach(s => console.log(`  - ${s}`));
      
      process.exit(1);
    }
  })();
}
