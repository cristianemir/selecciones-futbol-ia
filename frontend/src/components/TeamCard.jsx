import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Importamos la configuración que creamos antes
import { doc, getDoc } from 'firebase/firestore';
import { Trophy, Award, Globe, User } from 'lucide-react';

const TeamCard = ({ countryId }) => {
    const [teamData, setTeamData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTeamData = async () => {
            if (!countryId) return;

            setLoading(true);
            try {
                // Apuntamos al documento exacto en la colección 'selecciones' (ej: selecciones/MEX)
                const docRef = doc(db, 'selecciones', countryId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setTeamData(docSnap.data());
                } else {
                    console.log("No se encontró información para el país:", countryId);
                    setTeamData(null);
                }
            } catch (error) {
                console.error("Error obteniendo datos de Firebase:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, [countryId]);

    if (!countryId) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center justify-center text-slate-400 max-w-md w-full h-[340px]">
                <Globe size={48} className="mb-3 animate-pulse" />
                <p className="text-center font-medium">Esperando detección de playera...</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center max-w-md w-full h-[340px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 max-w-md w-full flex flex-col justify-between h-[340px]">
            {/* Encabezado de la Tarjeta */}
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {countryId}
                        </span>
                        <h2 className="text-3xl font-black text-slate-800 mt-1">{teamData?.nombre || 'Cargando...'}</h2>
                    </div>
                    <div className="text-5xl">
                        {countryId === 'MEX' && '🇲🇽'}
                        {countryId === 'ARG' && '🇦🇷'}
                        {countryId === 'BRA' && '🇧🇷'}
                        {countryId === 'GER' && '🇩🇪'}
                    </div>
                </div>

                <hr className="border-slate-100 my-3" />

                {/* Cuerpo de Estadísticas */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                        <Trophy className="text-amber-500" size={24} />
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Copas del Mundo</p>
                            <p className="text-lg font-bold text-slate-700">{teamData?.titulos_mundiales}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                        <Award className="text-blue-500" size={24} />
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Ranking FIFA</p>
                            <p className="text-lg font-bold text-slate-700">#{teamData?.ranking_fifa}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer de la tarjeta con el jugador histórico */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center gap-3 mt-4">
                <div className="bg-slate-800 p-2 rounded-lg">
                    <User className="text-blue-400" size={20} />
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Leyenda Histórica</p>
                    <p className="text-sm font-bold">{teamData?.jugador_historico || 'No disponible'}</p>
                </div>
            </div>
        </div>
    );
};

export default TeamCard;