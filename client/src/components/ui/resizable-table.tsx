import React, { useState, useMemo } from "react";
import { GripHorizontal } from "lucide-react";
import { 
  DndContext, 
  closestCenter, 
  MouseSensor, 
  TouchSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  horizontalListSortingStrategy, 
  useSortable 
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  PanelGroup, 
  Panel, 
  PanelResizeHandle 
} from "react-resizable-panels";
import { cn } from "@/lib/utils";

interface ColumnDef {
  id: string;
  label: React.ReactNode;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

interface ResizableTableProps {
  columns: ColumnDef[];
  className?: string;
  allowReordering?: boolean;
  allowResizing?: boolean;
  onColumnsChange?: (newColumns: ColumnDef[]) => void;
}

interface ResizableTableWithChildrenProps extends ResizableTableProps {
  children: React.ReactNode;
}

// Resize handle component
const ResizeHandle = ({ className }: { className?: string }) => (
  <PanelResizeHandle className={cn(
    "w-2 hover:bg-gray-200 active:bg-gray-300 transition-colors duration-150 cursor-col-resize flex items-center justify-center",
    className
  )}>
    <div className="w-px h-4 bg-gray-300" />
  </PanelResizeHandle>
);

// Sortable header cell component
const SortableHeaderCell = ({ column, index }: { column: ColumnDef, index: number }) => {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "flex items-center p-2 font-medium text-xs text-left",
        column.className
      )}
      {...attributes}
      {...listeners}
    >
      <GripHorizontal className="h-3 w-3 mr-2 text-gray-400" />
      {column.label}
    </div>
  );
};

export const ResizableTableHeader: React.FC<ResizableTableProps> = ({
  columns: initialColumns,
  className,
  allowReordering = true,
  allowResizing = true,
  onColumnsChange
}) => {
  const [columns, setColumns] = useState<ColumnDef[]>(initialColumns);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    setColumns((prevColumns) => {
      const oldIndex = prevColumns.findIndex((col) => col.id === active.id);
      const newIndex = prevColumns.findIndex((col) => col.id === over.id);
      
      const newColumns = arrayMove(prevColumns, oldIndex, newIndex);
      if (onColumnsChange) {
        onColumnsChange(newColumns);
      }
      return newColumns;
    });
  };

  const panelSizes = useMemo(() => {
    return columns.map(column => column.width || 100 / columns.length);
  }, [columns]);

  const renderHeader = () => {
    if (allowReordering) {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
            <PanelGroup direction="horizontal" className="w-full">
              {columns.map((column, i) => (
                <React.Fragment key={column.id}>
                  <Panel 
                    minSize={column.minWidth || 5} 
                    maxSize={column.maxWidth || 50}
                    defaultSize={panelSizes[i]}
                  >
                    <SortableHeaderCell column={column} index={i} />
                  </Panel>
                  {i < columns.length - 1 && allowResizing && <ResizeHandle />}
                </React.Fragment>
              ))}
            </PanelGroup>
          </SortableContext>
        </DndContext>
      );
    }

    if (allowResizing) {
      return (
        <PanelGroup direction="horizontal" className="w-full">
          {columns.map((column, i) => (
            <React.Fragment key={column.id}>
              <Panel 
                minSize={column.minWidth || 5} 
                maxSize={column.maxWidth || 50}
                defaultSize={panelSizes[i]}
              >
                <div className={cn(
                  "p-2 font-medium text-xs text-left",
                  column.className
                )}>
                  {column.label}
                </div>
              </Panel>
              {i < columns.length - 1 && <ResizeHandle />}
            </React.Fragment>
          ))}
        </PanelGroup>
      );
    }

    return (
      <div className="flex w-full">
        {columns.map((column) => (
          <div 
            key={column.id}
            className={cn(
              "p-2 font-medium text-xs text-left",
              column.className
            )}
            style={{ width: `${column.width || 100/columns.length}%` }}
          >
            {column.label}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("border-b", className)}>
      {renderHeader()}
    </div>
  );
};

// This exports a full resizable table component
export const ResizableTable: React.FC<ResizableTableWithChildrenProps> = ({
  columns,
  children,
  className,
  allowReordering,
  allowResizing,
  onColumnsChange
}) => {
  return (
    <div className={cn("border rounded-md", className)}>
      <ResizableTableHeader 
        columns={columns}
        allowReordering={allowReordering}
        allowResizing={allowResizing}
        onColumnsChange={onColumnsChange}
      />
      {children}
    </div>
  );
};