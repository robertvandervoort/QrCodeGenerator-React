import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { GeneratedQrCode } from "@/pages/Home";

interface QrPreviewModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  currentQr: GeneratedQrCode | null;
  downloadQrCode: () => void;
}

const QrPreviewModal = ({
  showModal,
  setShowModal,
  currentQr,
  downloadQrCode
}: QrPreviewModalProps) => {
  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-900">
              {currentQr?.filename || 'QR Code Preview'}
            </span>
            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 flex justify-center">
          <div className="text-center">
            {currentQr && (
              <>
                <img 
                  src={currentQr.dataUrl} 
                  className="w-64 h-64 mx-auto"
                  alt="QR Code Preview"
                />
                <p className="mt-4 text-xs break-all text-gray-600">{currentQr.url}</p>
              </>
            )}
          </div>
        </div>
        <DialogFooter className="bg-gray-50 px-4 py-3 sm:px-6">
          <Button
            onClick={downloadQrCode}
            className="inline-flex items-center bg-green-500 hover:bg-green-600 text-black font-bold"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QrPreviewModal;
