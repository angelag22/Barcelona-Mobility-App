async function obtenerBicing() {
    const contenedor = document.getElementById('lista-estaciones');
    if (!contenedor) return;

    contenedor.innerHTML = "<p style='color: #e30613; font-weight: bold;'>📍 Buscando bicis cerca de ti...</p>";

    if (!navigator.geolocation) {
        contenedor.innerHTML = "❌ Tu móvil no tiene GPS o está desactivado.";
        return;
    }

    // Pedimos la posición con alta precisión
    navigator.geolocation.getCurrentPosition(async (posicion) => {
        const latUser = posicion.coords.latitude;
        const lonUser = posicion.coords.longitude;

        try {
            const respuesta = await fetch('https://api.citybik.es/v2/networks/bicing');
            const data = await respuesta.json();
            const estacionesOriginales = data.network.stations;

            // Procesamos y calculamos distancias
            let estaciones = estacionesOriginales.map(est => {
                const dist = calcularDistancia(latUser, lonUser, est.latitude, est.longitude);
                return { ...est, distancia: dist };
            });

            // Ordenamos: la más cercana primero
            estaciones.sort((a, b) => a.distancia - b.distancia);

            contenedor.innerHTML = ""; // Limpiamos el cargando

            // Mostramos las 10 más cercanas
            estaciones.slice(0, 10).forEach(est => {
                const extra = est.extra || {};
                
                // --- AQUÍ ESTÁ EL TRUCO PARA LAS EBIKES ---
                // Buscamos en todas las variantes posibles que envía la API
                const ebikes = extra.ebikes ?? extra.electric_bikes ?? 0;
                const total = est.free_bikes ?? 0;
                const mec = Math.max(0, total - ebikes);

                const card = document.createElement('div');
                card.style.cssText = "background:white; padding:15px; border-radius:12px; margin-bottom:15px; border-left: 6px solid #e30613; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: sans-serif;";
                
                card.innerHTML = `
                    <div style="font-weight: bold; font-size: 1.1em; color: #333;">📍 ${est.name}</div>
                    <div style="color: #666; font-size: 0.9em; margin-bottom: 8px;">📏 A ${formatDist(est.distancia)} de tu posición</div>
                    
                    <div style="display: flex; gap: 10px; margin-bottom: 8px;">
                        <div style="background: #fff0f0; padding: 5px 10px; border-radius: 6px; flex: 1; text-align: center;">
                            <span style="font-size: 1.2em;">⚡</span><br>
                            <b style="color: #e30613; font-size: 1.2em;">${ebikes}</b><br>
                            <small>Eléctricas</small>
                        </div>
                        <div style="background: #f0f0f0; padding: 5px 10px; border-radius: 6px; flex: 1; text-align: center;">
                            <span style="font-size: 1.2em;">⚙️</span><br>
                            <b style="color: #444; font-size: 1.2em;">${mec}</b><br>
                            <small>Mecánicas</small>
                        </div>
                    </div>

                    <div style="font-size: 0.9em; color: #555; border-top: 1px solid #eee; pt: 8px;">
                        🔓 <b>${est.empty_slots}</b> huecos libres para aparcar
                    </div>

                    <a href="https://www.google.com/maps/dir/?api=1&destination=${est.latitude},${est.longitude}&travelmode=walking" 
                       target="_blank" 
                       style="display: block; text-align: center; margin-top: 10px; background: #007bff; color: white; text-decoration: none; padding: 8px; border-radius: 6px; font-weight: bold;">
                       🚶 Ver ruta caminando
                    </a>
                `;
                contenedor.appendChild(card);
            });

        } catch (error) {
            contenedor.innerHTML = "❌ Error al conectar con el servidor de Bicing.";
            console.error(error);
        }

    }, (err) => {
        contenedor.innerHTML = "⚠️ No puedo mostrar nada sin tu GPS. Activa la ubicación.";
    }, { enableHighAccuracy: true });
}

// Cálculo de distancia precisa
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

// Formateador de distancia
function formatDist(km) {
    if (km < 1) return Math.round(km * 1000) + " metros";
    return km.toFixed(1) + " km";
}
