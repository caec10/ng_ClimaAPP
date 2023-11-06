import { Injectable, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { WeatherData } from './current-conditions/current-conditions.type';
import { ConditionsAndZip } from './conditions-and-zip.type';
import { Forecast } from './forecasts-list/forecast.type';
import { EventBusService } from './event-bus.service';
import { map, take } from 'rxjs/operators';

@Injectable()
export class WeatherService {
  static URL = 'https://api.openweathermap.org/data/2.5';
  static APPID = '5a4b2d457ecbef9eb2a71e480b947604';
  static ICON_URL = 'https://raw.githubusercontent.com/udacity/Sunshine-Version-2/sunshine_master/app/src/main/res/drawable-hdpi/';
  
  private _timeSetSubject: BehaviorSubject<number> = new BehaviorSubject<number>(7200000);
  private currentConditionsSubject: BehaviorSubject<ConditionsAndZip[]> = new BehaviorSubject<ConditionsAndZip[]>([]);
  public currentConditions$: Observable<ConditionsAndZip[]> = this.currentConditionsSubject.asObservable();

  constructor(private http: HttpClient, private eventBus: EventBusService) {
    this.eventBus.onLocationUpdate().subscribe((locations: string[]) => {
      if (locations && locations.length > 0) {
        locations.forEach(location => this.addCurrentConditions(location));
      }
    });
  }

  get timeSet$(): BehaviorSubject<number> {
    return this._timeSetSubject;
  }

  setCustomCacheTime(time: number): void {
    this._timeSetSubject.next(time);
    console.log('Tiempo en milisegundos para hacer la petición', time);
  }

  addCurrentConditions(zipcode: string): void {
    console.log("Inicio de agregar", zipcode);
    if (!zipcode || zipcode.trim() === '') {
      console.error('Código postal no válido', zipcode);
      return;
    }
    
    this.http.get<WeatherData>(`${WeatherService.URL}/weather?zip=${zipcode},us&units=imperial&APPID=${WeatherService.APPID}`)
      .subscribe(
        data => {
          if (!data || Object.keys(data).length === 0) {
            console.log('Los datos recibidos están vacíos');
            return;
          }
          const updatedConditions = { zip: zipcode, data };
  
          // Verificar si la condición ya existe en el array
          const currentConditions = this.currentConditionsSubject.getValue();
          const existingCondition = currentConditions.find(condition => condition.zip === zipcode);
  
          if (!existingCondition) {
            this.currentConditionsSubject.next([...currentConditions, updatedConditions]);
            console.log('Datos agregados:', updatedConditions);
          } else {
            console.log('La condición ya existe:', existingCondition);
          }
        },
        error => {
          console.error('Error en la solicitud HTTP:', error);
          console.error('Mensaje de error:', error.message);
        }
      );
    console.log("Fin de agregar", zipcode);
  }
  
    

  removeCurrentConditions(zipcode: string): void {
    const conditions = this.currentConditionsSubject.getValue();
    const index = conditions.findIndex(condition => condition.zip === zipcode);
    if (index !== -1) {
      conditions.splice(index, 1);
      this.currentConditionsSubject.next(conditions);
      console.log('Datos eliminados:', conditions);
    }
  }

  getForecast(zipcode: string): Observable<Forecast> {
    const cacheKey = 'forecast_' + zipcode;
    const cachedData = localStorage.getItem(cacheKey);
  
    const timeSet = this._timeSetSubject.value; // Obtiene el valor actual del tiempo de caché
  
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
  
      if (Date.now() - timestamp < timeSet) {
        return new Observable(observer => {
          observer.next(data);
          observer.complete();
        });
      } else {
        console.log('¡Tiempo de caché expirado! Haciendo una nueva solicitud para', zipcode);
      }
    }
  
    // Si no hay datos en caché o el tiempo ha expirado, realiza una solicitud nueva
    return this.http.get<Forecast>(`${WeatherService.URL}/forecast/daily?zip=${zipcode},us&units=imperial&cnt=5&APPID=${WeatherService.APPID}`).pipe(
      map(data => {
        const cacheData = {
          data,
          timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        return data;
      })
    );
  }
  

  getWeatherIcon(id): string {
    if (id >= 200 && id <= 232)
      return WeatherService.ICON_URL + "art_storm.png";
    else if (id >= 501 && id <= 511)
      return WeatherService.ICON_URL + "art_rain.png";
    else if (id === 500 || (id >= 520 && id <= 531))
      return WeatherService.ICON_URL + "art_light_rain.png";
    else if (id >= 600 && id <= 622)
      return WeatherService.ICON_URL + "art_snow.png";
    else if (id >= 801 && id <= 804)
      return WeatherService.ICON_URL + "art_clouds.png";
    else if (id === 741 || id === 761)
      return WeatherService.ICON_URL + "art_fog.png";
    else
      return WeatherService.ICON_URL + "art_clear.png";
  }


  refreshCurrentConditions(locations: string[]): void {
    if (locations && locations.length > 0) {
      const currentConditions = this.currentConditionsSubject.getValue();
      locations.forEach(location => {
        if (!currentConditions.some(condition => condition.zip === location)) {
          this.addCurrentConditions(location);
        }
      });
    }
  }
  
}