import { Component, OnDestroy, OnInit } from '@angular/core';
import { WeatherService } from '../weather.service';
import { Subscription } from 'rxjs';
import { ConditionsAndZip } from 'app/conditions-and-zip.type';
import { LocationService } from 'app/location.service';

@Component({
  selector: 'app-current-conditions',
  templateUrl: './current-conditions.component.html',
  styleUrls: ['./current-conditions.component.css']
})
export class CurrentConditionsComponent implements OnInit, OnDestroy {
  // Arreglo que almacena las condiciones climáticas por códigos postales
  currentConditionsByZip: ConditionsAndZip[] = [];

  // Variable de control para evitar problemas al desuscribirse de observables
  private alive = true;

  // Suscripción a la obtención de las condiciones climáticas
  private conditionsSubscription: Subscription | undefined;

  constructor(private weatherService: WeatherService, private locationService: LocationService) {}

  ngOnInit(): void {
    // Suscripción a la obtención de las condiciones climáticas
    this.conditionsSubscription = this.weatherService.currentConditions$.subscribe((data: ConditionsAndZip[]) => {
      // Actualiza las condiciones climáticas al recibir nuevos datos
        this.currentConditionsByZip = data;
        console.log('Datos actualizados:', this.currentConditionsByZip);
    });
  }

  ngOnDestroy(): void {
    // Al destruir el componente, se desactiva y desuscribe de las suscripciones
    this.alive = false;
    if (this.conditionsSubscription) {
      this.conditionsSubscription.unsubscribe(); // Desuscribirse para evitar fugas de memoria
    }
  }

  // Método para eliminar las condiciones climáticas al cerrar la pestaña
  onCloseTab(zipcode: string): void {
    // Elimina la ubicación del servicio de ubicación
    this.locationService.removeLocation(zipcode);
    // Elimina las condiciones climáticas del servicio de clima
    this.weatherService.removeCurrentConditions(zipcode);
  }
}
