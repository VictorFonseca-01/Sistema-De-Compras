import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  X, 
  Camera, 
  Zap, 
  RefreshCcw, 
  AlertCircle,
  Keyboard
} from 'lucide-react';
import { clsx } from 'clsx';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState('');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader", {
      formatsToSupport: [ 
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.QR_CODE
      ]
    } as any);
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('traseira')) || devices[0];
          setCurrentCameraId(backCamera.id);
          
          await html5QrCode.start(
            backCamera.id,
            { 
              fps: 10, 
              qrbox: { width: 250, height: 150 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              stopScanner();
              onScan(decodedText);
            },
            () => {}
          );
        }
      } catch (err) {
        console.error("Erro ao iniciar câmera:", err);
        setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
      }
    };

    startScanner();

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
  };

  const toggleFlash = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        const track = (scannerRef.current as any).getRunningTrack();
        const capabilities = track.getCapabilities() as any;
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: !isFlashOn }]
          });
          setIsFlashOn(!isFlashOn);
        } else {
          alert('Recurso de lanterna não disponível neste hardware.');
        }
      } catch (err) {
        console.error("Erro Flash:", err);
      }
    }
  };

  const switchCamera = async () => {
    if (!scannerRef.current || cameras.length < 2) return;
    
    await stopScanner();
    const currentIndex = cameras.findIndex(c => c.id === currentCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    setCurrentCameraId(nextCamera.id);

    try {
      await scannerRef.current.start(
        nextCamera.id,
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          stopScanner();
          onScan(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.error("Erro ao trocar câmera:", err);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualValue.trim()) {
      stopScanner();
      onScan(manualValue.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 animate-in fade-in duration-300">
      <header className="p-6 flex justify-between items-center bg-slate-900 border-b border-white/5">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center text-white">
               <Camera size={20} />
            </div>
            <div>
               <h3 className="font-black text-white text-lg leading-tight uppercase tracking-tighter">Leitor de Ativos</h3>
               <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Escaneie o código de barras</p>
            </div>
         </div>
         <button 
           onClick={onClose}
           className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all active:scale-95"
         >
           <X size={20} />
         </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-10">
         {error ? (
           <div className="max-w-xs text-center space-y-6">
              <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl">
                 <AlertCircle size={40} />
              </div>
              <div className="space-y-2">
                 <h4 className="font-black text-white text-xl uppercase tracking-tighter leading-none">Erro de Acesso</h4>
                 <p className="text-slate-400 font-medium text-sm">{error}</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-white text-slate-950 py-4 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <RefreshCcw size={16} /> TENTAR NOVAMENTE
              </button>
           </div>
         ) : (
           <div className="relative w-full max-w-sm aspect-square">
              {/* Moldura de Leitura Estática */}
              <div id="reader" className="w-full h-full overflow-hidden rounded-[2.5rem] bg-slate-900 border-2 border-white/10"></div>
              
              {/* Scan Overlay UI */}
              <div className="absolute inset-0 border-[40px] border-slate-950/60 pointer-events-none rounded-[2.5rem]"></div>
              
              {/* Esquinas do Scanner */}
              <div className="absolute top-10 left-10 w-10 h-10 border-t-4 border-l-4 border-primary-500 rounded-tl-2xl pointer-events-none"></div>
              <div className="absolute top-10 right-10 w-10 h-10 border-t-4 border-r-4 border-primary-500 rounded-tr-2xl pointer-events-none"></div>
              <div className="absolute bottom-10 left-10 w-10 h-10 border-b-4 border-l-4 border-primary-500 rounded-bl-2xl pointer-events-none"></div>
              <div className="absolute bottom-10 right-10 w-10 h-10 border-b-4 border-r-4 border-primary-500 rounded-br-2xl pointer-events-none"></div>
              
              {/* Linha Animada de Scan */}
              <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-primary-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-pulse pointer-events-none"></div>
              
              <div className="absolute -bottom-16 left-0 right-0 text-center">
                 <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] animate-pulse">Apontar para a plaqueta</p>
              </div>
           </div>
         )}

         {/* Fallback Manual */}
         <div className="w-full max-w-sm pt-10 border-t border-white/5 space-y-6">
            <h4 className="font-black text-white text-center flex items-center justify-center gap-2">
               <Keyboard size={18} className="text-slate-500" />
               DIGITAÇÃO MANUAL
            </h4>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
               <input 
                 type="text" 
                 placeholder="Digite o patrimônio..."
                 className="flex-1 bg-white/5 border-2 border-transparent focus:border-primary-500 text-white rounded-2xl px-6 py-4 outline-none font-bold placeholder:text-slate-600 transition-all font-mono tracking-widest text-lg"
                 value={manualValue}
                 onChange={(e) => setManualValue(e.target.value)}
               />
               <button 
                 type="submit"
                 className={clsx(
                   "bg-primary-600 text-white px-6 rounded-2xl font-black transition-all active:scale-95 shadow-xl shadow-primary-500/20",
                   !manualValue.trim() && "opacity-50 grayscale"
                 )}
               >
                 OK
               </button>
            </form>
         </div>
      </main>

      <footer className="p-6 flex justify-center pb-10">
         <div className="flex gap-4">
            <button 
              onClick={toggleFlash}
              className={clsx(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                isFlashOn ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" : "bg-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
               <Zap size={20} />
            </button>
            <button 
              onClick={switchCamera}
              className="w-12 h-12 bg-white/5 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all"
            >
               <RefreshCcw size={20} />
            </button>
         </div>
      </footer>
    </div>

  );
}
