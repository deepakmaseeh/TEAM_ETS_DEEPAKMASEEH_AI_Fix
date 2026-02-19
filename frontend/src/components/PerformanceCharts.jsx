import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useRun } from '../context/RunContext';
import { MoveRight } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

export default function PerformanceCharts() {
  const { currentRun } = useRun();

  if (!currentRun || !currentRun.results) {
    return (
      <div className="card" style={cardStyle}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-primary)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--info)',
            boxShadow: '0 0 15px rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <MoveRight size={24} style={{ transform: 'rotate(-45deg)' }} />
          </div>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '20px', 
              fontWeight: 700, 
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px'
            }}>Performance Analytics</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Waiting for run to complete...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const results = currentRun.results;
  const timeMetrics = results.time_metrics || {};

  const cardStyle = {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(10px)',
    border: 'var(--glass-border)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: 'var(--shadow-lg)',
    position: 'relative',
    overflow: 'hidden'
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(22, 27, 34, 0.95)',
          border: '1px solid var(--border-primary)',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-xl)',
          minWidth: '150px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{label}</p>
          {payload.map((entry, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: entry.color }} />
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                {entry.name}: <span style={{ fontFamily: 'var(--font-mono)' }}>{entry.value}</span>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare data for charts with fallback
  const iterationData = timeMetrics?.iterations?.map((iter, idx) => ({
    iteration: `Iter ${iter.number || idx + 1}`,
    duration: iter.duration || 0,
    time: timeMetrics?.formatted?.iterations?.[idx]?.duration || '0s'
  })) || timeMetrics?.formatted?.iterations?.map((iter, idx) => ({
    iteration: `Iter ${iter.number || idx + 1}`,
    duration: 0,
    time: iter.duration || '0s'
  })) || [];

  const agentData = timeMetrics?.formatted?.agents ? 
    Object.entries(timeMetrics.formatted.agents).map(([name, data]) => ({
      name: name.replace('Agent', ''),
      average: timeMetrics.agents?.[name]?.average || data.average || 0,
      calls: data.calls || 0
    })) : [];

  const fixStatusData = (results.fixes || []).reduce((acc, fix) => {
    const status = fix.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="card" style={cardStyle}>
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'var(--gradient-primary)',
        opacity: 0.5
      }} />

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border-primary)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--info)',
          boxShadow: '0 0 15px rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.2)'
        }}>
          <MoveRight size={24} style={{ transform: 'rotate(-45deg)' }} />
        </div>
        <div>
          <h2 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: 700, 
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px'
          }}>Performance Analytics</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Visual insights, trends, and agent distribution
          </p>
        </div>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '24px',
        marginTop: '24px'
      }}>
        {iterationData.length > 0 && (
          <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '20px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Iteration Velocity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={iterationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis 
                  dataKey="iteration" 
                  stroke="var(--text-secondary)" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="duration" 
                  stroke="var(--accent-primary)" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-card)' }}
                  activeDot={{ r: 6, stroke: 'var(--accent-active)', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {agentData.length > 0 && (
          <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '20px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Agent Load Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={agentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-secondary)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="average" fill="var(--info)" radius={[4, 4, 0, 0]} barSize={40}>
                   {agentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--accent-primary)' : 'var(--info)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {Object.keys(fixStatusData).length > 0 && (
          <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '20px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Fix Success Rate</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(fixStatusData).map(([name, value]) => ({ name, value }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="var(--text-secondary)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                  {Object.entries(fixStatusData).map(([name], index) => (
                     <Cell key={index} fill={name === 'applied' ? 'var(--success)' : 'var(--warning)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
