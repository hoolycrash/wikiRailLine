window.addEventListener('scroll', function() {
    var secondHeader = document.querySelector('.secondheader');
    if (window.scrollY >= 200) {
        secondHeader.style.display = 'block'; // Zeige das Div an
    } else {
        secondHeader.style.display = 'none'; // Verstecke das Div
    }
});


function getQueryParam(param) {
    var queryString = window.location.search.substring(1); // Remove the '?' at the start
    var params = queryString.split('&');
    for (var i = 0; i < params.length; i++) {
        var pair = params[i].split('=');
        if (decodeURIComponent(pair[0]) === param) {
            return decodeURIComponent(pair[1]);
        }
    }
    return null; // Return null if the parameter isn't found
}

var tripId = getQueryParam('tripId');

var stationId = getQueryParam('stationId');

fetch('https://data.cuzimmartin.dev/dynamic-trip?tripId=' + encodeURIComponent(tripId) + '&stationID=' + stationId    )  // Ersetze den Pfad durch den tatsächlichen Pfad zur Datei
    .then(response => response.json())
    .then(data => {
        const formatTime = (time) => {
            const hours = time.getHours().toString().padStart(2, '0');  // Stunden im lokalen Zeitformat
            const minutes = time.getMinutes().toString().padStart(2, '0');  // Minuten im lokalen Zeitformat
            return `${hours}:${minutes}`;
        };

        console.log(`Origin: ${data.trip.origin.name}`);
        console.log(`Departure: ${formatTime(new Date(data.trip.departure))}`);

        console.log(`Origin: ${data.trip.destination.name}`);
        console.log(`Departure: ${formatTime(new Date(data.trip.arrival))}`);

        document.getElementById('title').textContent = `${data.trip.line.name.split('(')[0]} >> ${data.trip.destination.name}`;

        document.getElementById('tinylinelabel').innerHTML = `&nbsp;${data.trip.line.name.split('(')[0]}&nbsp;`;
        document.getElementById('tinyStation').innerHTML = `${data.trip.destination.name}`;

        document.getElementById('linelabel').innerHTML = `&nbsp;${data.trip.line.name.split('(')[0]}&nbsp;`;
        document.getElementById('origin').innerHTML = `${data.trip.origin.name}`;

        if (data.trip.departure === data.trip.plannedDeparture) {
            document.getElementById('deptimes').innerHTML = `${formatTime(new Date(data.trip.plannedDeparture))} <span class="green">${formatTime(new Date(data.trip.departure))}</span>`;
        } else {
            document.getElementById('deptimes').innerHTML = `<s>${formatTime(new Date(data.trip.plannedDeparture))}</s> <span class="red">${formatTime(new Date(data.trip.departure))}</span>`;
        }

        document.getElementById('destination').innerHTML = `${data.trip.destination.name}`;

        if (data.trip.arrival === data.trip.plannedArrival) {
            document.getElementById('desttimes').innerHTML = `${formatTime(new Date(data.trip.plannedArrival))} <span class="green">${formatTime(new Date(data.trip.arrival))}</span>`;
        } else {
            document.getElementById('desttimes').innerHTML = `<s>${formatTime(new Date(data.trip.plannedArrival))}</s> <span class="red">${formatTime(new Date(data.trip.arrival))}</span>`;
        }


        document.getElementById('linelabel').classList.add(data.trip.line.productName);
        document.getElementById('linelabel').classList.add(data.trip.line.product);
        document.getElementById('linelabel').classList.add(data.trip.line.name.replace(/\s+/g, '') + data.trip.line.operator.id);
        document.getElementById('linelabel').classList.add(data.trip.line.operator.id);

        document.getElementById('seconheader').classList.add(data.trip.line.productName);
        document.getElementById('seconheader').classList.add(data.trip.line.product);
        document.getElementById('seconheader').classList.add(data.trip.line.name.replace(/\s+/g, '') + data.trip.line.operator.id);
        document.getElementById('seconheader').classList.add(data.trip.line.operator.id);

        document.getElementById('bigbox').classList.remove('hidden');

    })
    .catch(error => console.error('Fehler beim Laden der Datei:', error));



async function fetchContentJson() {
    const response = await fetch('https://data.cuzimmartin.dev/trip/' + encodeURIComponent(tripId) + '/polyline?stationID=' + stationId); // Ensure content.json is in the same directory
    if (!response.ok) throw new Error('Failed to load content.json');
    return response.json();
}

async function fetchGeoSearch(lat, lon) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&gscoord=${lat}%7C${lon}&gsradius=10000&list=geosearch&format=json&origin=*`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch GeoSearch data for coordinates: ${lat}, ${lon}`);
    return response.json();
}

async function fetchThumbnail(title) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=100&origin=*`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch thumbnail for title: ${title}`);
    return response.json();
}

async function populateTable() {
    const tableBody = document.querySelector('#contentTable tbody');
    tableBody.innerHTML = '';

    const seenPageIds = new Set(); // Track already processed Wikipedia page IDs

    try {
        const data = await fetchContentJson();
        const features = data.polyline.features;

        for (let i = 0; i < features.length; i++) {
            const feature = features[i];

            if (feature.properties?.id && feature.properties?.name) {
                // Add rows for features with ID and Name
                const row = document.createElement('tr');
                row.innerHTML = `

              <td colspan="2"><table class="noborder"><tr><td><img src="./assets/images/rail.svg" class="rail"></td><td><h2 class="accent">${feature.properties.name}</h2></td></tr></table></td>
              
              
            `;
                tableBody.appendChild(row);
            } else if (i % 5 === 0 && feature.geometry?.coordinates) {


                // Fetch GeoSearch data for every 20th point
                const [lon, lat] = feature.geometry.coordinates;
                const geoData = await fetchGeoSearch(lat, lon);

                for (const location of geoData.query.geosearch) {
                    if (!seenPageIds.has(location.pageid)) {
                        seenPageIds.add(location.pageid); // Mark this page ID as seen

                        const thumbnailData = await fetchThumbnail(location.title);
                        const pages = thumbnailData.query.pages;
                        const page = Object.values(pages)[0];
                        const thumbnail = page.thumbnail ? `<img src="${page.thumbnail.source}" alt="Thumbnail" class="thumbnail">` : '<img src="./assets/images/noimage.png" alt="No Image provided" class="thumbnail">';

                        const row = document.createElement('tr');
                        row.innerHTML = `


                  <td class="wide"><a href="https://en.wikipedia.org/?curid=${location.pageid}">${location.title} &nearr;</a></td>
                  <td>${thumbnail}</td>
                `;
                        tableBody.appendChild(row);
                        document.getElementById('loadingspinner').classList.add('hidden');
                        document.getElementById('contentTable').classList.remove('hidden');
                    }
                }


            }
        }




    } catch (error) {
        console.error(error);
        location.reload();
    }
}

// Run the function on page load
populateTable();