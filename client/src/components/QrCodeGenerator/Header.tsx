import { QrCode } from "lucide-react";

interface HeaderProps {
  debugMode: boolean;
  setDebugMode: (value: boolean) => void;
}

const Header = ({ debugMode, setDebugMode }: HeaderProps) => {
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center">
            <QrCode className="mr-2 text-primary h-6 w-6" />
            QR code all the things!
          </h1>
          <div>
            <button 
              onClick={toggleDebugMode} 
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <span className="mr-2">{debugMode ? 'Debug Mode: ON' : 'Debug Mode: OFF'}</span>
              <span className={`relative inline-block w-10 h-5 transition duration-200 ease-in-out rounded-full ${debugMode ? 'bg-primary' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 transition duration-200 ease-in-out transform bg-white rounded-full ${debugMode ? 'translate-x-5' : 'translate-x-0'}`}></span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
