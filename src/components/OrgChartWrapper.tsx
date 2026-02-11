import React, { useEffect, useRef } from 'react';
import { OrgChart } from 'd3-org-chart';
import type { Member } from '../types';

interface Props {
  data: Member[];
  onNodeClick: (node: any) => void;
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
}

export const OrgChartWrapper: React.FC<Props> = ({ data, onNodeClick, onEdit, onDelete }) => {
  const d3Container = useRef<HTMLDivElement>(null);
  const chartRef = useRef<OrgChart | null>(null);

  useEffect(() => {
    if (data && d3Container.current) {
      try {
        if (!chartRef.current) {
          chartRef.current = new OrgChart();
        }

        const containerRect = d3Container.current.getBoundingClientRect();
        
        (chartRef.current as any)
          .container(d3Container.current)
          .data(data)
          .svgWidth(containerRect.width)
          .svgHeight(containerRect.height)
          .rootMargin(0)
          .nodeHeight(() => 150)
          .nodeWidth(() => 250)
          .childrenMargin(() => 50)
          .compactMarginBetween(() => 25)
          .compactMarginPair(() => 50)
          .onNodeClick((d: any) => {
            onNodeClick(d);
          })
          .nodeContent((d: any) => {
            const color = '#FFFFFF';
            const name = d.data?.name || 'Unknown';
            const role = d.data?.role || 'No Role';
            const imageUrl = d.data?.imageUrl || `https://i.pravatar.cc/100?u=${d.data?.id}`;
            const id = d.data?.id;
            
            return `
              <div style="font-family: 'Inter', sans-serif; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; width: ${
                d.width
              }px; height: ${d.height}px; color: ${color}; overflow: visible; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); position: relative; padding-top: 20px; box-sizing: border-box;">
                <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); width: 44px; height: 44px; border-radius: 50%; border: 2px solid #3b82f6; background-image: url('${imageUrl}'); background-size: cover; background-position: center; background-color: #1e293b; z-index: 10;"></div>
                
                <!-- Action Buttons -->
                <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 8px; z-index: 20;">
                   <div onclick="event.stopPropagation(); window.editMember('${id}')" style="background: #334155; border-radius: 4px; color: #94a3b8; cursor: pointer; padding: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.color='#3b82f6'; this.style.background='#1e293b'" onmouseout="this.style.color='#94a3b8'; this.style.background='#334155'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                   </div>
                   <div onclick="event.stopPropagation(); window.deleteMember('${id}')" style="background: #334155; border-radius: 4px; color: #94a3b8; cursor: pointer; padding: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.color='#ef4444'; this.style.background='#1e293b'" onmouseout="this.style.color='#94a3b8'; this.style.background='#334155'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                   </div>
                </div>

                <div style="font-weight: 700; font-size: 16px; text-align: center; padding: 0 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; box-sizing: border-box; margin-bottom: 4px;">${name}</div>
                <div style="font-size: 13px; color: #94a3b8; text-align: center; padding: 0 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; box-sizing: border-box;">${role}</div>
              </div>
            `;
          })
          .render();

        (window as any).editMember = (id: string) => {
          const member = data.find(m => m.id === id);
          if (member) onEdit(member);
        };
        (window as any).deleteMember = (id: string) => {
          onDelete(id);
        };

      } catch (error) {
        console.error('Error rendering Org Chart:', error);
      }

      const handleResize = () => {
        if (chartRef.current && d3Container.current) {
          const rect = d3Container.current.getBoundingClientRect();
          (chartRef.current as any)
            .svgWidth(rect.width)
            .svgHeight(rect.height)
            .render();
        }
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [data, onNodeClick, onEdit, onDelete]);

  return (
    <div className="org-chart-container" ref={d3Container} style={{ height: '100%', width: '100%', backgroundColor: '#0f172a', borderRadius: '0', overflow: 'hidden' }} />
  );
};
