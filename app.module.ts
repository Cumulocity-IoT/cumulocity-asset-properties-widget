
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule as ngRouterModule } from '@angular/router';
import { BootstrapComponent, CoreModule, RouterModule } from '@c8y/ngx-components';
import { CockpitDashboardModule } from '@c8y/ngx-components/context-dashboard';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AssetPropertiesWidgetModule } from './asset-properties-widget/asset-properties.module';

// Translations
import './locales/de.po'; // <- adding additional strings to the german translation.

@NgModule({
  imports: [
    BrowserAnimationsModule,
    ngRouterModule.forRoot([], { enableTracing: false, useHash: true }),
    RouterModule.forRoot(),
    CoreModule.forRoot(),
    CockpitDashboardModule,
    AssetPropertiesWidgetModule
  ],
  providers: [BsModalRef],
  bootstrap: [BootstrapComponent]
})
export class AppModule {}
