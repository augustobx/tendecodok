import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Tendeco POS',
        short_name: 'Tendeco',
        description: 'Sistema de Gestión e Inventario',
        start_url: '/',
        display: 'standalone', // Esto oculta la barra de direcciones del navegador
        background_color: '#ffffff',
        theme_color: '#4f46e5', // Color índigo que usas en tu diseño
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}