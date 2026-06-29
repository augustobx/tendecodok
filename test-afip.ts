import Afip from '@afipsdk/afip.js';
import fs from 'fs';

async function probarConexion() {
    console.log("Iniciando conexión directa y gratuita con ARCA...");

    try {
        if (!fs.existsSync('./certificado.crt')) throw new Error("Falta certificado.crt");
        if (!fs.existsSync('./privada.key')) throw new Error("Falta privada.key");

        const afip = new Afip({
            CUIT: 27370766881,
            cert: './certificado.crt', // Rutas directas a los archivos
            key: './privada.key',
            production: false,
            res_folder: './' // Guardamos el caché temporal a la vista
        });

        const estado = await afip.ElectronicBilling.getServerStatus();

        console.log("-----------------------------------------");
        console.log("✅ ¡ÉXITO TOTAL! ESTAMOS DENTRO.");
        console.log("Estado de AFIP:", estado);
        console.log("-----------------------------------------");

    } catch (error: any) {
        console.log("-----------------------------------------");
        console.log("❌ RECHAZO DETECTADO:", error.message);
        console.log("-----------------------------------------");
    }
}

probarConexion();