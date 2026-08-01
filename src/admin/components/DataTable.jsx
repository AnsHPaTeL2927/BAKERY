import { useState } from 'react';
import { GripVertical } from 'lucide-react';

export default function DataTable({
  columns,
  items,
  loading,
  emptyLabel = 'No records found',
  renderActions,
  draggable = false,
  onReorder,
}) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  function handleDrop(index) {
    if (dragIndex !== null && dragIndex !== index) {
      const reordered = [...items];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(index, 0, moved);
      onReorder?.(reordered);
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  const colSpan = columns.length + (renderActions ? 1 : 0) + (draggable ? 1 : 0);

  return (
    <div className="overflow-x-auto rounded-3xl border border-blush/70 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-blush/60 text-xs uppercase tracking-wide text-cocoa-soft/70">
            {draggable && <th className="w-10 px-3 py-3" aria-hidden="true" />}
            {columns.map((col) => (
              <th key={col.key} className="px-5 py-3 font-semibold">
                {col.label}
              </th>
            ))}
            {renderActions && <th className="px-5 py-3 font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={colSpan} className="px-5 py-8 text-center text-cocoa-soft">
                Loading…
              </td>
            </tr>
          )}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={colSpan} className="px-5 py-8 text-center text-cocoa-soft">
                {emptyLabel}
              </td>
            </tr>
          )}
          {!loading &&
            items.map((item, index) => (
              <tr
                key={item.id}
                onDragOver={draggable ? (e) => { e.preventDefault(); setOverIndex(index); } : undefined}
                onDrop={draggable ? (e) => { e.preventDefault(); handleDrop(index); } : undefined}
                className={`border-b border-blush/40 last:border-0 hover:bg-blush-soft/30 ${
                  dragIndex === index ? 'opacity-40' : ''
                } ${draggable && overIndex === index && dragIndex !== null && dragIndex !== index ? 'bg-blush-soft/60' : ''}`}
              >
                {draggable && (
                  <td
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                    className="w-10 cursor-grab px-3 py-3 text-cocoa-soft/50 active:cursor-grabbing"
                    title="Drag to reorder"
                  >
                    <GripVertical className="h-4 w-4" />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3 align-middle text-cocoa">
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
                {renderActions && (
                  <td className="px-5 py-3 align-middle">
                    <div className="flex flex-wrap gap-2">{renderActions(item)}</div>
                  </td>
                )}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
