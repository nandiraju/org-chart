import React, { useState } from 'react';
import { Plus, UserPlus, Users, LayoutDashboard, Settings, Edit2, X, AlertTriangle } from 'lucide-react';
import { OrgChartWrapper } from './components/OrgChartWrapper';
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

function App() {
  const [data, setData] = useState<Member[]>(initialData);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [parentId, setParentId] = useState<string>(initialData[0].id);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const addMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;

    const newMember: Member = {
      id: Math.random().toString(36).substr(2, 9),
      parentId: parentId || '',
      name,
      role,
      imageUrl: `https://i.pravatar.cc/150?u=${Math.random()}`,
    };

    setData([...data, newMember]);
    setName('');
    setRole('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    const updatedData = data.map(m => 
      m.id === editingMember.id ? { ...m, name: editingMember.name, role: editingMember.role } : m
    );
    setData(updatedData);
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

    setData(data.filter(m => !idsToDelete.has(m.id)));
    
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
            <span style={{ fontWeight: 600 }}>Chart View</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>
            <Users size={18} />
            <span>Team management</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>
            <Settings size={18} />
            <span>Settings</span>
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
