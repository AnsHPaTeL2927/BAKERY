import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import TableSkeleton from '../../components/loading/TableSkeleton';

export default function DataTable({
  columns,
  items,
  loading,
  emptyLabel = 'No records found',
  renderEmpty,
  renderActions,
  draggable = false,
  onReorder,
  theme = 'public',
  sticky = false,
  zebra = false,
  spacious = false,
  actionsPosition = 'end',
  minWidthClass = 'min-w-180',
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
  const headerBg = theme === 'admin' ? 'bg-admin-card' : 'bg-white';
  const rowHover = theme === 'admin' ? 'hover:bg-admin-bg/60' : 'hover:bg-blush-soft/30';
  const rowBorder = theme === 'admin' ? 'border-admin-border/60' : 'border-blush/40';
  const cellPadding = spacious ? 'px-5 py-4' : 'px-5 py-3';
  const actionsFirst = actionsPosition === 'start';

  const actionsHeaderCell = renderActions && (
    <th key="actions" className={`${cellPadding} font-semibold`}>
      Actions
    </th>
  );

  return (
    <div className={`overflow-x-auto rounded-3xl border shadow-sm ${theme === 'admin' ? 'border-admin-border bg-admin-card' : 'border-blush/70 bg-white'}`}>
      <table className={`w-full ${minWidthClass} text-left text-sm`}>
        <thead className={sticky ? `sticky top-0 z-10 ${headerBg}` : undefined}>
          <tr className={`border-b text-xs uppercase tracking-wide ${theme === 'admin' ? 'border-admin-border text-admin-muted' : 'border-blush/60 text-cocoa-soft/70'}`}>
            {draggable && <th className="w-10 px-3 py-3" aria-hidden="true" />}
            {actionsFirst && actionsHeaderCell}
            {columns.map((col) => (
              <th key={col.key} className={`${cellPadding} font-semibold whitespace-nowrap`}>
                {col.label}
              </th>
            ))}
            {!actionsFirst && actionsHeaderCell}
          </tr>
        </thead>
        <tbody>
          {loading && <TableSkeleton theme={theme} columns={colSpan} rows={10} />}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={colSpan} className="px-5 py-10">
                {renderEmpty || <p className="text-center text-cocoa-soft">{emptyLabel}</p>}
              </td>
            </tr>
          )}
          {!loading &&
            items.map((item, index) => {
              const actionsCell = renderActions && (
                <td key="actions" className={`${cellPadding} align-middle`}>
                  <div className="flex flex-wrap gap-1.5">{renderActions(item)}</div>
                </td>
              );

              return (
                <tr
                  key={item.id}
                  onDragOver={draggable ? (e) => { e.preventDefault(); setOverIndex(index); } : undefined}
                  onDrop={draggable ? (e) => { e.preventDefault(); handleDrop(index); } : undefined}
                  className={`border-b transition-colors last:border-0 ${rowBorder} ${rowHover} ${
                    zebra && index % 2 === 1 ? (theme === 'admin' ? 'bg-admin-bg/40' : 'bg-blush-soft/20') : ''
                  } ${dragIndex === index ? 'opacity-40' : ''} ${
                    draggable && overIndex === index && dragIndex !== null && dragIndex !== index ? 'bg-blush-soft/60' : ''
                  }`}
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
                  {actionsFirst && actionsCell}
                  {columns.map((col) => (
                    <td key={col.key} className={`${cellPadding} align-middle ${theme === 'admin' ? 'text-admin-text' : 'text-cocoa'}`}>
                      {col.render ? col.render(item, index) : item[col.key]}
                    </td>
                  ))}
                  {!actionsFirst && actionsCell}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
