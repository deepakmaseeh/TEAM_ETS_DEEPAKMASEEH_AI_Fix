/**
 * Time tracking utility for detailed performance metrics
 */
export class TimeTracker {
  constructor() {
    this.metrics = {
      total: 0,
      agents: {},
      iterations: [],
      fixes: [],
      phases: {}
    };
    this.startTime = Date.now();
    this.phaseStartTime = {};
    this.agentStartTime = {};
  }

  startPhase(phaseName) {
    this.phaseStartTime[phaseName] = Date.now();
  }

  endPhase(phaseName) {
    if (this.phaseStartTime[phaseName]) {
      const duration = Date.now() - this.phaseStartTime[phaseName];
      this.metrics.phases[phaseName] = duration;
      delete this.phaseStartTime[phaseName];
      return duration;
    }
    return 0;
  }

  startAgent(agentName) {
    this.agentStartTime[agentName] = Date.now();
  }

  endAgent(agentName) {
    if (this.agentStartTime[agentName]) {
      const duration = Date.now() - this.agentStartTime[agentName];
      if (!this.metrics.agents[agentName]) {
        this.metrics.agents[agentName] = { total: 0, calls: 0, average: 0 };
      }
      this.metrics.agents[agentName].total += duration;
      this.metrics.agents[agentName].calls += 1;
      this.metrics.agents[agentName].average = 
        this.metrics.agents[agentName].total / this.metrics.agents[agentName].calls;
      delete this.agentStartTime[agentName];
      return duration;
    }
    return 0;
  }

  startIteration(iterationNumber) {
    const iteration = {
      number: iterationNumber,
      startTime: Date.now(),
      phases: {},
      fixes: []
    };
    this.metrics.iterations.push(iteration);
    return iteration;
  }

  endIteration(iterationNumber) {
    const iteration = this.metrics.iterations.find(i => i.number === iterationNumber);
    if (iteration) {
      iteration.endTime = Date.now();
      iteration.duration = iteration.endTime - iteration.startTime;
    }
  }

  trackFix(fixId, file, bugType, duration) {
    this.metrics.fixes.push({
      id: fixId,
      file,
      bugType,
      duration,
      timestamp: Date.now()
    });
  }

  getMetrics() {
    this.metrics.total = Date.now() - this.startTime;
    return {
      ...this.metrics,
      formatted: {
        total: this.formatDuration(this.metrics.total),
        phases: Object.fromEntries(
          Object.entries(this.metrics.phases).map(([k, v]) => [k, this.formatDuration(v)])
        ),
        agents: Object.fromEntries(
          Object.entries(this.metrics.agents).map(([k, v]) => [
            k,
            {
              total: this.formatDuration(v.total),
              calls: v.calls,
              average: this.formatDuration(v.average)
            }
          ])
        ),
        iterations: this.metrics.iterations.map(i => ({
          ...i,
          duration: this.formatDuration(i.duration || 0)
        })),
        fixes: this.metrics.fixes.map(f => ({
          ...f,
          duration: this.formatDuration(f.duration)
        }))
      }
    };
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}
