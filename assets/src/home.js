


// Get references to the inputs and result list
const textInput = document.getElementById('textInput');
const dateInput = document.getElementById('dateInput');
const results = document.getElementById('results');

// Set the date input to today's date by default
const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
dateInput.value = today;

// Function to fetch and display data
async function fetchTrainData() {
    const userInput = textInput.value.trim();
    const date = dateInput.value;

    if (userInput && date) {
        const url = `https://data.cuzimmartin.dev/search-train/${encodeURIComponent(userInput)}?day=${date}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            // Clear previous results
            results.innerHTML = '';

            // Populate results
            data.trips.forEach(trip => {
                const li = document.createElement('li');

                // Create a link for each trip
                const link = document.createElement('a');
                link.href = `train.html?tripId=${encodeURIComponent(trip.id)}&stationId=${trip.origin.id}`;
                link.textContent = `${trip.line.name} >>> ${trip.destination.name}`;

                li.appendChild(link);
                results.appendChild(li);
            });
        } catch (error) {
            console.error('Error fetching train data:', error);
        }
    }
}

// Add event listeners to trigger fetch on input changes
textInput.addEventListener('input', fetchTrainData);
dateInput.addEventListener('input', fetchTrainData);