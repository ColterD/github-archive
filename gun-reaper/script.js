// Fetch data from the Gun Violence Archive API
fetch('https://www.gunviolencearchive.org/api/v2/reports?mass=yes')
	.then(response => response.json())
	.then(data => {
		// Get the incident and source links of the most recent mass shooting
		const mostRecentShooting = data.data[0];
		const incidentLink = mostRecentShooting.incident_url;
		const sourceLink = mostRecentShooting.sources[0].url;

		// Calculate the time elapsed since the last mass shooting
		const now = new Date();
		const elapsedTime = now - new Date(mostRecentShooting.date);

		// Display the time elapsed and shooting information
		const countdownElement = document.getElementById('countdown');
		const shootingInfoElement = document.getElementById('shooting-info');
		const incidentLinkElement = document.getElementById('incident-link');
		const sourceLinkElement = document.getElementById('source-link');

		setInterval(() => {
			const minutes = Math.floor(elapsedTime / 60000);
			const seconds = Math.floor((elapsedTime % 60000) / 1000);
			countdownElement.textContent = `Time since the last mass shooting: ${minutes} minutes and ${seconds} seconds`;

			shootingInfoElement.textContent = `The most recent mass shooting occurred in ${mostRecentShooting.city}, ${mostRecentShooting.state}, and resulted in ${mostRecentShooting.injured} injured and ${mostRecentShooting.killed} killed.`;

			// Set the incident and source links
			incidentLinkElement.href = incidentLink;
			sourceLinkElement.href = sourceLink;

			elapsedTime += 1000;
		}, 1000);

		// Create an analog clock using the Analog.js library
		const clockElement = document.getElementById('clock');
		const clock = new AnalogClock(clockElement, {
			hours: now.getHours(),
			minutes: now.getMinutes(),
			seconds: now.getSeconds()
		});
	})
	.catch(error => {
		console.error('Error fetching data from API:', error);
	});
