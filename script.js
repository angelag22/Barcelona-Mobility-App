/**
 * Barcelona Mobility App - Bicing Inteligente
 * Versión: Perfecta 1.0
 */

async function obtenerBicing() {
    const contenedor = document.getElementById('lista-estaciones');
    if (!contenedor) return;

    contenedor.innerHTML = "<p style='color: blue;'>📍 Activando GPS y buscando estaciones...</p>";

    // 1. Verificamos si el navegador tiene GPS
    if (!navigator.geolocation) {
        contenedor.innerHTML = "❌ Tu móvil no permite geolocalización.";
        return;
    }

    // 2. Pedimos la posición actual
    navigator.geolocation.getCurrentPosition(async (posicion) => {
        const latUser = posicion.coords.latitude;
        const lonUser = posicion.coords.longitude;

        try {
            // 3. Llamada a la API de Bicing
            const respuesta = await fetch('https://api.citybik.es/v2/networks/bicing');
            const data = await respuesta.json();
            const estacionesOriginales = data.network.stations;

            // 4. Procesamos y ordenamos por distancia
            let estacionesProcesadas = estacionesOriginales.map(est => {
                const dist = calcularDistancia(latUser, lonUser, est.latitude, est.longitude);
                return { ...est, distancia: dist };
            });

            estacionesProcesadas.sort((a, b) => a.distancia - b.distancia);

            // 5. Dibujamos los resultados (Top 5 más cercanas)
            contenedor.innerHTML = ""; // Limpiar mensaje de carga
            
            estacionesProcesadas.slice(0, 5).forEach(est => {
                // Lógica para detectar e-bikes (distintos campos posibles)
                const extra = est.extra || {};
                const ebikes = extra.ebikes ?? extra.electric_bikes ?? 0;
                const totalBicis = est.free_bikes ?? 0;
                const mecanicas = Math.max(0, totalBicis - ebikes);

                const card = document.createElement('div');
                card.style.cssText = "background:#f9f9f9; padding:15px; border-radius:10px; margin-bottom:10px; border-left: 5px solid #e30613; text-align:left; box-shadow: 0 2px 5px rgba(0,0,0,0.1);";
                
                card.innerHTML = `
                    <strong style="font-size:1.1em;">📍 ${est.name}</strong><br>
                    <span style="color:#666;">📏 A ${formatDist(est.distancia)} de ti</span><br>
                    <div style="margin-top:8px;">
                        <span style="background:#ffeded; padding:3px 8px; border-radius:5px;">⚡ <b>${ebikes}</b> Eléctricas</span>
                        <span style="background:#eee; padding:3px 8px; border-radius:5px; margin-left:5px;">⚙️ <b>${mecanicas}</b> Mecánicas</span>
                    </div>
                    <div style="margin-top:8px; font-size:0.9em;">
                        🔓 <b>${est.empty_slots}</b> huecos libres
                    </div>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${est.latitude},${est.longitude}&travelmode=walking" 
                       target="_blank" 
                       style="display:inline-block; margin-top:10px; color:#007bff; text-decoration:none; font-weight:bold;">
                       🚶 Ir caminando →
                    </a>
                `;
                contenedor.appendChild(card);
            });

        } catch (error) {
            contenedor.innerHTML = "❌ Error al conectar con Bicing. Inténtalo de nuevo.";
            console.error(error);
        }

    }, (err) => {
        contenedor.innerHTML = "⚠️ Error: Debes permitir el acceso al GPS para ver lo que tienes cerca.";
    }, { enableHighAccuracy: true });
}

// Función matemática para distancias (Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function formatDist(km) {
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}
            estaciones.sort((a, b) => a.distancia - b.distancia);

            contenedor.innerHTML = "";
            const top = estaciones.slice(0, 5);
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
                wrapper.appendChild(document.createElement('br'));

                const metros = estacion.distancia * 1000;
                const distText = document.createElement('div');
                distText.textContent = `Distancia: ${formatDist(metros)}`;
                wrapper.appendChild(distText);

                // Intentar detectar bicis eléctricas en "extra"
                const extra = estacion.extra || {};
                const ebikesField = (typeof extra.ebikes === 'number') ? extra.ebikes
                                  : (typeof extra.electric_bikes === 'number' ? extra.electric_bikes : null);

                const bikes = document.createElement('div');
                if (ebikesField !== null && typeof estacion.free_bikes === 'number') {
                    const eb = ebikesField;
                    const total = estacion.free_bikes;
                    const mec = Math.max(0, total - eb);
                    bikes.textContent = `🚲 Eléctricas: ${eb} | ⚙️ Mecánicas: ${mec} (Total: ${total}) | 🔓 Huecos: ${estacion.empty_slots}`;
                } else {
                    // fallback: sólo total si no hay campo separado
                    bikes.textContent = `🚲 Bicis: ${estacion.free_bikes} | 🔓 Huecos: ${estacion.empty_slots}`;
                }
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

// Devuelve km
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function formatDist(metros) {
    if (metros < 1000) return `${Math.round(metros)} metros`;
    return `${(metros / 1000).toFixed(1)} km`;
}
