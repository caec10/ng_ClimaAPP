import { WeatherData } from './current-conditions/current-conditions.type';

export interface ConditionsAndZip {
    zip: string;
    data: WeatherData;
}
