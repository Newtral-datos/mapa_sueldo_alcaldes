document.addEventListener("DOMContentLoaded", function() {
  mapboxgl.accessToken = 'pk.eyJ1IjoibmV3dHJhbCIsImEiOiJjazJrcDY4Y2gxMmg3M2JvazU4OXV6NHZqIn0.VO5GkvBq_PSJHvX7T8H9jQ';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/newtral/cm7vts7c801hx01s2c7j32acs',
    center: [-3.7038, 40.4168],
    zoom: 5
  });

  map.on('load', function() {
    map.addSource('ISPA_FINAL_DATOS_ALCALDES', {
      type: 'vector',
      url: 'mapbox://newtral.codxt6so'
    });

    map.addLayer({
      id: 'ispa-final-datos-alcaldes',
      type: 'fill',
      source: 'ISPA_FINAL_DATOS_ALCALDES',
      'source-layer': 'ISPA_FINAL_DATOS_ALCALDES',
      paint: {
        'fill-color': '#FF5733',
        'fill-opacity': 0.5,
        'fill-outline-color': '#000000'
      }
    });

    const popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true
    });

    function showPopup(feature, lngLat) {
      const ayuntamiento = feature.properties.AYUNTAMIENTO || 'Desconocido';
      const provincia = feature.properties.PROVINCIA || 'Desconocida';
      const nombre = feature.properties.NOMBRE || 'Sin información';
      const partido = feature.properties.PARTIDO || 'No disponible';
      const sueldo = feature.properties.SUELDO_TXT || '0,00 €';
      const dedicacion = feature.properties.DEDICACIÓN || 'No especificado';

      popup
        .setLngLat(lngLat)
        .setHTML(`
          <div class="popup-container">
            <div class="popup-header">
              <span class="popup-ayuntamiento">${ayuntamiento}</span> 
              <span class="popup-provincia">(${provincia})</span>
            </div>
            <div class="popup-body">
              <div class="popup-nombre"><strong>${nombre}</strong></div>
              <div class="popup-dedicacion">Dedicación: ${dedicacion}</div>
              <div class="popup-partido">${partido}</div>
            </div>
            <div class="popup-sueldo">${sueldo}</div>
          </div>
        `)
        .addTo(map);
    }

    map.on('click', 'ispa-final-datos-alcaldes', function(e) {
      showPopup(e.features[0], e.lngLat);
    });

    const salaryFilter = document.getElementById("salaryFilter");
    const salaryValue = document.getElementById("salaryValue");
    const dedicationFilter = document.getElementById("dedicationFilter");

    function updateSalaryValue(value) {
      const formattedSalary = Number(value).toLocaleString("es-ES");
      salaryValue.innerHTML = `<span style="white-space: nowrap;">${formattedSalary} €</span>`;
    }

    updateSalaryValue(salaryFilter.value);

    function applyCombinedFilters() {
      const salaryThreshold = Number(salaryFilter.value);
      const selectedDedication = dedicationFilter.value;

      let filters = ['all'];
      const salaryFilterExpr = ['>=', ['to-number', ['get', 'SUELDO']], salaryThreshold];
      const dedicationFilterExpr = selectedDedication !== "all" 
        ? ['==', ['get', 'DEDICACIÓN'], selectedDedication]
        : ['all'];

      filters = ['all', salaryFilterExpr];
      if (selectedDedication !== "all") {
        filters.push(dedicationFilterExpr);
      }

      map.setFilter('ispa-final-datos-alcaldes', filters);
    }

    salaryFilter.addEventListener("input", function() {
      updateSalaryValue(this.value);
      const min = Number(this.min);
      const max = Number(this.max);
      const percentage = ((this.value - min) / (max - min)) * 100;
      this.style.background = `linear-gradient(to right, #ddd ${percentage}%, #01f3b3 ${percentage}%)`;
      applyCombinedFilters();
    });

    dedicationFilter.addEventListener("change", function() {
      applyCombinedFilters();
    });

    document.getElementById('randomLocation').addEventListener('click', function() {
      setTimeout(() => {
        const polygons = map.queryRenderedFeatures({ layers: ['ispa-final-datos-alcaldes'] });
        
        if (polygons.length === 0) {
          alert('No se encontraron polígonos visibles. Prueba a acercar más el mapa.');
          return;
        }

        const randomFeature = polygons[Math.floor(Math.random() * polygons.length)];
        const center = turf.center(randomFeature).geometry.coordinates;

        map.flyTo({ center, zoom: 6 });
        showPopup(randomFeature, center);
      }, 500);
    });

    const geocoder = new MapboxGeocoder({ 
      accessToken: mapboxgl.accessToken, 
      mapboxgl: mapboxgl, 
      placeholder: "   Buscar ubicación...", 
      marker: false, 
      flyTo: {
        zoom: 8,
        speed: 0.5,
        curve: 2 
      }
    });
    document.getElementById("geocoder-container").appendChild(geocoder.onAdd(map));

    geocoder.on('result', function() {
      console.log("Ubicación seleccionada, restableciendo filtro de sueldo.");
      salaryFilter.value = salaryFilter.min;
      updateSalaryValue(salaryFilter.min);
      salaryFilter.style.background = `linear-gradient(to right, #ddd 0%, #01f3b3 0%)`;
      applyCombinedFilters();
    });
  });
});