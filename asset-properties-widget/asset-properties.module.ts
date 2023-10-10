import { NgModule } from '@angular/core';
import { CoreModule, HOOK_COMPONENTS, RealtimeModule } from '@c8y/ngx-components';
import * as preview from './common/preview';
import { AssetPropertiesViewComponent } from './component/asset-properties-view/asset-properties-view.component';
import { AssetPropertiesConfigComponent } from './component/asset-properties-config/asset-properties.config.component';
import { AssetPropertiesSelectorComponent } from './component/asset-properties-config/asset-property-selector.component';
import { AssetSelectorModule } from '@c8y/ngx-components/assets-navigator';
import { schemaPropertySelectorCtrl } from './component/asset-property-selector-model/schema-property-selector.component';
import { AssetPropertiesComponent } from './asset-properties-widget-view/asset-properties.component';
import { AssetPropertiesItemComponent } from './asset-properties-widget-view/asset-properties-item.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Ng2SearchPipeModule } from 'ng2-search-filter';

@NgModule({
  declarations: [
    AssetPropertiesConfigComponent,
    AssetPropertiesSelectorComponent,
    schemaPropertySelectorCtrl,
    AssetPropertiesViewComponent,
    AssetPropertiesComponent,
    AssetPropertiesItemComponent
  ],
  imports: [
    CoreModule,
    AssetSelectorModule,
    Ng2SearchPipeModule,
    DragDropModule,
    RealtimeModule
  ],
  providers: [
    {
      provide: HOOK_COMPONENTS,
      multi: true,
      useValue: {
        id: 'asset-properties-widget',
        label: 'Asset Properties',
        previewImage: preview.image,
        description: 'Editable form for asset properties',
        component: AssetPropertiesViewComponent,
        configComponent: AssetPropertiesConfigComponent,
        data: {
          ng1: {
            options: {
              noDeviceTarget: true,
              noNewWidgets: false,
              deviceTargetNotRequired: false,
              groupsSelectable: true,
              showUnassignedDevices: false,
              upgrade:true,
              configComponent:true
            },
          },
        },
      },
    },
  ],
})
export class AssetPropertiesWidgetModule {}
