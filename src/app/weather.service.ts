import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { WeatherData } from './current-conditions/current-conditions.type';
import { ConditionsAndZip } from './conditions-and-zip.type';
import { Forecast } from './forecasts-list/forecast.type';
import { EventBusService } from './event-bus.service';
import {  map } from 'rxjs/operators';

@Injectable()
export class WeatherService {
  // URLs y claves de API
  static URL = 'https://api.openweathermap.org/data/2.5';
  static APPID = '5a4b2d457ecbef9eb2a71e480b947604';
  static ICON_URL = 'https://raw.githubusercontent.com/udacity/Sunshine-Version-2/sunshine_master/app/src/main/res/drawable-hdpi/';

  // Subject para manejar el tiempo de caché
  private _timeSetSubject: BehaviorSubject<number> = new BehaviorSubject<number>(7200000);

  // Subject para almacenar las condiciones climáticas actuales
  private currentConditionsSubject: BehaviorSubject<ConditionsAndZip[]> = new BehaviorSubject<ConditionsAndZip[]>([]);

  // Observable para acceder a las condiciones climáticas actuales
  public currentConditions$: Observable<ConditionsAndZip[]> = this.currentConditionsSubject.asObservable();

  constructor(private http: HttpClient, private eventBus: EventBusService) {
    this.loadInitialConditions(); // Cargar condiciones iniciales al iniciar el servicio

    // Suscribirse a la actualización de ubicaciones
    this.eventBus.onLocationUpdate().subscribe((locations: string[]) => {
      if (locations && locations.length > 0) {
        // Agregar las condiciones climáticas para cada ubicación
        locations.forEach(location => this.addCurrentConditions(location));
      }
    });
  }

  // Obtiene el BehaviorSubject del tiempo de caché
  get timeSet$(): BehaviorSubject<number> {
    return this._timeSetSubject;
  }

  // Establece el tiempo personalizado de caché
  setCustomCacheTime(time: number): void {
    this._timeSetSubject.next(time);
  }




  // Método para cargar condiciones climáticas al iniciar la aplicación
  private loadInitialConditions(): void {
    const storedConditions = JSON.parse(localStorage.getItem('currentConditions') || '[]');
    if (storedConditions.length > 0) {
      this.currentConditionsSubject.next(storedConditions);
    }
  }
  // Método para actualizar el almacenamiento local cada vez que hay cambios
  private updateLocalStorage(conditions: ConditionsAndZip[]): void {
    localStorage.setItem('currentConditions', JSON.stringify(conditions));
  }

  // Método para manejar errores de la solicitud HTTP
  private handleError(error: any): Observable<never> {
    console.error('Error en la solicitud HTTP:', error);
    console.error('Mensaje de error:', error.message);
    return new Observable<never>(observer => {
      observer.error('Error en la solicitud HTTP');
    });
  }

    // Obtener el tiempo del último intento para un código postal
    private getLastAttemptTime(zipcode: string): number | null {
      const key = `lastAttempt_${zipcode}`;
      const storedTime = localStorage.getItem(key);
      return storedTime ? parseInt(storedTime, 10) : null;
    }
  
    // Establecer el tiempo del último intento para un código postal
    private setLastAttemptTime(zipcode: string, time: number): void {
      const key = `lastAttempt_${zipcode}`;
      localStorage.setItem(key, time.toString());
    }
  


    addCurrentConditions(zipcode: string): void {
      // Verificar si ya hemos intentado obtener datos para este código postal recientemente
      const lastAttemptTime = this.getLastAttemptTime(zipcode);
      const currentTime = Date.now();
      const timeSinceLastAttempt = currentTime - lastAttemptTime;
  
      if (lastAttemptTime && timeSinceLastAttempt < this._timeSetSubject.value) {
        return;
      }
  
      // Marcar el tiempo de este intento
      this.setLastAttemptTime(zipcode, currentTime);
  
      // Realizar la solicitud HTTP para obtener los datos climáticos actuales
      this.http
        .get<WeatherData>(`${WeatherService.URL}/weather?zip=${zipcode},us&units=imperial&APPID=${WeatherService.APPID}`)
        .subscribe(
          (data) => {
            // Verificar si los datos recibidos son válidos
            if (!data || Object.keys(data).length === 0) {
              console.log('Datos no válidos:', zipcode);
              alert('Datos climáticos no encontrados');
              return;  // No continuar si los datos no son válidos
            }
  
            // Verificar si el código postal ya está agregado
            const currentConditions = this.currentConditionsSubject.getValue();
            const existingCondition = currentConditions.find((condition) => condition.zip === zipcode);
  
            if (existingCondition) {
              console.log('El código postal ya está agregado:', existingCondition);
              // Emitir evento de código postal existente
              this.eventBus.emitLocationExists(zipcode);
              return;
            }
  
            const updatedConditions = { zip: zipcode, data };
  
            // Añadir las nuevas condiciones climáticas
            const newConditions = [...currentConditions, updatedConditions];
            this.currentConditionsSubject.next(newConditions);
            this.updateLocalStorage(newConditions); // Actualizar almacenamiento local
            console.log('Datos agregados:', updatedConditions);
          },
          (error) => {
            // Manejar el error aquí si es necesario
            console.error('Error al agregar las condiciones climáticas:', error);
            alert('Error al obtener datos climáticos');
  
            // En caso de error, eliminar el código postal del localStorage
            const currentConditions = this.currentConditionsSubject.getValue();
            const indexToRemove = currentConditions.findIndex((condition) => condition.zip === zipcode);
            if (indexToRemove !== -1) {
              currentConditions.splice(indexToRemove, 1);
              this.currentConditionsSubject.next(currentConditions);
              this.updateLocalStorage(currentConditions);
            }
          }
        );
    }

  
  
  // Elimina las condiciones climáticas para un código postal específico
  removeCurrentConditions(zipcode: string): void {
    const conditions = this.currentConditionsSubject.getValue();
    const index = conditions.findIndex(condition => condition.zip === zipcode);

    if (index !== -1) {
      conditions.splice(index, 1);
      this.currentConditionsSubject.next(conditions);
    }
  }

  // Obtiene las previsiones meteorológicas para un código postal dado
  getForecast(zipcode: string): Observable<Forecast> {
    const cacheKey = 'forecast_' + zipcode;
    const cachedData = localStorage.getItem(cacheKey);

    const timeSet = this._timeSetSubject.value;

    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const currentTime = Date.now();

      if (currentTime - timestamp < timeSet) {
        return new Observable(observer => {
          observer.next(data);
          observer.complete();
        });
      } else {
        console.log('¡Tiempo de caché expirado! Haciendo una nueva solicitud para', zipcode);
      }
    }

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

  // Obtiene el ícono del clima según el ID proporcionado
  getWeatherIcon(id): string {
    // Lógica para determinar el ícono meteorológico basado en el ID del clima
    // (Códigos de ícono y lógica de condición climática)
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


  // Actualiza las condiciones climáticas actuales para un conjunto de ubicaciones
  refreshCurrentConditions(locations: string[]): void {
    if (locations && locations.length > 0) {
      const currentConditions = this.currentConditionsSubject.getValue();
      locations.forEach(location => {
        // Añade las condiciones para las ubicaciones que no están en la lista actual
        if (!currentConditions.some(condition => condition.zip === location)) {
          this.addCurrentConditions(location);
        }
      });
    }
  }
}
