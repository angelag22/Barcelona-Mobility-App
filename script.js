async function obtenerBicing() {
    const contenedor = document.getElementById('lista-estaciones');
    if (!contenedor) return;

    contenedor.innerHTML = "<p style='color: #e30613; font-weight: bold;'>📍 Buscando bicis cerca de ti...</p>";

    if (!navigator.geolocation) {
        contenedor.innerHTML = "❌ Tu móvil no tiene GPS o está desactivado.";
        return;
    }

    navigator.geolocation.getCurrentPosition(async (posicion) => {
        const latUser = posicion.coords.latitude;
        const lonUser = posicion.coords.longitude;

        try {
            const respuesta = await fetch('https://api.citybik.es/v2/networks/bicing');
            const data = await respuesta.json();
            const estacionesOriginales = data.network.stations;

            let estaciones = estacionesOriginales.map(est => {
                const dist = calcularDistancia(latUser, lonUser, est.latitude, est.longitude);
                return { ...est, distancia: dist };
            });

            estaciones.sort((a, b) => a.distancia - b.distancia);

            contenedor.innerHTML = ""; // Limpiamos el texto de carga

            // --- BOTÓN DE PLEGAR (Diseño neutro para no alterar el tuyo) ---
            const btnToggle = document.createElement('button');
            btnToggle.innerHTML = "🔼 Plegar / Desplegar lista";
            btnToggle.style.cssText = "width:100%; padding:10px; margin-bottom:15px; background:#444; color:white; border:none; border-radius:8px; font-weight:bold; font-family:sans-serif;";
            
            // Sub-contenedor que se oculta/muestra
            const subContenedor = document.createElement('div');
            
            btnToggle.onclick = () => {
                subContenedor.style.display = (subContenedor.style.display === "none") ? "block" : "none";
                btnToggle.innerHTML = (subContenedor.style.display === "none") ? "🔽 Ver estaciones" : "🔼 Plegar lista";
            };

            contenedor.appendChild(btnToggle);
            contenedor.appendChild(subContenedor);

            // --- LIMITADO A 5 ESTACIONES ---
            estaciones.slice(0, 5).forEach(est => {
                const extra = est.extra || {};
                const ebikes = extra.ebikes ?? extra.electric_bikes ?? 0;
                const total = est.free_bikes ?? 0;
                const mec = Math.max(0, total - ebikes);

                const card = document.createElement('div');
                // TU DISEÑO EXACTO
                card.style.cssText = "background:white; padding:15px; border-radius:12px; margin-bottom:15px; border-left: 6px solid #e30613; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: sans-serif; text-align: left;";
                
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

                    <div style="font-size: 0.9em; color: #555; border-top: 1px solid #eee; padding-top: 8px;">
                        🔓 <b>${est.empty_slots}</b> huecos libres para aparcar
                    </div>

                    <a href="https://www.google.com/maps/dir/?api=1&destination=${est.latitude},${est.longitude}&travelmode=walking" 
                       target="_blank" 
                       style="display: block; text-align: center; margin-top: 10px; background: #007bff; color: white; text-decoration: none; padding: 8px; border-radius: 6px; font-weight: bold;">
                       🚶 Ver ruta caminando
                    </a>
                `;
                subContenedor.appendChild(card);
            });

        } catch (error) {
            contenedor.innerHTML = "❌ Error al conectar con Bicing.";
        }

    }, (err) => {
        contenedor.innerHTML = "⚠️ Activa el GPS para ver las estaciones.";
    }, { enableHighAccuracy: true });
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function formatDist(km) {
    if (km < 1) return Math.round(km * 1000) + " metros";
    return km.toFixed(1) + " km";
}
