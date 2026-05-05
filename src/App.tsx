import React, { useState } from 'react';
import { Plus, UserPlus, Users, LayoutDashboard, Settings, Edit2, X, AlertTriangle, Download, Upload, FolderOpen, Save, Check, ChevronDown, ChevronUp, Maximize } from 'lucide-react';
import { OrgChartWrapper, type OrgChartRef } from './components/OrgChartWrapper';
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', cursor: 'pointer' }}>
            <LayoutDashboard size={18} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.7 }}>Active Chart</span>
               <span style={{ fontWeight: 600 }}>{activeChart.name}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', position: 'relative' }}>
            <FolderOpen size={18} />
            <select 
              value={currentChartId} 
              onChange={(e) => setCurrentChartId(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'inherit', width: '100%', cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
            >
              {Object.values(charts).map(c => (
                <option key={c.id} value={c.id} style={{ background: '#1e293b' }}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer' }} onClick={resetChart}>
            <Plus size={18} />
            <span>New Chart</span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>
            <Upload size={18} />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={importCSV} style={{ display: 'none' }} />
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer' }} onClick={exportToCSV}>
            <Download size={18} />
            <span>Export CSV</span>
          </div>

          <div style={{ margin: '1rem 0', height: '1px', backgroundColor: 'var(--border)' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.7, paddingLeft: '0.75rem' }}>Navigation</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => chartRef.current?.expandAll()}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                title="Expand All"
              >
                <ChevronDown size={14} /> Expand
              </button>
              <button 
                onClick={() => chartRef.current?.collapseAll()}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                title="Collapse All"
              >
                <ChevronUp size={14} /> Collapse
              </button>
            </div>
            <button 
              onClick={() => chartRef.current?.fit()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
              title="Fit to Screen"
            >
              <Maximize size={14} /> Fit to Screen
            </button>
          </div>

          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              padding: '0.75rem', 
              backgroundColor: showSavedFeedback ? '#059669' : '#2563eb', 
              color: 'white', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              marginTop: '1rem',
              transition: 'all 0.3s ease'
            }} 
            onClick={manualSave}
          >
            {showSavedFeedback ? <Check size={18} /> : <Save size={18} />}
            <span style={{ fontWeight: 600 }}>{showSavedFeedback ? 'Saved!' : 'Save Chart'}</span>
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
