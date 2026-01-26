async function obtenerBicing() {
    const contenedor = document.getElementById('lista-estaciones');
    contenedor.innerHTML = "Cargando datos...";

    try {
        // Llamamos a la API gratuita de Citybik.es (sin registro)
        const respuesta = await fetch('https://api.citybik.es/v2/networks/bicing');
        const datos = await respuesta.json();
        
        const estaciones = datos.network.stations.slice(0, 3); // Cogemos las 3 primeras
        contenedor.innerHTML = ""; // Limpiamos el mensaje de carga

        estaciones.forEach(estacion => {
            const info = document.createElement('p');
            info.innerHTML = `
                <strong>📍 ${estacion.name}</strong><br>
                Bicis libres: ${estacion.free_bikes} | Huecos: ${estacion.empty_slots}
                <hr>
            `;
            contenedor.innerHTML += info.innerHTML;
        });
    } catch (error) {
        contenedor.innerHTML = "Error al conectar con el Bicing. Revisa tu internet.";
        console.error(error);
    }
}
