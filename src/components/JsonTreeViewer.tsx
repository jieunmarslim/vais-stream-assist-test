import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  Check, 
  Minimize2, 
  Maximize2, 
  Layers
} from 'lucide-react';

interface JsonTreeViewerProps {
  data: any;
  searchQuery?: string;
}

// Helper to gather all object/array paths up to maxDepth
function getAllPaths(obj: any, currentPath = '$', currentDepth = 0, maxDepth = 99): Set<string> {
  const paths = new Set<string>();
  if (currentDepth <= maxDepth) {
    paths.add(currentPath);
  }
  if (currentDepth >= maxDepth || obj === null || typeof obj !== 'object') {
    return paths;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      const childPath = `${currentPath}[${idx}]`;
      const sub = getAllPaths(item, childPath, currentDepth + 1, maxDepth);
      sub.forEach(p => paths.add(p));
    });
  } else {
    Object.keys(obj).forEach(key => {
      const childPath = `${currentPath}.${key}`;
      const sub = getAllPaths(obj[key], childPath, currentDepth + 1, maxDepth);
      sub.forEach(p => paths.add(p));
    });
  }
  return paths;
}

// Helper to get compact summary of collapsed object/array
function getCollapsedPreview(val: any): string {
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    return `[ ${val.length} items ]`;
  }
  if (val && typeof val === 'object') {
    const keys = Object.keys(val);
    if (keys.length === 0) return '{}';
    // If it has recognizable identifiers, show them
    if (val.id && typeof val.id === 'string') {
      return `{ id: "${val.id}", ... (${keys.length} keys) }`;
    }
    if (val.title && typeof val.title === 'string') {
      const shortTitle = val.title.length > 25 ? val.title.slice(0, 25) + '...' : val.title;
      return `{ title: "${shortTitle}", ... (${keys.length} keys) }`;
    }
    if (val.name && typeof val.name === 'string') {
      const parts = val.name.split('/');
      const shortName = parts[parts.length - 1] || val.name;
      return `{ name: ".../${shortName}", ... (${keys.length} keys) }`;
    }
    const sampleKeys = keys.slice(0, 3).join(', ');
    return `{ ${sampleKeys}${keys.length > 3 ? ', ...' : ''} } (${keys.length} keys)`;
  }
  return String(val);
}

export const JsonTreeViewer: React.FC<JsonTreeViewerProps> = ({ data, searchQuery = '' }) => {
  // Compute all available structural paths
  const allExpandablePaths = useMemo(() => {
    return getAllPaths(data, '$', 0, 99);
  }, [data]);

  // Level 1 paths (root only expanded)
  const level1Paths = useMemo(() => {
    return new Set<string>(['$']);
  }, []);

  // Level 2 paths (root and its direct children expanded)
  const level2Paths = useMemo(() => {
    return getAllPaths(data, '$', 0, 1);
  }, [data]);

  // Expanded paths state. Default to level 2 so top-level keys and direct array items are opened
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => level2Paths);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Sync expanded paths when data changes
  useEffect(() => {
    setExpandedPaths(level2Paths);
  }, [level2Paths]);

  // Auto-expand paths matching searchQuery
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim().toLowerCase();
    const matches = new Set<string>();

    const traverse = (obj: any, currentPath = '$') => {
      if (obj === null || typeof obj !== 'object') {
        if (String(obj).toLowerCase().includes(q)) {
          matches.add(currentPath);
        }
        return;
      }
      if (Array.isArray(obj)) {
        obj.forEach((item, idx) => {
          const childPath = `${currentPath}[${idx}]`;
          if (item === null || typeof item !== 'object') {
            if (String(item).toLowerCase().includes(q)) {
              matches.add(currentPath);
              matches.add(childPath);
            }
          }
          traverse(item, childPath);
        });
      } else {
        Object.entries(obj).forEach(([k, v]) => {
          const childPath = `${currentPath}.${k}`;
          const kMatch = k.toLowerCase().includes(q);
          const vPrimitiveMatch = (v === null || typeof v !== 'object') && String(v).toLowerCase().includes(q);
          if (kMatch || vPrimitiveMatch) {
            matches.add(currentPath);
            matches.add(childPath);
          }
          traverse(v, childPath);
        });
      }
    };

    traverse(data, '$');
    if (matches.size > 0) {
      setExpandedPaths(prev => new Set([...prev, ...matches]));
    }
  }, [data, searchQuery]);

  // Toggle single path
  const togglePath = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Collapse All (모두 접기 - 최상위 키만 표시)
  const handleCollapseAll = useCallback(() => {
    setExpandedPaths(level1Paths);
  }, [level1Paths]);

  // Expand All (모두 펼치기)
  const handleExpandAll = useCallback(() => {
    setExpandedPaths(new Set(allExpandablePaths));
  }, [allExpandablePaths]);

  // Copy node value
  const copyNodeValue = useCallback((val: any, path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const str = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
    navigator.clipboard.writeText(str);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 1400);
  }, []);

  // Recursive Node renderer
  const renderNode = (
    keyName: string | number | null,
    val: any,
    currentPath: string,
    depth: number
  ): React.ReactNode => {
    const isObject = val !== null && typeof val === 'object';
    const isArray = Array.isArray(val);
    const isExpanded = expandedPaths.has(currentPath);
    const isCopied = copiedPath === currentPath;

    // Filter check
    const query = searchQuery.trim().toLowerCase();
    const keyMatch = query && keyName !== null && String(keyName).toLowerCase().includes(query);
    const valStringMatch = query && !isObject && String(val).toLowerCase().includes(query);
    const hasFilterMatch = keyMatch || valStringMatch;

    if (!isObject) {
      // Primitive Leaf Node
      let valueColor = 'text-amber-300'; // number
      let displayValue = String(val);

      if (typeof val === 'string') {
        valueColor = 'text-emerald-400';
        displayValue = JSON.stringify(val);
      } else if (typeof val === 'boolean') {
        valueColor = 'text-purple-400 font-semibold';
      } else if (val === null) {
        valueColor = 'text-zinc-500 italic';
        displayValue = 'null';
      }

      return (
        <div 
          key={currentPath}
          className={`group flex items-start gap-1 py-0.5 px-1.5 hover:bg-zinc-900/60 rounded text-[11.5px] font-mono leading-relaxed transition-colors ${
            hasFilterMatch ? 'bg-amber-500/10 ring-1 ring-amber-500/30' : ''
          }`}
          style={{ paddingLeft: `${depth * 18 + 20}px` }}
        >
          {keyName !== null && (
            <span className="text-sky-300 font-semibold shrink-0 select-text">
              {typeof keyName === 'number' ? `[${keyName}]` : `"${keyName}"`}
              <span className="text-zinc-500 mx-1">:</span>
            </span>
          )}
          <span className={`${valueColor} break-all select-text font-normal`}>
            {displayValue}
          </span>
          <button
            onClick={(e) => copyNodeValue(val, currentPath, e)}
            className="opacity-0 group-hover:opacity-100 p-0.5 ml-1.5 text-zinc-500 hover:text-zinc-200 transition-opacity"
            title="Copy value"
          >
            {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      );
    }

    // Object or Array Node
    const entries = isArray 
      ? val.map((item: any, i: number) => [i, item])
      : Object.entries(val);
    const itemCount = entries.length;

    return (
      <div key={currentPath} className="text-[11.5px] font-mono leading-relaxed select-text">
        <div 
          onClick={() => togglePath(currentPath)}
          className={`group flex items-center gap-1 py-0.5 px-1 hover:bg-zinc-900/80 cursor-pointer rounded transition-colors ${
            hasFilterMatch ? 'bg-amber-500/10 ring-1 ring-amber-500/30' : ''
          }`}
          style={{ paddingLeft: `${depth * 18}px` }}
        >
          {/* Collapse / Expand icon */}
          <button 
            type="button"
            className="p-0.5 text-zinc-500 hover:text-zinc-200 rounded shrink-0 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            )}
          </button>

          {/* Key name */}
          {keyName !== null && (
            <span className="text-sky-300 font-semibold shrink-0">
              {typeof keyName === 'number' ? `[${keyName}]` : `"${keyName}"`}
              <span className="text-zinc-500 mx-1">:</span>
            </span>
          )}

          {/* Type bracket or collapsed summary */}
          {isExpanded ? (
            <span className="text-zinc-400 font-mono">
              {isArray ? '[' : '{'}
              <span className="text-[10px] text-zinc-500 ml-1.5 font-normal">
                {itemCount} {itemCount === 1 ? (isArray ? 'item' : 'key') : (isArray ? 'items' : 'keys')}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="text-zinc-400 font-mono">
                {getCollapsedPreview(val)}
              </span>
              <span className="text-[9.5px] bg-zinc-800/80 text-zinc-400 px-1.5 py-0.2 rounded border border-zinc-700/60 font-mono">
                {itemCount} {isArray ? 'items' : 'keys'}
              </span>
            </span>
          )}

          {/* Copy button */}
          <button
            onClick={(e) => copyNodeValue(val, currentPath, e)}
            className="opacity-0 group-hover:opacity-100 p-0.5 ml-auto text-zinc-500 hover:text-zinc-200 transition-opacity"
            title="Copy JSON"
          >
            {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>

        {/* Child items if expanded */}
        {isExpanded && (
          <div>
            {entries.map(([childKey, childVal]: [any, any]) => {
              const childPath = isArray 
                ? `${currentPath}[${childKey}]`
                : `${currentPath}.${childKey}`;
              return renderNode(childKey, childVal, childPath, depth + 1);
            })}
            <div 
              className="text-zinc-500 font-mono py-0.2"
              style={{ paddingLeft: `${depth * 18 + 20}px` }}
            >
              {isArray ? ']' : '}'}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-200 overflow-hidden">
      {/* Mini Controls Bar for Folding / Expansion */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-xs shrink-0 select-none">
        <div className="flex items-center gap-1">
          <span className="text-[10.5px] text-zinc-400 font-mono font-medium flex items-center gap-1 mr-2">
            <Layers className="h-3 w-3 text-sky-400" /> JSON Fold:
          </span>

          <button
            onClick={handleCollapseAll}
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10.5px] font-mono font-medium border border-zinc-700 flex items-center gap-1 transition-colors"
            title="최상위 키만 표시하고 하위 내용을 모두 수축 (Fold All)"
          >
            <Minimize2 className="h-2.5 w-2.5" /> Collapse All
          </button>

          <button
            onClick={handleExpandAll}
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10.5px] font-mono font-medium border border-zinc-700 flex items-center gap-1 transition-colors"
            title="모든 계층을 완전히 펼침 (Unfold All)"
          >
            <Maximize2 className="h-2.5 w-2.5" /> Expand All
          </button>
        </div>

        <div className="text-[10.5px] font-mono text-zinc-500">
          {expandedPaths.size} expanded / {allExpandablePaths.size} nodes
        </div>
      </div>

      {/* Tree Content Viewer */}
      <div className="flex-1 overflow-auto p-2.5 font-mono">
        {renderNode(null, data, '$', 0)}
      </div>
    </div>
  );
};
