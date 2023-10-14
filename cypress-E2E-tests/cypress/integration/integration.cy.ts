/// <reference types="cypress" />
import asset_properties_widget_elements from '../support/page_objects/asset_properties_widget_elements';
import { ROUTES } from 'cypress/constants/routes.constant';

const propKey = 'color';
const updatedPropValue = 'Blu';
const propValueElement = ':nth-child(5) > .card-block > c8y-asset-properties-item > p';
const groupObject = {
  label: 'Group',
  name: 'group',
  description: '',
  c8y_IsAssetType: {
    icon: {
      category: '',
      name: ''
    },
    properties: [],
    allowedAssetTypes: [],
    isNoneChildAssetsAllowed: 'false'
  }
};
const assets = [
  'check 3',
  'Test Asset2',
  'Test Asset3',
  'Test Asset4',
  'Test Asset5',
  'Test Asset6'
];
const assetObject1 = [
  {
    type: 'building',
    icon: {
      name: '',
      category: ''
    },
    name: 'check 1',
    c8y_IsAsset: {},
    c8y_IsDeviceGroup: {}
  }
];
const assetObject2 = [
  {
    type: 'floor',
    icon: {
      name: '',
      category: ''
    },
    name: 'check 2',
    c8y_IsAsset: {},
    c8y_IsDeviceGroup: {}
  }
];
const assetObject3 = [
  {
    type: 'room',
    icon: {
      name: '',
      category: ''
    },
    name: 'check 4',
    c8y_IsAsset: {},
    c8y_IsDeviceGroup: {}
  }
];
const roomProperties = [{ label: 'Color', isRequired: 'false' }];

describe('Asset Properties Widget: Integration tests', function () {
  before(function () {
    cy.login();
    cy.createAssetTypesAndPropertyForBuildingHierarchy();
    cy.apiCreateAssetModel(groupObject, roomProperties);
    for (let i = 0; i < assets.length; i++) {
      const assetObject = [
        {
          type: 'group',
          icon: {
            name: '',
            category: ''
          },
          name: assets[i],
          c8y_IsAsset: {},
          c8y_IsDeviceGroup: {}
        }
      ];
      cy.apiCreateSimpleAsset(assetObject);
    }
    cy.apiCreateSimpleAsset(assetObject1);
    cy.apiCreateSimpleAsset(assetObject2);
    cy.apiCreateSimpleAsset(assetObject3);
    cy.apiAssignChildAsset(['check 2'], 'check 1');
    cy.apiAssignChildAsset(['check 4'], 'check 2');
  });

  beforeEach(function () {
    cy.login();
    cy.visitAndWaitUntilPageLoad(`apps/asset-properties/index.html#/`);
    cy.get(asset_properties_widget_elements.addWidgetButton).click();
    cy.get(asset_properties_widget_elements.cardElement).click();
  });

  // Any change in property value done , will be reflected in dtm and vice versa
  it('TC_Asset_Properties_Widget_Integration_001', () => {
    // Asset property widget changes
    const assetName = 'Test Asset6';
    const propValue = 'Red';
    const propFeildElement = '#formly_2_string_color_0';
    const saveElement = '.btn-primary';
    cy.selectAssetPropertyAndSave(assetName, propKey);
    cy.clickPropertyEditButton('Color');
    cy.get(propFeildElement).clear().type(propValue);
    cy.get(saveElement).click();

    // Digital twin manager verification and updation
    cy.login();
    cy.visitAndWaitUntilPageLoad('apps/digital-twin-manager/index.html#/assets');
    const propElement = 'c8y-asset-properties-item > .text-truncate';
    const editPencilElement = '.dlt-c8y-icon-pencil';
    const inputFeildElement = "input[minlength='2']";
    const propSaveElement = '.card-footer > .btn-primary';
    cy.verifyThePresenceOfAsset(assetName);
    cy.navigateToSubassetPageThroughAssetTreeGrid(assetName);
    cy.get(propElement).should('contain.text', propValue);
    cy.get(editPencilElement).click();
    cy.get(inputFeildElement).clear().type(updatedPropValue);
    cy.get(propSaveElement).click();

    // Verification in Asset property widget
    cy.login();
    cy.visitAndWaitUntilPageLoad(`apps/asset-properties/index.html#/`);
    cy.get(propValueElement).should('contain.text', updatedPropValue);
    cy.deleteCard();
  });

  // If there are two asset instances, value changed in one instance must get reflected in other instance as well
  // it('TC_Asset_Properties_Widget_Integration_002', () => {
  //   const instance1Title = 'Asset Properties';
  //   const instance2Title = 'Test';
  //   const propFeildElement = '#formly_2_string_color_0';
  //   const saveElement = '.btn-primary';
  //   const assetName = 'Test Asset5';
  //   const titleFieldId = '#widgetTitle';
  //   cy.selectAssetPropertyAndSave(assetName, propKey);
  //   cy.get(asset_properties_widget_elements.widgetDashboardAddWidgetButton).click();
  //   cy.get(asset_properties_widget_elements.cardElement).click();
  //   cy.get(titleFieldId).should('have.value', instance1Title);
  //   cy.get(titleFieldId).clear().type(instance2Title);
  //   cy.selectAssetPropertyAndSave(assetName, propKey);
  //   cy.clickPropertyEditButton('Color');
  //   cy.get(propFeildElement).clear().type(updatedPropValue);
  //   cy.get(saveElement).click();
  //   cy.get(propValueElement).should('contain.text', updatedPropValue);
  //   cy.get(propValueElement).should('have.length', 2);
  //   cy.deleteWidgetInstances([instance1Title, instance2Title]);
  // });

  // // Any deleted asset from dtm  , No data will be shown on widget view.
  // it('TC_Asset_Properties_Widget_Integration_003', () => {
  //   const assetName = 'Test Asset3';
  //   cy.selectAssetPropertyAndSave(assetName, propKey);
  //   cy.get(propValueElement).should('contain.text', 'Not Defined');

  //   // delete asset in digital twin manager
  //   cy.login();
  //   cy.visitAndWaitUntilPageLoad('apps/digital-twin-manager/index.html#/assets');
  //   cy.deleteAsset(assetName);

  //   cy.login();
  //   cy.visitAndWaitUntilPageLoad(`apps/asset-properties/index.html#/`);
  //   cy.get('asset-properties > div').should('contain.text', 'No Data');
  //   cy.deleteCard();
  // });

  // // Deletion of any property in dtm must be reflected on widget as well. Property should not be shown in widget.
  // it('TC_Asset_Properties_Widget_Integration_004', () => {
  //   const assetName = 'Test Asset2';
  //   const confirmButton = "button[title='Confirm']";
  //   cy.selectAssetPropertyAndSave(assetName, propKey);
  //   cy.get(propValueElement).should('contain.text', 'Not Defined');
  //   cy.deleteCard();

  //   // remove property in digital twin manager
  //   cy.visitAndWaitUntilPageLoad(`apps/digital-twin-manager/index.html#/${ROUTES.ASSET_MODELS}`);
  //   cy.clickOnAssetTypeEditButton('Group');
  //   cy.removeCustomProperty('Color');
  //   cy.get(asset_properties_widget_elements.saveAssetTypeButton).click();
  //   cy.get(confirmButton).should('be.visible').click();

  //   cy.login();
  //   cy.visitAndWaitUntilPageLoad(`apps/asset-properties/index.html#/`);
  //   cy.get(asset_properties_widget_elements.addWidgetButton).click();
  //   cy.get(asset_properties_widget_elements.cardElement).click();
  //   cy.verifyTheAbsenceOfAssetProperty(assetName, propKey);
  // });

  after(function () {
    cy.cleanup();
  });
});