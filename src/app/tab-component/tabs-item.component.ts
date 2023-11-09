import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tab-item',
  templateUrl: './tab-item.component.html',
})
export class TabItemComponent {
  // Indicador si la pestaña está activa
  @Input() active: boolean = false;

  // Indicador si la pestaña es visible
  @Input() isVisible: boolean = false;

  // Método para mostrar la pestaña
  show(): void {
    this.isVisible = true;
  }

  // Método para ocultar la pestaña
  hide(): void {
    this.isVisible = false;
  }
}
