import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  FolderGit2,
  Trash2,
  ExternalLink,
  RefreshCw,
  HardDrive,
  Calendar,
  Loader2,
  X,
  Copy,
  Check,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WorkspaceModal({ isOpen, onClose }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNames, setSelectedNames] = useState([]);
  const [copiedName, setCopiedName] = useState(null);

  const fetchWorkspace = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${API_URL}/workspace`);
      setRepos(data.repos || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load workspace');
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const handleDelete = async (name) => {
    if (!window.confirm(`Delete cloned repository "${name}" from workspace? This cannot be undone.`)) return;
    setDeleting(name);
    try {
      await axios.delete(`${API_URL}/workspace/${encodeURIComponent(name)}`);
      setRepos((prev) => prev.filter((r) => r.name !== name));
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const openOnGitHub = (name) => {
    const search = encodeURIComponent(name);
    window.open(`https://github.com/search?q=${search}&type=repositories`, '_blank');
  };

  const toggleSelect = (name) => {
    setSelectedNames(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const handleBulkDelete = async () => {
    if (selectedNames.length === 0) return;
    if (!window.confirm(`Delete ${selectedNames.length} selected repo(s) from workspace?`)) return;
    for (const name of selectedNames) {
      try {
        await axios.delete(`${API_URL}/workspace/${encodeURIComponent(name)}`);
      } catch (e) {
        console.warn(e);
      }
    }
    setRepos(prev => prev.filter(r => !selectedNames.includes(r.name)));
    setSelectedNames([]);
    setIsSelectionMode(false);
  };

  const copyPath = async (repo) => {
    const pathToCopy = repo.path || `workspace/${repo.name}`;
    try {
      await navigator.clipboard.writeText(pathToCopy);
      setCopiedName(repo.name);
      setTimeout(() => setCopiedName(null), 2000);
    } catch (e) {
      alert('Failed to copy');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderGit2 size={22} />
            Cloned Repositories
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setIsSelectionMode(prev => !prev); setSelectedNames([]); }}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              {isSelectionMode ? 'Cancel' : 'Select'}
            </button>
            {isSelectionMode && selectedNames.length > 0 && (
              <button
                type="button"
                className="btn"
                onClick={handleBulkDelete}
                style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--danger)' }}
              >
                <Trash2 size={14} />
                Delete ({selectedNames.length})
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={fetchWorkspace}
              disabled={loading}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              {loading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
              <span style={{ marginLeft: '6px' }}>Refresh</span>
            </button>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
          </div>
        </div>
        <div className="modal-body">
          {error && (
            <div className="banner banner-error" style={{ marginBottom: '12px' }}>
              {error}
            </div>
          )}
          {loading && repos.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px' }} />
              Loading workspace…
            </div>
          ) : repos.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <FolderGit2 size={40} style={{ opacity: 0.5, marginBottom: '12px' }} />
              <p style={{ margin: 0 }}>No cloned repositories in workspace yet.</p>
              <p style={{ margin: '8px 0 0', fontSize: '13px' }}>Run an analysis to clone a repo.</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {repos.map((repo) => (
                <li
                  key={repo.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '12px',
                    marginBottom: '8px',
                  }}
                >
                  {isSelectionMode && (
                    <label style={{ display: 'flex', alignItems: 'center', marginRight: '12px' }}>
                      <input type="checkbox" checked={selectedNames.includes(repo.name)} onChange={() => toggleSelect(repo.name)} />
                    </label>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                      {repo.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <HardDrive size={12} />
                        {formatSize(repo.size)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {formatDate(repo.mtime)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => copyPath(repo)}
                      title="Copy path"
                      style={{ padding: '8px' }}
                    >
                      {copiedName === repo.name ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => openOnGitHub(repo.name)}
                      title="Search on GitHub"
                      style={{ padding: '8px' }}
                    >
                      <ExternalLink size={16} />
                    </button>
                    {!isSelectionMode && (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleDelete(repo.name)}
                        disabled={deleting === repo.name}
                        title="Delete from workspace"
                        style={{ padding: '8px', background: 'var(--danger)', color: 'white', border: 'none' }}
                      >
                        {deleting === repo.name ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
