// eslint-disable-next-line spaced-comment
/// <reference types="cypress" />
import asset_properties_widget_elements from '../support/page_objects/asset_properties_widget_elements';

const url = '/apps/clonecockpit/index.html#/';
const selectWidget = "div[title='Editable form for asset properties widget'] span";
const textElement = "c8y-asset-selector p[class*='text-12']";
const loadMore = "div[title='Groups > Load more']";
const searchElement = "input[placeholder='Search for groups or assets…']";
const assetNameElement = 'c8y-asset-properties-item > p';
const assetName = 'Test Asset2';
const selectPropElement = "h3[id='modal-title']";
const removePopupElement = 'h3 span';
const cardTitleElement = 'c8y-dashboard-child-title';
const assetProperties = 'Asset Properties 2.0';
const editWidgetHeadetElement = "div[title='Edit widget']";

describe('Asset Properties Widget: Installation tests', function () {
  const assetTitleName = '[title="check 1"] ';
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

  const roomProperties = [
    { label: 'Color', isRequired: 'false' },
    { label: 'Location', isRequired: false },
    { label: 'File', isRequired: 'false' },
    { label: 'ComplexProperty', isRequired: 'false' }
  ];

  before(function () {
    cy.login();
    cy.createAssetTypesAndPropertyForBuildingHierarchy();
    cy.apiCreateAssetModel(groupObject, roomProperties);
    const devices = ['Device1', 'Device2'];
    for (let i = 0; i < devices.length; i++) {
      cy.createDevice(devices[i]);
    }
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
          c8y_IsDeviceGroup: {},
          c8y_Position: {
            lng: 77.6904,
            alt: null,
            lat: 12.9322
          }
        }
      ];
      cy.apiCreateSimpleAsset(assetObject);
    }
    cy.apiCreateSimpleAsset(assetObject1);
    cy.apiCreateSimpleAsset(assetObject2);
    cy.apiCreateSimpleAsset(assetObject3);
    cy.apiAssignChildAsset(['check 2'], 'check 1');
    cy.apiAssignChildAsset(['check 4'], 'check 2');
    cy.installPlugin();
  });

  beforeEach(function () {
    cy.login();
    cy.visitAndWaitUntilPageLoad(url);
    cy.wait(2000);
    cy.get(asset_properties_widget_elements.addWidgetButton).click();
    cy.get(selectWidget).click();
  });

  // Verify the presence and functionality of add property button. On clicking of which should display a preview window with list of default properties
  it('TC_Asset_Properties_Widget_config_012', () => {
    const defaultProp = ['name', 'id', 'type', 'owner', 'lastUpdated'];
    cy.chooseAssetOrDevice(assetName);
    cy.get(asset_properties_widget_elements.addPropertyButton).click();
    cy.get(selectPropElement).should('have.text', 'Select property');
    for (let i = 0; i < defaultProp.length; i++) {
      cy.get(`div[title='${defaultProp[i]}']`).should('be.visible');
    }
    cy.deleteAllWidgets();
  });

  // User should be able to select the asset.
  it('TC_Asset_Properties_Widget_config_021', () => {
    cy.chooseAssetOrDevice('Test Asset2');
    cy.get(asset_properties_widget_elements.saveButton).should('be.enabled');
    cy.get(asset_properties_widget_elements.cancelButton).should('be.enabled');
  });

  // Verify that on click of an asset in Asset selection section it should navigate to the next screen displaying its subassets
  it('TC_Asset_Properties_Widget_config_022', () => {
    const assetName1 = 'check 1';
    const subassetName = 'check 2';
    cy.get(loadMore).scrollIntoView().should('be.visible');
    cy.get(loadMore).click();
    cy.get(`p[title='${assetName1}']`).click();
    cy.get(textElement).should('contains.text', ` Groups > ${assetName1}`);
    cy.get(`p[title='${subassetName}']`).should('be.visible');
  });

  // User can select only one asset at a time.
  it('TC_Asset_Properties_Widget_config_024', () => {
    const assetName = 'check 1';
    const assetName1 = 'check 3';
    cy.get(loadMore).click();
    cy.chooseAssetOrDevice(assetName);
    cy.chooseAssetOrDevice(assetName1);
    cy.get(`div[title='Groups > ${assetName}']`)
      .children('div[class*="checkbox"]')
      .children('label')
      .children('input[type="radio"]')
      .should('be.not.checked');
  });

  // Verify that checking any field and click on select, user should be able to see the selected field in configuartion properties and save it.
  it('TC_Asset_Properties_Widget_config_018', () => {
    const title = 'owner';
    const keyElement = 'c8y-asset-property-selector > table > tbody > tr > td > span';
    cy.chooseAssetOrDevice(assetName);
    cy.get(asset_properties_widget_elements.addPropertyButton).click();
    cy.selectProperty(title);
    cy.get(asset_properties_widget_elements.selectButton).click();
    cy.get(keyElement).eq(3).should('have.text', title);
    cy.get(asset_properties_widget_elements.saveButton).click();
    cy.get(cardTitleElement).should('contain.text', assetProperties);
    cy.deleteAllWidgets();
  });

  // On selecting the asset,user should be able to view all asset properties associated with that asset.Verify if checkboxes for properties are selected by default
  it('TC_Asset_Properties_Widget_config_026', () => {
    const prop = 'Color';
    const assetName = 'check 1';
    const subassetName = 'check 1 > check 2 > check 4';
    cy.get(searchElement).type(assetName);
    cy.get(assetTitleName).should('contains.text', assetName).click();
    cy.get('i[c8yicon="angle-right"]').click();
    cy.selectSubasset(subassetName);
    cy.get(asset_properties_widget_elements.addPropertyButton).click();
    // workaround for assettypes cache issue
    cy.selectProperty('owner');
    cy.get(asset_properties_widget_elements.selectButton).click();
    cy.get(asset_properties_widget_elements.addPropertyButton).click();
    // workaround for assettypes cache issue
    cy.get(`div[title='${prop}']`).scrollIntoView().should('be.visible');
  });

  // User should be able to navigate to configuation page on clicking of edit button.
  it('TC_Asset_Properties_Widget_view_004', () => {
    cy.selectAssetAndSave(assetName);
    cy.get(asset_properties_widget_elements.settingsButton).click();
    cy.get(asset_properties_widget_elements.editWidgetButton).click();
    cy.get(editWidgetHeadetElement).should('be.visible');
    cy.get(asset_properties_widget_elements.cancelButton).click();
    cy.deleteAllWidgets();
  });

  // Click on remove button, user will get and remove widget confirmation pop up. click on remove button verify the absence of widget.
  it('TC_Asset_Properties_Widget_view_005', () => {
    cy.selectAssetAndSave(assetName);
    cy.get(asset_properties_widget_elements.settingsButton).click();
    cy.get(asset_properties_widget_elements.removeWidgetButton).click();
    cy.get(removePopupElement).should('have.text', 'Remove widget');
    cy.get(asset_properties_widget_elements.removeButton).should('be.visible').click();
    cy.contains('No widgets to display');
  });

  // User should be able to click on edit , do some changes and save it. Changes done should be reflected on view.Properties other than these can be edited and saved.
  it('TC_Asset_Properties_Widget_view_007', () => {
    cy.selectAssetAndSave(assetName);
    cy.get(assetNameElement).eq(0).should('contains.text', 'Test Asset2');
    cy.get(asset_properties_widget_elements.settingsButton).click();
    cy.get(asset_properties_widget_elements.editWidgetButton).click();
    cy.get(editWidgetHeadetElement).should('be.visible');
    cy.get(asset_properties_widget_elements.changeButton).should('be.visible').click();
    cy.chooseAssetOrDevice('Test Asset3');
    cy.get(asset_properties_widget_elements.saveButton).click();
    cy.get(assetNameElement).should('contains.text', 'Test Asset3');
    cy.deleteAllWidgets();
  });

  // User should be able to click on edit , do some changes and save it. Changes done should be reflected on view.Properties other than these can be edited and saved.
  it('TC_Asset_Properties_Widget_view_007', () => {
    cy.selectAssetAndSave(assetName);
    cy.get(assetNameElement).eq(0).should('contains.text', 'Test Asset2');
    cy.get(asset_properties_widget_elements.settingsButton).click();
    cy.get(asset_properties_widget_elements.editWidgetButton).click();
    cy.get(editWidgetHeadetElement).should('be.visible');
    cy.get(asset_properties_widget_elements.changeButton).should('be.visible').click();
    cy.chooseAssetOrDevice('Test Asset3');
    cy.get(asset_properties_widget_elements.saveButton).click();
    cy.get(assetNameElement).should('contains.text', 'Test Asset3');
    cy.deleteAllWidgets();
  });

  after(function () {
    cy.cleanup();
    cy.deleteCustomApplication();
  });
});
