async function obtenerBicing() {
    const contenedor = document.getElementById('lista-estaciones');
    contenedor.innerHTML = "Localizando tu posición...";

    // 1. Pedir permiso al GPS del móvil
    navigator.geolocation.getCurrentPosition(async (posicion) => {
        const latUsuario = posicion.coords.latitude;
        const lonUsuario = posicion.coords.longitude;

        contenedor.innerHTML = "Buscando estaciones cercanas...";

        try {
            const respuesta = await fetch('https://api.citybik.es/v2/networks/bicing');
            const datos = await respuesta.json();
            
            // 2. Calcular la distancia para CADA estación
            let estaciones = datos.network.stations.map(estacion => {
                const d = calcularDistancia(latUsuario, lonUsuario, estacion.latitude, estacion.longitude);
                return { ...estacion, distancia: d };
            });

            // 3. Ordenar de la más cercana a la más lejana
            estaciones.sort((a, b) => a.distancia - b.distancia);

            // 4. Mostrar las 5 más cercanas
            contenedor.innerHTML = "";
            estaciones.slice(0, 5).forEach(estacion => {
                const info = document.createElement('p');
                info.innerHTML = `
                    <strong>📍 ${estacion.name}</strong><br>
                    Distancia: ${(estacion.distancia * 1000).toFixed(0)} metros<br>
                    🚲 Bicis: ${estacion.free_bikes} | 🔓 Huecos: ${estacion.empty_slots}
                    <hr>
                `;
                contenedor.innerHTML += info.innerHTML;
            });

        } catch (error) {
            contenedor.innerHTML = "Error al obtener datos.";
        }
    }, () => {
        contenedor.innerHTML = "Debes activar el GPS para ver las más cercanas.";
    });
}

// Función matemática para calcular distancia entre dos coordenadas
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}
