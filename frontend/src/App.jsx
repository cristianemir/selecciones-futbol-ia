import React, { useState } from 'react';
import CameraView from './components/CameraView';
import TeamCard from './components/TeamCard';
import { ShieldAlert, RefreshCw } from 'lucide-react';

function App() {
  const [detectedCountry, setDetectedCountry] = useState(null);

  // Función para forzar un cambio manual de país y probar Firestore
  const simularDeteccion = (pais) => {
    setDetectedCountry(pais);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Barra de Navegación */}
      <header className="bg-slate-900 text-white py-5 px-6 shadow-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white font-black tracking-wider text-sm shadow-sm">
              IA
            </div>
            <h1 className="text-xl font-black tracking-tight">
              RECONOCIMIENTO DE CAMISETAS DE FÚTBOL
            </h1>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-green-400">
            Modo Servidor Cloud Listo
          </span>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">

        {/* Lado Izquierdo: Flujo de Video */}
        <div className="w-full max-w-md flex flex-col gap-4">
          <CameraView onCountryDetected={setDetectedCountry} />

          {/* Panel de pruebas rápidas para Firestore */}
          <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100">
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1">
              <RefreshCw size={12} /> Control de Testeo (Firestore)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {['MEX', 'ARG', 'BRA', 'GER'].map((pais) => (
                <button
                  key={pais}
                  onClick={() => simularDeteccion(pais)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${detectedCountry === pais
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {pais}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Panel Estadístico Interactivo */}
        <div className="w-full max-w-md flex flex-col gap-4">
          <TeamCard countryId={detectedCountry} />

          {detectedCountry && (
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex gap-3 text-xs text-blue-700 animate-fadeIn">
              <ShieldAlert size={18} className="shrink-0 text-blue-500" />
              <p>
                ¡Éxito! El identificador <strong>{detectedCountry}</strong> consultó exitosamente las estadísticas en tiempo real dentro de tu colección de <strong>Firebase Firestore</strong>.
              </p>
            </div>
          )}
        </div>

      </main>

      {/* Pie de Página */}
      <footer className="bg-white border-t border-slate-100 py-4 text-center text-xs text-slate-400 font-medium">
        Proyecto de Inteligencia Artificial &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default App;