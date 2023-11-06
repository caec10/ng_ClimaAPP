  import { Injectable } from '@angular/core';
  import { EventBusService } from './event-bus.service';

  export const LOCATIONS = 'locations'; // Utilizamos una constante para el nombre del elemento en el localStorage

  @Injectable()
  export class LocationService {
    locations: string[] = [];

    constructor(private eventBus: EventBusService) {
      this.loadLocationsFromLocalStorage();
    }

    // Cargar las ubicaciones almacenadas en el localStorage al inicializar el servicio
    private loadLocationsFromLocalStorage(): void {
      const locString = localStorage.getItem(LOCATIONS);
      if (locString) {
        this.locations = JSON.parse(locString);
      }
    }

    // Agregar una nueva ubicación
    addLocation(zipcode: string): void {
      if (!this.locations.includes(zipcode)) { 
        this.locations.push(zipcode);
        this.updateLocationsInLocalStorage();
        this.emitLocationUpdate();
      } else {
        console.log('El código postal ya está en la lista.');
      }
    }
    

    // Remover una ubicación existente
    removeLocation(zipcode: string): void {
      const index = this.locations.indexOf(zipcode);
      if (index !== -1) {
        this.locations.splice(index, 1);
        this.updateLocationsInLocalStorage();
        this.emitLocationUpdate();
      }
    }

    // Actualizar las ubicaciones en el localStorage
    private updateLocationsInLocalStorage(): void {
      localStorage.setItem(LOCATIONS, JSON.stringify(this.locations));
    }

    // Emitir una actualización de ubicaciones a través del servicio EventBus
    private emitLocationUpdate(): void {
      this.eventBus.emitLocationUpdate(this.locations);
    }
  }
