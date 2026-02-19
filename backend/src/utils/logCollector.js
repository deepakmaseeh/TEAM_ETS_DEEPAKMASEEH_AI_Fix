/**
 * Log collector for real-time console logs
 */
export class LogCollector {
  constructor(runId) {
    this.runId = runId;
    this.logs = [];
    this.maxLogs = 10000; // Limit to prevent memory issues
  }

  log(level, message, metadata = {}) {
    const logEntry = {
      id: this.logs.length + 1,
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(), // INFO, WARN, ERROR, DEBUG
      message,
      ...metadata
    };
    
    this.logs.push(logEntry);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    return logEntry;
  }

  info(message, metadata) {
    return this.log('info', message, metadata);
  }

  warn(message, metadata) {
    return this.log('warn', message, metadata);
  }

  error(message, metadata) {
    return this.log('error', message, metadata);
  }

  debug(message, metadata) {
    return this.log('debug', message, metadata);
  }

  getLogs(level = null, limit = null) {
    let filtered = this.logs;
    
    if (level) {
      filtered = filtered.filter(log => log.level === level.toUpperCase());
    }
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }

  searchLogs(query) {
    const lowerQuery = query.toLowerCase();
    return this.logs.filter(log => 
      log.message.toLowerCase().includes(lowerQuery) ||
      log.level.toLowerCase().includes(lowerQuery)
    );
  }

  clear() {
    this.logs = [];
  }

  getAllLogs() {
    return this.logs;
  }
}
