import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw } from 'lucide-react';

const CameraView = ({ onCountryDetected }) => {
    const webcamRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);

    const captureFrame = async () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) return;

            try {
                const paisesPrueba = ['MEX', 'ARG', 'BRA', 'GER'];
                const paisAleatorio = paisesPrueba[Math.floor(Math.random() * paisesPrueba.length)];

                console.log("Frame capturado, enviando... (Simulado)");
                onCountryDetected(paisAleatorio);
            } catch (error) {
                console.error("Error al enviar el frame al servidor:", error);
            }
        }
    };

    useEffect(() => {
        let interval;
        if (isCapturing) {
            interval = setInterval(() => {
                captureFrame();
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isCapturing]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4">
                <Camera className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-slate-800">Escáner en Tiempo Real</h2>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-slate-900 w-full max-w-md aspect-video flex items-center justify-center border-2 border-slate-200">
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                />
                {!isCapturing && (
                    <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-white font-medium">
                        Escáner Pausado
                    </div>
                )}
            </div>

            <div className="mt-6 flex gap-4">
                <button
                    onClick={() => setIsCapturing(!isCapturing)}
                    className={`px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-all duration-200 flex items-center gap-2 ${isCapturing
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {isCapturing ? 'Detener Escáner' : 'Iniciar Escáner'}
                </button>

                <button
                    onClick={captureFrame}
                    disabled={!isCapturing}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-all flex items-center gap-2"
                >
                    <RefreshCw size={18} />
                    Forzar Captura
                </button>
            </div>
        </div>
    );
};

export default CameraView;