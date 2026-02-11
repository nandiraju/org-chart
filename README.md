# OrgViz Pro - Organizational Chart

A futuristic, high-fidelity organizational chart application built with React, TypeScript, and D3-Org-Chart.

## How to use

### Expanding the Organizational Data (Adding Members)

1. **Locate the "Add New Member" form** in the left sidebar.
2. **Fill in the details**: Enter the full name and role of the new team member.
3. **Select a Manager**: Use the dropdown to select who this member reports to.
4. **Submit**: Click "Add to Chart" to instantly update the visualization.

### Interacting with Chart Nodes

Each node in the chart represents a team member and provides several ways to expand or modify data:

- **Expand/Collapse**: Click the `+` or `-` button at the bottom of a node to show or hide its subordinates.
- **Edit Data**: Click the **Pen icon** in the top-right corner of a node. This will populate the sidebar with the member's current data, allowing you to update their name or role.
- **Delete Node**: Click the **Trash icon** in the top-right corner to remove a member from the chart.
- **Auto-Selection**: Clicking anywhere on a node's body will automatically select that member as the "Reports to" parent for the next member you add.

## Tech Stack

- **React 19**
- **TypeScript**
- **D3-Org-Chart**
- **Lucide React** (Icons)
- **Vite** (Build tool)
