import { X } from "lucide-react";
import { DebugLog } from "@/pages/Home";

interface DebugPanelProps {
  debugLogs: DebugLog[];
  setDebugMode: (value: boolean) => void;
}

const DebugPanel = ({ debugLogs, setDebugMode }: DebugPanelProps) => {
  const getTypeColor = (type: DebugLog['type']) => {
    switch (type) {
      case 'file':
        return 'text-blue-300';
      case 'url':
        return 'text-purple-300';
      case 'config':
        return 'text-yellow-300';
      case 'generation':
        return 'text-green-300';
      case 'download':
        return 'text-orange-300';
      case 'sheet':
        return 'text-indigo-300';
      case 'app':
        return 'text-gray-300';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white text-xs font-mono p-3 z-50 max-h-48 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <h5 className="text-sm font-bold">Debug Console</h5>
          <button onClick={() => setDebugMode(false)} className="text-gray-400 hover:text-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1">
          {debugLogs.map((log, index) => (
            <div key={index} className="py-0.5">
              <span className={getTypeColor(log.type)}>
                [{log.type.toUpperCase()}]
              </span>{' '}
              {log.message}
            </div>
          ))}
          {debugLogs.length === 0 && (
            <div className="py-0.5 text-gray-400">No logs yet. Actions will be logged here.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
