async function obtenerBicing() {
    const contenedor = document.getElementById('lista-estaciones');
    if (!contenedor) return console.warn('No se encontró el contenedor lista-estaciones');
    contenedor.innerHTML = "Localizando tu posición...";

    if (!('geolocation' in navigator)) {
        contenedor.innerHTML = "Tu navegador no soporta geolocalización.";
        return;
    }

    // Opciones para getCurrentPosition
    const opciones = {
        enableHighAccuracy: true,
        timeout: 10000, // 10s
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(async (posicion) => {
        const latUsuario = posicion.coords.latitude;
        const lonUsuario = posicion.coords.longitude;

        contenedor.innerHTML = "Buscando estaciones cercanas...";

        try {
            const respuesta = await fetch('https://api.citybik.es/v2/networks/bicing');
            if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
            const datos = await respuesta.json();

            if (!datos.network || !Array.isArray(datos.network.stations)) {
                contenedor.innerHTML = "No se encontraron estaciones en la respuesta.";
                return;
            }

            // Calcular la distancia para CADA estación
            let estaciones = datos.network.stations.map(estacion => {
                const d = calcularDistancia(latUsuario, lonUsuario, estacion.latitude, estacion.longitude);
                return { ...estacion, distancia: d };
            });

            // Ordenar de la más cercana a la más lejana
            estaciones.sort((a, b) => a.distancia - b.distancia);

            // Mostrar las 3 más cercanas
            contenedor.innerHTML = "";
            const top = estaciones.slice(0, 3);
            if (top.length === 0) {
                contenedor.innerHTML = "No hay estaciones disponibles.";
                return;
            }

            top.forEach(estacion => {
                const wrapper = document.createElement('div');
                wrapper.style.marginBottom = '12px';

                const title = document.createElement('strong');
                title.textContent = `📍 ${estacion.name}`;
                wrapper.appendChild(title);

                const br = document.createElement('br');
                wrapper.appendChild(br);

                const distText = document.createElement('div');
                const metros = estacion.distancia * 1000;
                distText.textContent = `Distancia: ${formatDist(metros)}`;
                wrapper.appendChild(distText);

                const bikes = document.createElement('div');
                bikes.textContent = `🚲 Bicis: ${estacion.free_bikes} | 🔓 Huecos: ${estacion.empty_slots}`;
                wrapper.appendChild(bikes);

                const hr = document.createElement('hr');
                hr.style.border = 'none';
                hr.style.height = '1px';
                hr.style.background = '#eee';
                hr.style.margin = '8px 0';

                wrapper.appendChild(hr);
                contenedor.appendChild(wrapper);
            });

        } catch (error) {
            console.error(error);
            contenedor.innerHTML = "Error al obtener datos del Bicing. Comprueba tu conexión.";
        }
    }, (error) => {
        console.warn('Geolocation error', error);
        switch (error.code) {
            case error.PERMISSION_DENIED:
                contenedor.innerHTML = "Debes activar el GPS / permitir la localización para ver las estaciones cercanas.";
                break;
            case error.POSITION_UNAVAILABLE:
                contenedor.innerHTML = "Posición no disponible.";
                break;
            case error.TIMEOUT:
                contenedor.innerHTML = "Tiempo de espera agotado al obtener la posición.";
                break;
            default:
                contenedor.innerHTML = "Error al obtener la posición.";
        }
    }, opciones);
}

// Función matemática para calcular distancia entre dos coordenadas (Devuelve km)
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

function formatDist(metros) {
    if (metros < 1000) {
        return `${Math.round(metros)} metros`;
    } else {
        return `${(metros / 1000).toFixed(1)} km`;
    }
            }
