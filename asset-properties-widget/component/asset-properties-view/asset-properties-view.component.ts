import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { IAlarm, IEvent, IManagedObject, InventoryService } from '@c8y/client';
import {
  AlarmRealtimeService,
  DatePipe,
  EventRealtimeService,
  ManagedObjectRealtimeService,
  MeasurementRealtimeService
} from '@c8y/ngx-components';
import { AssetPropertiesService } from '../asset-properties-config/asset-properties.service';
import { some, cloneDeep, isEmpty } from 'lodash-es';
import { AssetPropertiesViewService } from './asset-properties-view.service';
import { devicePropertiesBaseObject } from '../../common/asset-property-constant';

interface ComputedPropertyObject {
  [key: string]: any;
}

@Component({
  selector: 'c8y-asset-properties-view',
  templateUrl: './asset-properties-view.component.html',
  styleUrls: ['./asset-properties-view.component.less'],
  encapsulation: ViewEncapsulation.None,
  providers: [ManagedObjectRealtimeService, MeasurementRealtimeService]
})
export class AssetPropertiesViewComponent implements OnInit {
  selected = { id: 'asset-properties-widget' };
  selectedAsset: IManagedObject;
  isEmptyWidget: boolean = false;
  customProperties: Array<IManagedObject>;
  properties: IManagedObject[];
  @Input() config: any;
  computedPropertyObject: ComputedPropertyObject;
  isLoading = true;
  dateTimeFormat = 'yyyy-MM-ddTHH:mm:ssZZZZZ';

  constructor(
    protected inventoryService: InventoryService,
    protected moRealtimeService: ManagedObjectRealtimeService,
    private assetPropertiesService: AssetPropertiesService,
    private assetPropertiesViewService: AssetPropertiesViewService,
    private datePipe: DatePipe,
    private alarmRealtimeService: AlarmRealtimeService,
    private eventRealtimeService: EventRealtimeService
  ) {}

  async ngOnInit(): Promise<void> {
    if (this.config.device) {
      try {
        this.selectedAsset = (await this.inventoryService.detail(this.config.device.id)).data;
        // eslint-disable-next-line no-prototype-builtins
        if (this.selectedAsset.hasOwnProperty('c8y_IsAsset')) {
          this.customProperties = await this.assetPropertiesService.getCustomProperties(
            this.selectedAsset
          );
          this.properties = this.config.properties.filter(property => {
            if (
              property.isStandardProperty ||
              (this.customProperties.length != 0 &&
                this.customProperties.find(prop => prop.id === property.id)) ||
              this.validateComplexProperty(property)
            ) {
              return property;
            }
          });
          this.config.properties = cloneDeep(this.properties);
        } else {
          this.properties = cloneDeep(this.config.properties);
          this.customProperties = cloneDeep(devicePropertiesBaseObject);
        }
        this.constructComplexPropertyKeys();
        this.config.properties.forEach(property => {
          if (property.computed && property.active) {
            switch (property.name) {
              case 'alarmCountToday':
                this.getAlarmCount(
                  this.config.device,
                  property,
                  this.datePipe.transform(new Date(), 'yyyy-MM-dd')
                );
                break;
              case 'alarmCount3Months':
                this.getAlarmCount(
                  this.config.device,
                  property,
                  this.datePipe.transform(
                    new Date().setMonth(new Date().getMonth() - 3),
                    'yyyy-MM-dd'
                  )
                );
                break;
              case 'eventCountToday':
                this.getEventCount(
                  this.config.device,
                  property,
                  this.datePipe.transform(new Date(), 'yyyy-MM-dd')
                );
                break;
              case 'eventCount3Months':
                this.getEventCount(
                  this.config.device,
                  property,
                  this.datePipe.transform(
                    new Date().setMonth(new Date().getMonth() - 3),
                    'yyyy-MM-dd'
                  )
                );
                break;
              case 'lastMeasurement':
                this.getLastMeasurement(property);
                break;
              case 'lastDeviceMessage':
                if (
                  !this.selectedAsset.c8y_Availability ||
                  !this.selectedAsset.c8y_Availability.lastMessage
                ) {
                  this.assetPropertiesViewService.getLastDeviceMessage(this.config.device);
                  this.assetPropertiesViewService.dateSet$.subscribe((dateSet: Set<string>) => {
                    const maxDate = this.datePipe.transform(
                      Math.max(
                        ...Array.from(dateSet).map(dateString => new Date(dateString).getTime())
                      ),
                      this.dateTimeFormat
                    );
                    this.computedPropertyObject = {
                      ...this.computedPropertyObject,
                      ...{ ['lastDeviceMessage']: maxDate }
                    };
                  });
                }
                break;
              case 'configurationSnapshot':
                this.getConfigurationSnapshot(this.selectedAsset);
                break;
              default:
                break;
            }
          }
        });
        this.handleRealtime();
        this.isLoading = false;
      } catch (error) {
        this.isEmptyWidget = true;
      }
    } else this.isEmptyWidget = true;
  }

  async getAlarmCount(device: IManagedObject, property: IManagedObject, dateFrom: string) {
    // By incrementing the dateTo parameter by 1 day, this code aims to mitigate timezone-related inconsistencies.
    const filters = {
      dateFrom: dateFrom,
      dateTo: this.datePipe.transform(
        new Date().setDate(new Date().getDate() + 1),
        this.dateTimeFormat
      ),
      source: device.id,
      pageSize: 2000,
      type: property.config.type
    };
    const alarms = await this.assetPropertiesViewService.getAlarms(filters);
    this.alarmRealtimeService.onCreate$(this.selectedAsset.id).subscribe((alarm: IAlarm) => {
      if (alarm.type === property.config.type) {
        this.computedPropertyObject = {
          ...this.computedPropertyObject,
          ...{
            [`${property.name}_${property.config.id}`]: ++this.computedPropertyObject[
              `${property.name}_${property.config.id}`
            ]
          }
        };
      }
    });
    this.computedPropertyObject = {
      ...this.computedPropertyObject,
      ...{ [`${property.name}_${property.config.id}`]: alarms.length }
    };
  }

  async getEventCount(device: IManagedObject, property: IManagedObject, dateFrom: string) {
    // By incrementing the dateTo parameter by 1 day, this code aims to mitigate timezone-related inconsistencies.
    const filters = {
      dateFrom: dateFrom,
      dateTo: this.datePipe.transform(
        new Date().setDate(new Date().getDate() + 1),
        this.dateTimeFormat
      ),
      source: device.id,
      pageSize: 2000,
      type: property.config.type
    };
    const events = await this.assetPropertiesViewService.getEvents(filters);
    this.computedPropertyObject = {
      ...this.computedPropertyObject,
      ...{ [`${property.name}_${property.config.id}`]: events.length }
    };
    this.eventRealtimeService.onCreate$(this.selectedAsset.id).subscribe((event: IEvent) => {
      if (event.type === property.config.type) {
        this.computedPropertyObject = {
          ...this.computedPropertyObject,
          ...{
            [`${property.name}_${property.config.id}`]: ++this.computedPropertyObject[
              `${property.name}_${property.config.id}`
            ]
          }
        };
      }
    });
  }

  getLastMeasurement(property) {
    // eslint-disable-next-line no-underscore-dangle
    let datapoint = property.config.dp.find(dp => dp.__active);
    datapoint = { ...datapoint, ...{ uniqId: property.config.id } };
    this.assetPropertiesViewService.getLatestMeasurement$(datapoint).subscribe(lastMeasurement => {
      this.computedPropertyObject = {
        ...this.computedPropertyObject,
        ...{ [`lastMeasurement_${lastMeasurement.id}`]: lastMeasurement }
      };
    });
  }

  async getConfigurationSnapshot(device) {
    const configId = (device.c8y_ConfigurationDump || {}).id;
    if (!configId) return;
    try {
      const { data: configuration } = await this.inventoryService.detail(configId);
      this.computedPropertyObject = {
        ...this.computedPropertyObject,
        ...{ ['configurationSnapshot']: configuration?.name }
      };
    } catch (ex) {
      // do nothing
    }
  }

  parseNestedComplexPropertyItem(property, item) {
    Object.keys(property.properties).forEach(key => {
      const object = property.properties[key];
      if (
        !isEmpty(object.properties) &&
        Object.prototype.hasOwnProperty.call(object, 'properties')
      ) {
        this.parseNestedComplexPropertyItem(object, item);
      } else if (
        property.properties[key].title === item.title &&
        (property.name === item.keyPath?.[item.keyPath.length - 2] ||
          property.properties[key].name === item.keyPath?.[item.keyPath.length - 2])
      ) {
        property.properties[key] = item;
      }
    });
  }

  constructComplexPropertyKeys() {
    const customizedProperty = [];
    this.properties.forEach(element => {
      if (element.keyPath && element.active) {
        const property =
          this.properties.find(prop => prop.name === element.keyPath?.[0]) ||
          this.customProperties.find(prop => prop.name === element.keyPath?.[0]);
        if (
          property &&
          !property.c8y_JsonSchema.properties[property.name].properties[
            element.keyPath?.[1]
          ]?.hasOwnProperty('properties')
        ) {
          if (!property.isParentKeySelected) {
            property.isParentKeySelected = true;
            property.active = true;
            property.c8y_JsonSchema.properties[property.name].properties = {};
          }
          property.c8y_JsonSchema.properties[property.name].properties[element.keyPath?.[1]] = {
            ...element
          };
        } else {
          property.active = true;
          property.isNestedComplexProperty = true;
          this.parseNestedComplexPropertyItem(
            property.c8y_JsonSchema.properties[property.name],
            element
          );
        }
        if (!customizedProperty.find(prop => prop.name === property.name)) {
          customizedProperty.push(property);
        }
      } else if (
        element.active &&
        (!customizedProperty.find(prop => prop.name === element.name) || element.computed)
      ) {
        customizedProperty.push(element);
      }
    });
    this.constructNestedComplexProperty(customizedProperty);
    this.properties = customizedProperty;
  }

  constructNestedComplexProperty(customizedProperty) {
    customizedProperty.forEach(element => {
      if (element.active && element.isNestedComplexProperty) {
        this.refineNestedComplexProperty(element.c8y_JsonSchema.properties[element.name]);
      }
    });
  }

  refineNestedComplexProperty(property, parentReferance?) {
    Object.keys(property.properties).forEach(key => {
      const object = property.properties[key];
      if (
        !isEmpty(object.properties) &&
        (some(object.properties, 'active') || some(object.properties, 'properties')) &&
        !object.active
      ) {
        this.refineNestedComplexProperty(object, property);
      } else if (!object.active) {
        delete property.properties[key];
        if (isEmpty(property.properties)) {
          delete parentReferance.properties[property.name];
        }
      }
    });
  }

  validateComplexProperty(item): boolean {
    if (item.keyPath) {
      const property = this.customProperties.find(prop => prop.name === item.keyPath?.[0]);
      return some(
        Object.keys(property.c8y_JsonSchema.properties[property.name].properties),
        function (key) {
          return key === item.keyPath?.[1];
        }
      );
    }
    return false;
  }

  private handleRealtime() {
    this.moRealtimeService.onUpdate$(this.selectedAsset.id).subscribe((asset: IManagedObject) => {
      this.selectedAsset = asset;
    });
  }
}
