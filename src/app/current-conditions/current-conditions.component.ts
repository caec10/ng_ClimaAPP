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
  currentConditionsByZip: ConditionsAndZip[] = [];
  private alive = true;
  private conditionsSubscription: Subscription | undefined;

  constructor(private weatherService: WeatherService, private locationService: LocationService) {}

  ngOnInit(): void {
    this.conditionsSubscription = this.weatherService.currentConditions$.subscribe((data: ConditionsAndZip[]) => {
      setTimeout(() => {
        this.currentConditionsByZip = data;
        console.log('Datos actualizados:', this.currentConditionsByZip);
      },500);
    });
  }

  ngOnDestroy(): void {
    // Desactiva el componente y desuscribe la suscripción al destruir el componente
    this.alive = false;
    if (this.conditionsSubscription) {
      this.conditionsSubscription.unsubscribe(); // Desuscribirse para evitar fugas de memoria
    }
  }

  // Elimina las condiciones climáticas al cerrar la pestaña
  onCloseTab(zipcode: string): void {
    this.locationService.removeLocation(zipcode);
    this.weatherService.removeCurrentConditions(zipcode);
  }
}
