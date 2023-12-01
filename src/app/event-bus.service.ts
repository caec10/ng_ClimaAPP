import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class EventBusService {
  private locationEvents = new Subject<string[]>();
  private locationExistsEvents = new Subject<string>(); // Nuevo Subject para eventos de código postal existente

  // Método para emitir actualizaciones de ubicaciones
  emitLocationUpdate(locations: string[]): void {
    this.locationEvents.next(locations);
  }

  // Método para emitir eventos de código postal existente
  emitLocationExists(zipcode: string): void {
    this.locationExistsEvents.next(zipcode);
  }

  // Método para suscribirse a actualizaciones de ubicaciones
  onLocationUpdate(): Observable<string[]> {
    return this.locationEvents.asObservable();
  }

  // Método para suscribirse a eventos de código postal existente
  onLocationExists(): Observable<string> {
    return this.locationExistsEvents.asObservable();
  }
}
