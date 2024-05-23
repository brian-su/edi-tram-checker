export interface TramResponse {
	busTimes: BusTime[];
}

export interface BusTime {
	operatorId: string;
	stopId: string;
	stopName: string;
	refService: string;
	mnemoService: string;
	nameService: string;
	timeDatas: TimeData[];
	globalDisruption: boolean;
	serviceDisruption: boolean;
	busStopDisruption: boolean;
	serviceDiversion: boolean;
}

export interface TimeData {
	refDest: string;
	nameDest: string;
	day: number;
	time: string;
	minutes: number;
	equipment: string;
	vehicleStatus: string;
	reliability: string;
	event: string;
	type: string;
	terminus: string;
	journeyId: string;
	busId: string;
}
