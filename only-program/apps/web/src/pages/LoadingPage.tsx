import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoadingPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [errorHeader, setErrorHeader] = useState('');

    useEffect(() => {
        const fetchGate = async () => {
            try {
                // Consultar API Gate
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/gate/${slug}`);

                if (response.data && response.data.data) {
                    // Desencriptar Payload (Base64 -> JSON)
                    const decodedData = atob(response.data.data);
                    const payload = JSON.parse(decodedData);

                    if (payload.u) {
                        // Redirección Final
                        window.location.href = payload.u;
                    } else {
                        setErrorHeader('Destino no válido');
                    }
                } else {
                    setErrorHeader('Enlace expirado');
                }
            } catch (err) {
                console.error('Gate Error:', err);
                setErrorHeader('Enlace no disponible');
                // Opcional: Redirigir a SafePage o Home en caso de error
                // setTimeout(() => navigate('/'), 3000);
            }
        };

        // Esperar 2 segundos para mostrar animación (efecto psicológico de carga)
        const timer = setTimeout(() => {
            fetchGate();
        }, 2000);

        return () => clearTimeout(timer);
    }, [slug, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white relative overflow-hidden font-sans">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#ff2a8a_0%,_#3a002a_40%,_#150013_100%)] opacity-80"></div>

            <div className="relative z-10 text-center max-w-md w-full px-6">
                {/* Loader Animation */}
                <div className="mb-8 relative mx-auto w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#ff2a8a] border-r-[#ff2a8a] border-b-transparent border-l-transparent animate-spin"></div>
                    {/* Logo Placeholder - Puede ser dinámico si el usuario tiene logo */}
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,42,138,0.6)]">
                        <span className="text-3xl text-pink-600">💋</span>
                    </div>
                </div>

                {/* Text */}
                <h1 className="text-3xl font-bold mb-2 tracking-wide">
                    {errorHeader ? errorHeader : 'Verifying Access...'}
                </h1>
                <p className="text-gray-300 text-lg opacity-90">
                    {errorHeader ? 'Please try again later' : 'One moment, please wait.'}
                </p>
            </div>
        </div>
    );
};

export default LoadingPage;
