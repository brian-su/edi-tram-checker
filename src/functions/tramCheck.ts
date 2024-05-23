import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { tramDetails } from './tramStops';
import axios from 'axios';
import { TramResponse } from './tramResponses';

export async function tramCheck(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	const lat = parseFloat(request.query.get('lat'));
	const long = parseFloat(request.query.get('long'));
	const direction = request.query.get('direction');

	const closestStop = tramDetails
		.filter((x) => x.direction === direction)
		.map((x) => {
			// Could do this better with Haversine formula. But this *should* suffice?
			// For ref: https://www.calculator.net/distance-calculator.html
			const distance = Math.sqrt(Math.pow(lat - x.latitude, 2) + Math.pow(long - x.longitude, 2));
			return {
				id: x.stopId,
				name: x.stopName,
				distance: distance
			};
		})
		.sort((a, b) => a.distance - b.distance)[0];

	const tramUrl = `https://edinburghtrams.com/api/stop/${closestStop.id}`;
	const tramResponse = (await axios.get<TramResponse>(tramUrl)).data;

	if ((tramResponse.busTimes.length = 0)) return { body: `Tram times for ${closestStop.name} are currently unavailable` };

	const toReturn = tramResponse.busTimes.map((x) => {
		const times = x.timeDatas.map((t) => {
			return { time: t.time, mins: t.minutes };
		});
		return {
			name: closestStop.name,
			times: times,
			// Not 100% when these apply tbh
			globalDisruption: x.globalDisruption,
			serviceDisruption: x.serviceDisruption,
			busStopDisruption: x.busStopDisruption,
			serviceDiversion: x.serviceDiversion
		};
	});

	return { jsonBody: toReturn };
}

app.http('tramCheck', {
	methods: ['GET', 'POST'],
	authLevel: 'anonymous',
	handler: tramCheck
});
