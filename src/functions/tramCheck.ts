import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { tramDetails } from './tramStops';
import axios, { AxiosError, AxiosResponse } from 'axios';
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
	let response: AxiosResponse<TramResponse, any>;

	try {
		response = await axios.get<TramResponse>(tramUrl);
	} catch (error) {
		return { jsonBody: error };
	}
	const responseData = response.data;

	if (responseData.busTimes.length === 0) return { body: `Tram times for ${closestStop.name} are currently unavailable` };

	const toReturn = responseData.busTimes.map((x) => {
		const times = x.timeDatas.map((t) => {
			return { time: t.time, minutes: t.minutes };
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
	methods: ['GET'],
	authLevel: 'anonymous',
	handler: tramCheck
});
