import { Component } from '@angular/core';
import { WeatherService } from '../weather.service';
import { ActivatedRoute } from '@angular/router';
import { Forecast } from './forecast.type';

@Component({
  selector: 'app-forecasts-list',
  templateUrl: './forecasts-list.component.html',
  styleUrls: ['./forecasts-list.component.css']
})
export class ForecastsListComponent {

  zipcode: string; // Variable para almacenar el código postal
  forecast: Forecast; // Variable para almacenar el pronóstico

  constructor(protected weatherService: WeatherService, private route: ActivatedRoute) {
    // Suscripción a los cambios en los parámetros de la URL
    this.route.params.subscribe(params => {
      this.zipcode = params['zipcode']; // Asignación del código postal de la URL
      // Obtención del pronóstico del servicio de clima usando el código postal
      this.weatherService.getForecast(this.zipcode)
        .subscribe(data => this.forecast = data); // Almacenamiento del pronóstico recibido
    });
  }
}
