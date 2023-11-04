import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class EventBusService {
  private locationEvents = new Subject<string[]>();

  // Método para emitir actualizaciones de ubicaciones
  emitLocationUpdate(locations: string[]): void {
    this.locationEvents.next(locations);
    console.log("Se emitió la actualización de ubicaciones correctamente");
  }

  // Método para suscribirse a actualizaciones de ubicaciones
  onLocationUpdate(): Observable<string[]> {
    console.log("Se ha suscrito a las actualizaciones de ubicaciones");
    return this.locationEvents.asObservable();
  }
}
