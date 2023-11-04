import { Component, ViewChild, ElementRef } from '@angular/core';
import { LocationService } from '../location.service';

@Component({
  selector: 'app-zipcode-entry',
  templateUrl: './zipcode-entry.component.html'
})
export class ZipcodeEntryComponent {
  @ViewChild('zipcode') zipcodeInput: ElementRef;

  constructor(private service: LocationService) { }

  // Método para agregar una ubicación usando el servicio LocationService
  addLocation(zipcode: string) {
    // Verifica si el código postal no está vacío antes de agregarlo
    if (zipcode.trim().length > 0) {
      // Llama al método del servicio para agregar la ubicación
      this.service.addLocation(zipcode);
      // Limpia el valor del campo de entrada después de agregar la ubicación
      this.zipcodeInput.nativeElement.value = '';
      console.log("Ubicación agregada correctamente");
    }
  }
}
