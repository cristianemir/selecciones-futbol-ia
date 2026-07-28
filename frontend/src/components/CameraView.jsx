import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import {
    Camera,
    RefreshCw,
    Cpu,
    CloudLightning
} from 'lucide-react';
import axios from 'axios';
import {
    FilesetResolver,
    ObjectDetector
} from '@mediapipe/tasks-vision';

// Mapeo directo usando links de internet
const JERSEYS_MAP = {
    'ARG': { name: 'Argentina', image: '/assets/argentina.png' },
    'BRA': { name: 'Brasil', image: 'https://soccerpost.com/cdn/shop/files/AURORA_FJ4283-458_PHSFH001-2000_clipped_rev_1_grande.png?v=1712339750' },
    'GER': { name: 'Alemania', image: '/assets/aleph.png' },
    'MEX': { name: 'México', image: '/assets/mexico.png' }
};

// Ruta directa para el placeholder
const PLACEHOLDER_IMAGE = '/assets/placeholder-jersey.png';

const CameraView = ({ onCountryDetected }) => {
    const webcamRef = useRef(null);

    // Evita mandar varias solicitudes mientras una predicción sigue activa
    const requestInProgressRef = useRef(false);

    const [isCapturing, setIsCapturing] = useState(false);
    const [detector, setDetector] = useState(null);
    const [statusModel, setStatusModel] = useState(
        "Cargando Detector Local..."
    );

    // Estados para controlar la renderización dinámica del recuadro de presentación
    const [prediction, setPrediction] = useState(null);
    const [confidence, setConfidence] = useState(0);

    // 1. Inicializar el Detector de Objetos de MediaPipe en el Cliente
    useEffect(() => {
        const initDetector = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
                );

                const objectDetector =
                    await ObjectDetector.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath:
                                "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
                            delegate: "GPU"
                        },

                        // Umbral bajo para capturar variaciones de texturas
                        scoreThreshold: 0.30,

                        runningMode: "IMAGE"
                    });

                setDetector(objectDetector);
                setStatusModel("🛡️ Guardián Local Activo");
            } catch (error) {
                console.error(
                    "Error al cargar MediaPipe:",
                    error
                );

                setStatusModel(
                    "❌ Error al cargar Detector"
                );
            }
        };

        initDetector();
    }, []);

    const captureFrame = async () => {
        if (!webcamRef.current || !detector) {
            return;
        }

        // Evitar solicitudes simultáneas
        if (requestInProgressRef.current) {
            console.log(
                "⏳ Ya existe una petición Cloud en proceso."
            );
            return;
        }

        const video = webcamRef.current.video;

        // Verificar que el feed de la cámara esté listo
        if (!video || video.readyState !== 4) {
            console.log(
                "⏳ La cámara todavía no está lista."
            );
            return;
        }

        try {
            /*
             * A) INFERENCIA LOCAL
             *
             * MediaPipe EfficientDet no tiene una categoría específica
             * para camisetas de fútbol. Por ese motivo, se utiliza
             * únicamente para comprobar que haya una persona.
             */

            const windowDetections = detector.detect(video);
            const arrayDetections = windowDetections?.detections || [];

            if (arrayDetections.length === 0) {
                console.log(
                    "🛑 [Edge] Tráfico bloqueado: Escena completamente vacía."
                );
                return;
            }

            // Mostrar todas las categorías detectadas por MediaPipe
            arrayDetections.forEach((det) => {
                const category = det.categories?.[0];
                if (!category) return;

                const categoryName = category.categoryName;
                const score = category.score;

                console.log(
                    `🔍 [Paso de Filtro] Detectado: ${categoryName} (${Math.round(score * 100)}%)`
                );
            });

            const hayPersona = arrayDetections.some((det) => {
                const category = det.categories?.[0];
                if (!category) return false;

                return (
                    category.categoryName === "person" &&
                    category.score >= 0.45
                );
            });

            if (!hayPersona) {
                console.log(
                    "🛑 [Edge] Tráfico bloqueado: No se detectó una persona frente a la cámara."
                );
                return;
            }

            console.log(
                "✅ [Edge] Persona detectada. Enviando imagen al clasificador de camisetas."
            );

            /*
             * B) INFERENCIA EN LA NUBE
             */
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) {
                console.error("❌ No se pudo obtener la captura de la cámara.");
                return;
            }

            const byteString = atob(imageSrc.split(',')[1]);
            const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);

            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            const blob = new Blob([ab], { type: mimeString });
            const formData = new FormData();
            formData.append("file", blob, "screenshot.jpg");

            // ... (Código anterior de Axios y FormData se mantiene igual)
            requestInProgressRef.current = true;

            console.log(
                "🚀 [Cloud] ¡Persona detectada! Enviando frame real a FastAPI en Colab..."
            );

            const response = await axios.post("https://aqueduct-fantastic-aptitude.ngrok-free.dev/predict", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            console.log("📥 [Cloud] Respuesta recibida:", response.data);

            if (response.data && response.data.prediction) {
                const nuevaPrediccion = response.data.prediction;
                const nuevaConfianza = response.data.confidence || 0;

                // FILTRO INTELIGENTE: Solo actualiza si la certeza es mayor o igual al 75%
                if (nuevaConfianza >= 0.75) {
                    console.log(
                        `🧠 [IA Colab] Veredicto Asegurado: ${nuevaPrediccion} (${(nuevaConfianza * 100).toFixed(1)}%)`
                    );

                    setPrediction(nuevaPrediccion);
                    setConfidence(nuevaConfianza);
                    onCountryDetected(nuevaPrediccion);
                } else {
                    console.log(
                        `⚠️ [Filtro de Ruido] Ignorado ${nuevaPrediccion} por baja certeza (${(nuevaConfianza * 100).toFixed(1)}%). Se mantiene el equipo actual.`
                    );
                }
            } else {
                console.warn(
                    "⚠️ [IA Colab] El servidor respondió sin propiedades válidas.",
                    response.data
                );
            }

        } catch (error) {
            /*
             * Diferenciar errores del servidor,
             * errores de red y errores internos.
             */
            if (error.response) {
                console.error(
                    "❌ Error del servidor Cloud:",
                    {
                        status: error.response.status,
                        data: error.response.data
                    }
                );
            } else if (error.request) {
                console.error(
                    "❌ Error en la petición Cloud: No se recibió respuesta del servidor.",
                    error
                );
            } else {
                console.error(
                    "❌ Error al preparar la petición Cloud:",
                    error.message
                );
            }
        } finally {
            // Permitir una nueva petición
            requestInProgressRef.current = false;
        }
    };
    useEffect(() => {
        let interval;

        if (isCapturing && detector) {
            interval = setInterval(() => {
                captureFrame();
            }, 2000);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isCapturing, detector]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-4 px-2">
                <div className="flex items-center gap-2">
                    <Camera className="text-blue-600" size={24} />
                    <h2 className="text-xl font-bold text-slate-800">
                        Escáner Inteligente (Cascada)
                    </h2>
                </div>

                <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusModel.includes("Active") || statusModel.includes("🛡️")
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                >
                    {statusModel}
                </span>
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

            {/* Monitor de Arquitectura para la exposición */}
            <div className="mt-4 w-full max-w-md bg-slate-50 rounded-xl p-3 border border-slate-100 flex gap-4 text-xs text-slate-600 justify-around">
                <div className="flex items-center gap-1.5">
                    <Cpu size={14} className="text-slate-500" />
                    M1: Edge Detector (MediaPipe)
                </div>

                <div className="flex items-center gap-1.5">
                    <CloudLightning size={14} className="text-blue-500" />
                    M2: Cloud Classifier (FastAPI)
                </div>
            </div>

            <div className="mt-6 flex gap-4 mb-6">
                <button
                    onClick={() => setIsCapturing(!isCapturing)}
                    disabled={!detector}
                    className={`px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-all duration-200 flex items-center gap-2 ${isCapturing
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                        } disabled:opacity-50`}
                >
                    {isCapturing ? "Detener Escáner" : "Iniciar Escáner"}
                </button>

                <button
                    onClick={captureFrame}
                    disabled={!isCapturing || !detector}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 rounded-xl font-medium transition-all flex items-center gap-2"
                >
                    <RefreshCw size={18} />
                    Forzar Captura
                </button>
            </div>

            {/* Bloque del Recuadro de Presentación Dinámico */}
            <div className="w-full max-w-md contenedor-recuadro-rojo rounded-xl bg-slate-950 p-5" style={{ border: '3px solid red', textAlign: 'center' }}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Selección Detectada</h3>

                {prediction && JERSEYS_MAP[prediction] ? (
                    <div className="resultado-presentacion flex flex-col items-center animate-fade-in">
                        <img
                            src={JERSEYS_MAP[prediction].image}
                            alt={`Jersey de ${JERSEYS_MAP[prediction].name}`}
                            style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
                        />
                        <h2 className="text-2xl font-black text-white mt-3">
                            {JERSEYS_MAP[prediction].name}
                        </h2>
                        <p className="text-sm font-semibold text-emerald-400 mt-1">
                            Confianza: {confidence ? (confidence * 100).toFixed(1) : "95.0"}%
                        </p>
                    </div>
                ) : (
                    <div className="resultado-espera flex flex-col items-center opacity-60">
                        <img
                            src={PLACEHOLDER_IMAGE}
                            alt="Esperando detección"
                            style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
                        />
                        <p className="text-sm text-slate-400 mt-3 font-medium">Escaneando entorno...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CameraView;