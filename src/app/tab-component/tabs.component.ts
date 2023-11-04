import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ConditionsAndZip } from 'app/conditions-and-zip.type';
import { LocationService } from 'app/location.service';
import { WeatherService } from '../weather.service';
import { Subscription } from 'rxjs';

interface TabInformation {
  title: string;
  data: ConditionsAndZip;
}

@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.css']
})
export class TabComponent implements OnInit, AfterViewInit, OnDestroy {
  timeSetSubscription: Subscription | undefined;
  @ViewChild('tabContainer') tabContainer: ElementRef<HTMLElement> | undefined;

  @Input() location: ConditionsAndZip | undefined;
  @Input() active: boolean = false;
  @Output() closeTab: EventEmitter<string> = new EventEmitter<string>();

  customCacheTime: number = 7200000;
  tabWidth = 200;
  carouselWidth = 0;
  activeTab: number = 0;
  tabsInfo: TabInformation[] = [];
  locations: string[] = [];

  constructor(
    private locationService: LocationService,
    private weatherService: WeatherService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Obtene ubicaciones y carga datos de las pestañas
    this.locations = this.locationService.locations;
    this.loadTabsData();
    this.weatherService.refreshCurrentConditions(this.locations);

    // Suscribirse a los cambios en el tiempo de caché
    this.timeSetSubscription = this.weatherService.timeSet$.subscribe((time: number) => {
      console.log('Nuevo tiempo de caché:', time);
    });
  }

  loadTabsData(): void {
    // Suscribirse a los datos de las condiciones climáticas
    this.weatherService.currentConditions$.subscribe((conditions: ConditionsAndZip[]) => {
      if (conditions && conditions.length > 0) {
        // Filtra y mapea los datos para las pestañas
        this.tabsInfo = conditions
          .filter(condition => condition !== undefined)
          .map((condition, index) => {
            return {
              title: `Tab ${index + 1}`,
              data: condition as ConditionsAndZip
            };
          });
        this.cdRef.detectChanges();
      }
    });
  }
  
  onCloseTab(): void {
    if (this.location) {
      this.closeTab.emit(this.location.zip);
    }
  }

  changeTab(tabNumber: number): void {
    this.activeTab = tabNumber;
    this.updateTabs();
  }

  ngAfterViewInit(): void {
    this.setTabContainerWidth();
    this.calculateCarouselWidth();
  }

  setTabContainerWidth(): void {
    // Calcula el ancho del contenedor de pestañas
    if (this.tabContainer) {
      const tabElement = this.tabContainer.nativeElement.querySelector('.tab');
      if (tabElement) {
        this.tabWidth = tabElement.clientWidth;
      }
    }
  }

  calculateCarouselWidth(): void {
    // Calcula el ancho del carrusel
    this.carouselWidth = this.tabWidth * this.tabsInfo.length;
  }

  scrollLeft(): void {
    // Desplaza a la izquierda
    if (this.activeTab > 0) {
      this.activeTab--;
      this.updateTabs();
    }
  }

  scrollRight(): void {
    // Desplaza a la derecha
    if (this.activeTab < this.tabsInfo.length - 1) {
      this.activeTab++;
      this.updateTabs();
    }
  }

  updateTabs(): void {
    // Actualiza las pestañas en el contenedor
    if (this.tabContainer) {
      this.tabContainer.nativeElement.style.transform = `translateX(${this.activeTab}px)`;
    }
  }

  ngOnDestroy(): void {
    // Desuscribirse al destruir el componente
    this.timeSetSubscription?.unsubscribe();
  }
}
