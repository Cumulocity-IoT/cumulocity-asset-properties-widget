import { Component, Input } from "@angular/core";
import { IManagedObject } from "@c8y/client";
import { AssetTypesService, gettext } from "@c8y/ngx-components";
import { BsModalRef, BsModalService, ModalOptions } from "ngx-bootstrap/modal";
//import { defaultProperty, property } from "../../common/asset-property-constant";
import { isEmpty, cloneDeep } from 'lodash-es';
import { ContextDashboardService } from "@c8y/ngx-components/context-dashboard";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { assetPropertyItemSelectorCtrl } from "../asset-property-item-selector/asset-property-item-selector.component";
import { AssetPropertiesService } from "../asset-properties.service";
import { defaultProperty, property } from "../../../common/asset-property-constant";

type ModalInitialState = {
  title: string;
  customProperties: any;
  propertiesList:any;
};

@Component({
    selector: 'asset-property-selector',
    templateUrl: './asset-property-selector.component.html',
})
export class AssetPropertiesSelectorComponent {
    @Input() config: IManagedObject;
    @Input() asset: IManagedObject;
    isLoading:boolean = false;
    assetType: IManagedObject;
    assetPropertySelectorModalRef:BsModalRef
    properties = cloneDeep(defaultProperty);
    customProperties: IManagedObject [] = cloneDeep(defaultProperty).concat(cloneDeep(property));
    ExpandedComplexProperty:any;
    isPropertySelected:boolean = true;

    constructor(private assetTypes: AssetTypesService,private assetPropertyService: AssetPropertiesService,
      private modalService: BsModalService, private contextDashboardService: ContextDashboardService) {}

   async ngOnChanges(changes: IManagedObject): Promise<void> {
      if(changes.asset.firstChange && this.config?.properties){
      this.properties = this.config.properties;
      this.customProperties = this.customProperties.concat(this.getConstructCustomProperties(await this.assetPropertyService.getCustomProperties(this.asset)));
      }else if(changes.asset.currentValue){
        this.assetType = undefined;
        this.loadAssetProperty();
      }
      this.isPropertySelected = true;
    }
    addDefaultAndSelectedProperties(){
      this.properties.forEach((property) => {
        var existingPropertyIndex = this.customProperties.map(function(item) { return item.name; }).indexOf(property.name);
        if(existingPropertyIndex>0){
          this.customProperties[existingPropertyIndex] = cloneDeep(property);
        }else{
          this.customProperties.push(cloneDeep(property))
        }
      })

    }
    getConstructCustomProperties(customProperties):IManagedObject []{
      let simpleProperties:IManagedObject[] = [];
      let constructCustomProperties:IManagedObject[] = [];
      customProperties.forEach(property => {
        const object = property.c8y_JsonSchema.properties[property.c8y_JsonSchema.key]
        if(object.type === 'object'){
          constructCustomProperties.push(property)
         
        }else{
          simpleProperties.push(property);
        }
      });
      return simpleProperties.concat(constructCustomProperties)
    }
    async loadAssetProperty() {
      this.isLoading = true;
      this.properties = cloneDeep(defaultProperty);
      this.assetType = this.assetTypes.getAssetTypeByName(this.asset.type);
      this.config.properties = this.properties;
      this.customProperties = cloneDeep(this.properties).concat(property).concat(this.getConstructCustomProperties(await this.assetPropertyService.getCustomProperties(this.asset)))
      this.isLoading = false;
    }

    addProperty(){
      this.customProperties.forEach((property) => {property.active = false})
      const assetPropertySelectorModalOptions: ModalOptions<ModalInitialState> = {
        class: 'modal-lg',
        backdrop: 'static',
        initialState: {
          title: gettext('Select property'),
          customProperties: this.customProperties,
          propertiesList: this.properties
        }
      };
      this.assetPropertySelectorModalRef = this.modalService.show(
        assetPropertyItemSelectorCtrl,
        assetPropertySelectorModalOptions
      );
      this.assetPropertySelectorModalRef.content.cancelPropertySelection.subscribe((event: Event) => {
        this.assetPropertySelectorModalRef.hide();
      });
      this.assetPropertySelectorModalRef.content.savePropertySelection.subscribe((properties:IManagedObject[]) => {
        this.properties = this.properties.concat(this.removeSelectedProperties(properties))
        this.isAtleastOnePropertySelected = true;
        this.config.properties = this.properties;
        this.assetPropertySelectorModalRef.hide();
      });
    }
    constructCustomProperties(properties:IManagedObject[]){
      this.properties.forEach(property => {
        if(this.isComplexProperty(property)){
          let customProperties = property.c8y_JsonSchema.properties[property.c8y_JsonSchema.key]?.properties;
          const tempCustomProperties = {};
          for (const key in customProperties) {
            if(customProperties[key].active === true){
              tempCustomProperties[key] = customProperties[key];
            }
            const complexPropertyValue = properties.find((property) => property.name === customProperties[key].name);
              tempCustomProperties[key] = complexPropertyValue;
          }
          if(!isEmpty(tempCustomProperties)){
            property.c8y_JsonSchema.properties[property.c8y_JsonSchema.key].properties = tempCustomProperties
          }
        }
      });
    }

    isComplexProperty (prop) {
      if(!prop.c8y_JsonSchema){
          return false
      }
      return (prop.c8y_JsonSchema.properties[prop.c8y_JsonSchema.key]?.type === 'object');
    }

    removeSelectedProperties(properties){
      properties.forEach((property, index) => {
        var removeIndex = this.properties.map(function(item) { return item.name; }).indexOf(property.name);
        if(removeIndex >= 0){
          property.isHide = false
          this.properties[removeIndex] = property;
          properties.splice(index, 1);
          this.removeSelectedProperties(properties)
        }
      })
      return properties;
    }

    updateOptions(){
      if(this.properties.map(function(item) { return item.active}).indexOf(true) > -1){
        this.isPropertySelected = true;
      }else {
        this.isPropertySelected = false;
      }
    }

    removeProperty(property:IManagedObject){
      var removeIndex = this.properties.map(function(item) { return item.name; }).indexOf(property.name);
      if(removeIndex >= 0){
        this.properties.splice(removeIndex, 1);
        property['active'] = false;
        if(this.properties.length > 0 && this.properties.every(({ active }) => active)){
          this.isPropertySelected = true;
        }else {
          this.isPropertySelected = false;
        }
      }
    }

    onRowExpanded(property){
      this.ExpandedComplexProperty = property;
    }

    drop(event: CdkDragDrop<string[]>) {
      moveItemInArray(this.properties, event.previousIndex, event.currentIndex);
    }

}