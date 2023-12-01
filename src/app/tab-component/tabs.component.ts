import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnInit, OnDestroy, ChangeDetectorRef, ContentChildren, QueryList, AfterContentInit, HostListener } from '@angular/core';
import { ConditionsAndZip } from 'app/conditions-and-zip.type';
import { LocationService } from 'app/location.service';
import { WeatherService } from '../weather.service';
import { Subscription } from 'rxjs';
import { Location } from '@angular/common';
import { TabItemComponent } from './tabs-item.component';
import { TabHeaderComponent } from './tabs-header.component';

@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.css']
})
export class TabComponent implements OnInit, AfterViewInit, AfterContentInit, OnDestroy {
  timeSetSubscription: Subscription | undefined;
  @ViewChild('tabContainer') tabContainer: ElementRef<HTMLElement> | undefined;
  @ContentChildren(TabItemComponent) tabs: QueryList<TabItemComponent> | undefined;
  @ContentChildren(TabHeaderComponent) tabHeaders: QueryList<TabHeaderComponent> | undefined;

  @Input() location: ConditionsAndZip[] = [];
  @Input() active: boolean = false;
  @Output() closeTab: EventEmitter<string> = new EventEmitter<string>();

  customCacheTime: number = 7200000; // Valor por defecto del tiempo de caché

  // Variables para controlar el ancho de las pestañas
  tabWidth = 200;
  carouselWidth = 0;
  activeTab: number = 0;
  tabsInfo: ConditionsAndZip[] = []; // Información de las pestañas
  locations: string[] = []; // Ubicaciones de las pestañas

  constructor(
    private locationService: LocationService,
    private weatherService: WeatherService,
    private cdRef: ChangeDetectorRef,
    private locationx: Location
  ) {}

  // Método que se ejecuta al inicializar el componente
  ngOnInit(): void {
    this.locations = this.locationService.locations;
    this.loadTabsData();
    this.weatherService.refreshCurrentConditions(this.locations);
    this.timeSetSubscription = this.weatherService.timeSet$.subscribe((time: number) => {
    });
  }

  // Cargar los datos de las pestañas desde el servicio
  loadTabsData(): void {
    this.weatherService.currentConditions$.subscribe((conditions: ConditionsAndZip[]) => {
      if (conditions && conditions.length > 0) {
        this.tabsInfo = conditions.map((condition, index) => {
          return {
            zip: condition.zip,
            data: condition.data
          };
        });
        // Calcular el ancho del carrusel
        this.calculateCarouselWidth();
         // Establecer el tab activo como el último agregado
        this.activeTab = this.tabsInfo.length - 1;
        // Actualizar la visibilidad de las pestañas
        this.updateTabs();
        this.cdRef.detectChanges();
      }
    });
  }

  // Cerrar una pestaña por su código postal
  onCloseTab(zip: string): void {
    this.tabsInfo = this.tabsInfo.filter(tab => tab.zip !== zip);
    this.closeTab.emit(zip);
  }

  // Cambiar a una pestaña específica
  changeTab(tabNumber: number): void {
    this.activeTab = tabNumber;
    this.updateTabs();
  }

  // Métodos que se ejecutan después de la inicialización de la vista
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.setTabContainerWidth();
      this.calculateCarouselWidth();
      this.updateActiveTabFromUrl(); 
    });
  }
  // Métodos que se ejecutan después de la inicialización del contenido
  ngAfterContentInit(): void {
    if (this.tabs) {
      this.tabs.changes.subscribe((items: QueryList<TabItemComponent>) => {
        this.calculateCarouselWidth();
      });
      this.calculateCarouselWidth();
    }
  }


  // Agrega este método para escuchar los cambios en el historial de navegación
  @HostListener('window:popstate', ['$event'])
  onPopState(event: any): void {
    this.updateActiveTabFromUrl();
  }

  // Agrega este método para actualizar la pestaña activa desde la URL
  updateActiveTabFromUrl(): void {
    const urlSegments = this.locationx.path().split('/');
    const zipcodeSegmentIndex = urlSegments.indexOf('zipcode');

    if (zipcodeSegmentIndex !== -1 && zipcodeSegmentIndex + 1 < urlSegments.length) {
      const zipcode = urlSegments[zipcodeSegmentIndex + 1];
      const tabIndex = this.tabsInfo.findIndex(tab => tab.zip === zipcode);

      if (tabIndex !== -1) {
        this.activeTab = tabIndex;
        this.updateTabs();
      }
    }
  }


  // Establecer el ancho del contenedor de las pestañas
  setTabContainerWidth(): void {
    if (this.tabContainer) {
      const tabElement = this.tabContainer.nativeElement.querySelector('.tab');
      if (tabElement) {
        this.tabWidth = tabElement.clientWidth;
      }
    }
  }

  // Calcular el ancho total del carrusel
  calculateCarouselWidth(): void {
    this.carouselWidth = this.tabWidth * this.tabsInfo.length;
  }

  // Desplazar el carrusel hacia la izquierda
  scrollLeft(): void {
    if (this.activeTab > 0) {
      this.activeTab--;
      this.updateTabs();
    }
  }

  // Desplazar el carrusel hacia la derecha
  scrollRight(): void {
    if (this.activeTab < this.tabsInfo.length - 1) {
      this.activeTab++;
      this.updateTabs();
    }
  }

  // Actualizar el tiempo de caché personalizado
  updateCacheTime(value: number) {
    this.customCacheTime = value;
    this.weatherService.setCustomCacheTime(value);
  }

  // Actualizar la visibilidad de las pestañas
  updateTabs(): void {
    if (this.tabs) {
      this.tabs.forEach((tab, index) => {
        if (index === this.activeTab) {
          tab.show();
        } else {
          tab.hide();
        }
      });
    }
  }

  // Método que se ejecuta al destruir el componente
  ngOnDestroy(): void {
    this.timeSetSubscription?.unsubscribe();
  }
}
