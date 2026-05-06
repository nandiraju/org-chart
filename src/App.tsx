import React, { useState } from 'react';
import { Plus, Users, Edit2, X, AlertTriangle, Download, Upload, FolderOpen, Save, Check, ChevronDown, ChevronUp, Maximize } from 'lucide-react';
import { OrgChartWrapper, type OrgChartRef } from './components/OrgChartWrapper';
import { Tooltip } from './components/Tooltip';
import type { Member } from './types';

const initialData: Member[] = [
  {
    id: '1',
    parentId: '',
    name: 'Ian Bumbeishvili',
    role: 'Founder & CEO',
    imageUrl: 'https://avatars.githubusercontent.com/u/16142340?v=4',
  },
];

interface SavedChart {
  id: string;
  name: string;
  data: Member[];
}

const STORAGE_KEY = 'org_viz_charts_v2';
const CURRENT_CHART_KEY = 'org_viz_current_id';

function App() {
  const chartRef = React.useRef<OrgChartRef>(null);
  const [charts, setCharts] = useState<Record<string, SavedChart>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    const defaultId = 'default-chart';
    return {
      [defaultId]: { id: defaultId, name: 'Default Chart', data: initialData }
    };
  });

  const [currentChartId, setCurrentChartId] = useState<string>(() => {
    const savedId = localStorage.getItem(CURRENT_CHART_KEY);
    const availableIds = Object.keys(charts);
    return (savedId && charts[savedId]) ? savedId : (availableIds[0] || 'default-chart');
  });

  const activeChart = charts[currentChartId] || { data: initialData, name: 'New Chart' };
  const data = activeChart.data;

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  // Sync state when chart changes
  React.useEffect(() => {
    if (data.length > 0 && !parentId) {
      setParentId(data[0].id);
    }
  }, [currentChartId, data]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
    localStorage.setItem(CURRENT_CHART_KEY, currentChartId);
  }, [charts, currentChartId]);

  const updateActiveChartData = (newData: Member[]) => {
    setCharts(prev => ({
      ...prev,
      [currentChartId]: { ...prev[currentChartId], data: newData }
    }));
  };

  const addMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;

    const newMember: Member = {
      id: Math.random().toString(36).substr(2, 9),
      parentId: parentId || '',
      name,
      role,
      imageUrl: imageUrl.trim() || `https://i.pravatar.cc/150?u=${Math.random()}`,
    };

    updateActiveChartData([...data, newMember]);
    setName('');
    setRole('');
    setImageUrl('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    const updatedData = data.map(m => 
      m.id === editingMember.id ? { 
        ...m, 
        name: editingMember.name, 
        role: editingMember.role, 
        imageUrl: editingMember.imageUrl,
        parentId: editingMember.parentId
      } : m
    );
    updateActiveChartData(updatedData);
    setEditingMember(null);
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    
    const idsToDelete = new Set([deletingId]);
    let changed = true;
    
    // Recursively find all children to delete
    while (changed) {
      changed = false;
      data.forEach(m => {
        if (m.parentId && idsToDelete.has(m.parentId) && !idsToDelete.has(m.id)) {
          idsToDelete.add(m.id);
          changed = true;
        }
      });
    }

    updateActiveChartData(data.filter(m => !idsToDelete.has(m.id)));
    
    if (idsToDelete.has(parentId)) {
      setParentId(data.find(m => !idsToDelete.has(m.id))?.id || initialData[0].id);
    }
    
    setDeletingId(null);
  };

  const handleNodeClick = (node: any) => {
    setParentId(node.data.id);
  };

  const handleEditRequest = (member: Member) => {
    setEditingMember(member);
    setDeletingId(null);
  };

  const handleDeleteRequest = (id: string) => {
    setDeletingId(id);
    setEditingMember(null);
  };

  const resetChart = () => {
    const chartName = prompt('Enter a name for your new chart:', 'New Team Chart');
    if (chartName) {
      const newId = Math.random().toString(36).substr(2, 9);
      setCharts(prev => ({
        ...prev,
        [newId]: { id: newId, name: chartName, data: initialData }
      }));
      setCurrentChartId(newId);
    }
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        const importedData: Member[] = lines.slice(1).filter(line => line.trim()).map(line => {
          // Simple CSV parser for quoted fields
          const parts: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') inQuotes = !inQuotes;
            else if (line[i] === ',' && !inQuotes) {
              parts.push(current.trim());
              current = '';
            } else {
              current += line[i];
            }
          }
          parts.push(current.trim());

          const member: any = {};
          headers.forEach((header, index) => {
            member[header.trim()] = parts[index];
          });
          return member as Member;
        });

        const chartName = prompt('CSV Parsed! Enter a name for this imported chart:', file.name.replace('.csv', ''));
        if (chartName) {
          const newId = Math.random().toString(36).substr(2, 9);
          setCharts(prev => ({
            ...prev,
            [newId]: { id: newId, name: chartName, data: importedData }
          }));
          setCurrentChartId(newId);
        }
      } catch (error) {
        alert('Failed to parse CSV. Please ensure it follows the format exported by this tool.');
        console.error(error);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const exportToCSV = () => {
    const headers = ['id', 'parentId', 'name', 'role', 'imageUrl'];
    const rows = data.map(m => [
      m.id,
      m.parentId || '',
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.role.replace(/"/g, '""')}"`,
      m.imageUrl || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeChart.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const manualSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
    localStorage.setItem(CURRENT_CHART_KEY, currentChartId);
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  const memberToDelete = data.find(m => m.id === deletingId);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-section">
          <div style={{ width: '32px', height: '32px', backgroundColor: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Users style={{ color: 'white', margin: 'auto' }} size={20} />
          </div>
          <h1 style={{ marginLeft: '12px' }}>OrgViz Pro</h1>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', color: 'white', borderRadius: '12px', border: '1px solid #3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', marginBottom: '1rem' }}>
            <FolderOpen size={20} style={{ color: '#3b82f6' }} />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.6, letterSpacing: '0.05em' }}>Select Active Chart</span>
              <select 
                value={currentChartId} 
                onChange={(e) => setCurrentChartId(e.target.value)}
                style={{ background: 'none', border: 'none', color: 'white', width: '100%', cursor: 'pointer', outline: 'none', fontSize: '1rem', fontWeight: 600, marginTop: '2px' }}
              >
                {Object.values(charts).map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#1e293b' }}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.6, letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>Data Management</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Tooltip content="New Chart" description="Create a fresh organizational chart from scratch.">
                  <button onClick={resetChart} className="icon-btn-secondary">
                    <Plus size={18} />
                  </button>
                </Tooltip>
                
                <Tooltip content="Import CSV" description="Upload a previously exported CSV to restore a team structure.">
                  <label className="icon-btn-secondary" style={{ cursor: 'pointer' }}>
                    <Upload size={18} />
                    <input type="file" accept=".csv" onChange={importCSV} style={{ display: 'none' }} />
                  </label>
                </Tooltip>

                <Tooltip content="Export CSV" description="Download current chart as a CSV for backup or sharing.">
                  <button onClick={exportToCSV} className="icon-btn-secondary">
                    <Download size={18} />
                  </button>
                </Tooltip>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.6, letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>Navigation</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Tooltip content="Expand All" description="Reveal all members and levels in the hierarchy.">
                  <button onClick={() => chartRef.current?.expandAll()} className="icon-btn-secondary">
                    <ChevronDown size={18} />
                  </button>
                </Tooltip>

                <Tooltip content="Collapse All" description="Hide all branches and focus on the top level.">
                  <button onClick={() => chartRef.current?.collapseAll()} className="icon-btn-secondary">
                    <ChevronUp size={18} />
                  </button>
                </Tooltip>

                <Tooltip content="Fit to Screen" description="Auto-scale and center the chart to fit your window.">
                  <button onClick={() => chartRef.current?.fit()} className="icon-btn-secondary">
                    <Maximize size={18} />
                  </button>
                </Tooltip>

                <Tooltip content="Save Changes" description="Manually persist all updates to local storage.">
                  <button 
                    onClick={manualSave} 
                    className="icon-btn-secondary"
                    style={{ 
                      backgroundColor: showSavedFeedback ? '#059669' : '#1e293b',
                      borderColor: showSavedFeedback ? '#10b981' : '#334155',
                      color: showSavedFeedback ? 'white' : 'inherit'
                    }}
                  >
                    {showSavedFeedback ? <Check size={18} /> : <Save size={18} />}
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </nav>

        {deletingId ? (
          <div className="form-container animate-fade-in" style={{ backgroundColor: '#451a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ef4444' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fca5a5' }}>
              <AlertTriangle size={18} />
              Confirm Delete
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#fecaca', marginBottom: '1.5rem' }}>
              Are you sure you want to delete <strong>{memberToDelete?.name}</strong> and all their direct reports? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={confirmDelete}
                className="btn-primary" 
                style={{ flex: 1, backgroundColor: '#ef4444' }}
              >
                Delete
              </button>
              <button 
                onClick={() => setDeletingId(null)}
                className="btn-primary" 
                style={{ flex: 1, backgroundColor: '#334155' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : editingMember ? (
          <div className="form-container animate-fade-in" style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={18} />
                Edit Member
              </h3>
              <button onClick={() => setEditingMember(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role / Position</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingMember.role}
                  onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Image URL (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://example.com/photo.jpg"
                  value={editingMember.imageUrl || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, imageUrl: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Reports to</label>
                <select
                  className="form-input"
                  value={editingMember.parentId || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, parentId: e.target.value })}
                >
                  <option value="">No Parent (Root)</option>
                  {data
                    .filter(m => m.id !== editingMember.id) // Cannot report to self
                    .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', backgroundColor: '#3b82f6' }}>
                Update Member
              </button>
            </form>
          </div>
        ) : (
          <div className="form-container animate-fade-in" style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={18} />
              Add New Member
            </h3>
            <form onSubmit={addMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role / Position</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Software Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Image URL (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://example.com/photo.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Reports to</label>
                <select
                  className="form-input"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                >
                  {data.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
                <Plus size={18} />
                Add to Chart
              </button>
            </form>
          </div>
        )}
        
        <div style={{ marginTop: 'auto', padding: '1rem', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <p>Tip: Click on a node in the chart to automatically select it as the parent for a new member.</p>
        </div>
      </aside>

      <main className="main-content">
        <div className="org-chart-wrapper">
          <OrgChartWrapper 
            ref={chartRef}
            data={data} 
            onNodeClick={handleNodeClick} 
            onEdit={handleEditRequest}
            onDelete={handleDeleteRequest}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
