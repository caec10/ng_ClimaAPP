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
      // Expresión regular para validar el formato del código postal de Estados Unidos
      const zipRegex = /^\d{5}(-\d{4})?$/;

      // Verifica si el código postal cumple con el formato
      if (zipRegex.test(zipcode)) {
        // Verifica si el código postal ya está en la lista
        const isZipcodeAlreadyAdded = this.service.locations.includes(zipcode);

        if (isZipcodeAlreadyAdded) {
          // Muestra una alerta indicando que el código postal ya está agregado
          alert('El código postal ya está agregado.');
          this.zipcodeInput.nativeElement.value = '';
        } else {
          // Llama al método del servicio para agregar la ubicación
          this.service.addLocation(zipcode);
          // Limpia el valor del campo de entrada después de agregar la ubicación
          this.zipcodeInput.nativeElement.value = '';
        }
      } else {
        // Muestra una alerta indicando que el código postal no es válido
        alert('El código postal no es válido. Por favor, ingrese un código postal de Estados Unidos válido.');
        this.zipcodeInput.nativeElement.value = '';
      }
    }
  }
}
