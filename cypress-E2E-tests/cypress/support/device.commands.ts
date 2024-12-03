import cockpit_page_elements from './page_objects/cockpit_page_elements';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
             * This command is being used to create the measurment.
             * @param requestBody Specify the request body.
             * Ex: {
                    deviceName: 'Device2',
                    fragment: 's7aFlow',
                    series: 'F',
                    unit: 'L',
                    value: 45
                }
             * Usage: cy.createMeasurement(requestBody);
             */
      createMeasurement(requestBody: any): void;

      /**
       * This command is being used to create a new alarm
       * @param alarmObject Pass an alarm object.
       * Note: Specify the "pastDate" in the object only if you want to create an alarm for a previous date.
       * ex: {
              deviceName: 'Device1',
              text: 'Device Running for more than standard time',
              severity: 'MAJOR',
              status: 'ACTIVE',
              pastDate: {
                month: 2,
                day: 15
              }
            }
       * Usage: createNewAlarm(alarmObject);
       */
      createNewAlarm(alarmObject: any): void;

      /**
       * This command is being used to create the device.
       * @param deviceName Name of the device
       * @param pastDate Specify the "pastDate" only if you want to create a device for a previous date.
       * Usage: createDevice('Device1');
       */
      createDevice(deviceName: string, pastDate?: any): void;

      /**
       * This command is being used to delete all the devices.
       * Usage: deleteAllDevices();
       */
      deleteAllDevices(): void;

      /**
       * This command is being used to add the child device.
       * @param parentDevice Name of the parent device.
       * @param childDevice Name of the child device.
       * addChildDevice("Device1", "DEvice2");
       */
      addChildDevice(parentDevice: string, childDevice: string): void;

      /**
       * This command is being used to add the child device.
       * @param parentDevice Name of the parent device.
       * @param asset Name of the asset as a child of device.
       * addChildDevice("Device1", "Building");
       */
      addAssetToDevice(parentDevice: string, asset: string): void;

      /**
       * This command is being used to create a new event
       * @param request Provide the request body.
       * Note: Specify the "pastDate" in the object only if you want to create an alarm for a previous date.
       * ex: {
       *      deviceName: 'Device1'
              type: "TestEvent",
              text: "sensor was triggered",
              pastDate: {
                month: 2,
                day: 15
              }
            }
       * Usage: createEvent(requestBody);
       */
      createEvent(request: any): void;

      /**
       * This command is being used to clone the application and install asset properties widget plugin the application clonned..
       */
      installPlugin(): void;

      /**
       * This command is being used to delete the clonned application.
       */
      deleteCustomApplication(): void;
      /**
       * This command is being used to delete all the widgets in clonned application.
       */
      deleteAllWidgets(): void;
    }
  }
}

function getDeviceId(deviceName: string) {
  return cy.apiRequest({
    method: 'GET',
    url: `/inventory/managedObjects?pageSize=1&query=$filter=(has(c8y_IsDevice) and ('name' eq '${deviceName}'))`,
    failOnStatusCode: false
  });
}

function setPastDate(requestBody) {
  const currentDate = new Date();
  if ('pastDate' in requestBody) {
    currentDate.setMonth(currentDate.getMonth() - requestBody.pastDate.month);
    currentDate.setDate(currentDate.getDate() - requestBody.pastDate.day);
  }
  return currentDate.toISOString();
}

Cypress.Commands.add('createMeasurement', requestBody => {
  getDeviceId(requestBody.deviceName).then((response: any) => {
    const deviceId = response.body.managedObjects[0].id;
    const formattedTimestamp = setPastDate(requestBody);
    const body = {
      [requestBody.fragment]: {
        [requestBody.series]: {
          value: requestBody.value,
          unit: requestBody.unit
        }
      },
      time: formattedTimestamp,
      source: {
        id: deviceId
      },
      type: requestBody.fragment
    };
    cy.apiRequest({
      method: 'POST',
      url: '/measurement/measurements',
      headers: {
        Accept: 'application/vnd.com.nsn.cumulocity.measurement+json'
      },
      body: body,
      failOnStatusCode: false
    })
      .its('status')
      .should('eq', 201);
  });
});

Cypress.Commands.add('createNewAlarm', alarmObject => {
  getDeviceId(alarmObject.deviceName).then((response: any) => {
    const deviceId = response.body.managedObjects[0].id;
    const formattedTimestamp = setPastDate(alarmObject);
    const modifiedObj = {
      source: {
        id: deviceId
      },
      type: alarmObject.type,
      text: alarmObject.text,
      severity: alarmObject.severity,
      status: alarmObject.status,
      time: formattedTimestamp
    };
    cy.apiRequest({
      method: 'POST',
      url: '/alarm/alarms',
      body: modifiedObj,
      failOnStatusCode: false
    })
      .its('status')
      .should('eq', 201);
  });
});

Cypress.Commands.add('createDevice', (deviceName, pastDate) => {
  const request = {
    url: '/inventory/managedObjects',
    method: 'Post',
    body: {
      name: deviceName,
      c8y_IsDevice: {},
      c8y_DeviceTypes: ['deviceSubsetType'],
      c8y_SupportedOperations: ['c8y_Restart']
    }
  };
  if (pastDate) {
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() - pastDate.month);
    currentDate.setDate(currentDate.getDate() - pastDate.day);
    request.body['creationTime'] = currentDate.toISOString();
  }
  cy.apiRequest(request);
});

Cypress.Commands.add('deleteAllDevices', () => {
  cy.apiRequest({
    url: 'inventory/managedObjects?fragmentType=c8y_IsDevice',
    method: 'GET',
    failOnStatusCode: false
  }).then((response: any) => {
    for (const mo of response.body.managedObjects) {
      cy.log('Deleting ', mo.id);
      cy.apiRequest({
        method: 'DELETE',
        url: `/inventory/managedObjects/${mo.id}`
      });
    }
  });
});

Cypress.Commands.add('addChildDevice', (parentDevice, childDevice) => {
  cy.apiRequest({
    url: `/inventory/managedObjects?q=$filter=(name eq '${parentDevice}' and has('c8y_IsDevice'))`,
    method: 'GET'
  }).then((response: any) => {
    const parentDeviceId = response.body.managedObjects[0].id;
    cy.apiRequest({
      method: 'GET',
      url: `/inventory/managedObjects?q=$filter=(name eq '${childDevice}' and has('c8y_IsDevice'))`
    }).then((response: any) => {
      const childDeviceId = response.body.managedObjects[0].id;
      cy.log(childDeviceId);
      cy.apiRequest({
        url: `/inventory/managedObjects/${parentDeviceId}/childDevices`,
        method: 'POST',
        body: {
          managedObject: { id: `${childDeviceId}` }
        }
      });
    });
  });
});

Cypress.Commands.add('createEvent', request => {
  getDeviceId(request.deviceName).then((response: any) => {
    const deviceId = response.body.managedObjects[0].id;
    const formattedTimestamp = setPastDate(request);
    const body = {
      source: {
        id: deviceId
      },
      type: request.type,
      text: request.text,
      time: formattedTimestamp
    };
    cy.apiRequest({
      method: 'POST',
      url: '/event/events',
      headers: {
        Accept: 'application/vnd.com.nsn.cumulocity.event+json'
      },
      body: body,
      failOnStatusCode: false
    })
      .its('status')
      .should('eq', 201);
  });
});

Cypress.Commands.add('addAssetToDevice', (parentDevice, asset) => {
  cy.apiRequest({
    url: `/inventory/managedObjects?q=$filter=(name eq '${parentDevice}' and has('c8y_IsDevice'))`,
    method: 'GET'
  }).then((response: any) => {
    const parentDeviceId = response.body.managedObjects[0].id;
    cy.apiRequest({
      method: 'GET',
      url: `/inventory/managedObjects?query=$filter=((has(c8y_IsAsset)) and ('name' eq '${asset}'))`,
      failOnStatusCode: false
    }).then((response: any) => {
      const assetId = response.body.managedObjects[0].id;
      cy.log(assetId);
      console.log(parentDeviceId, assetId);
      cy.apiRequest({
        url: `/inventory/managedObjects/${parentDeviceId}/childAssets`,
        method: 'POST',
        body: {
          managedObject: { id: `${assetId}` }
        }
      });
    });
  });
});

var customAppId = null;
Cypress.Commands.add('installPlugin', () => {
  //get cockpit id
  cy.apiRequest({
    url: `/application/applicationsByName/cockpit`,
    method: 'GET'
  }).then((response: any) => {
    const appId = response.body.applications[0].id;
    cy.log(appId);

    //clone app id
    cy.apiRequest({
      url: `/application/applications/${appId}/clone`,
      method: 'POST'
    }).then((response: any) => {
      customAppId = response.body.id;
      cy.log(customAppId);

      //get extension
      cy.apiRequest({
        url: `/application/applications?availability=SHARED&type=HOSTED&pageSize=2000`,
        method: 'GET'
      }).then((response: any) => {
        const applications = response.body.applications;
        var applicationVersions = null;
        for (var i = 0; i < applications.length; i++) {
          if (applications[i].contextPath === 'sag-pkg-asset-properties-widget') {
            applicationVersions = applications[i].manifest.version;
            cy.log(applicationVersions);
            break;
          }
        }
        var key = 'sag-pkg-asset-properties-widget@' + applicationVersions;
        //install plugin
        cy.apiRequest({
          url: `/application/applications/${customAppId}`,
          method: 'PUT',
          body: {
            id: customAppId,
            config: {
              remotes: { [key]: ['AssetPropertiesWidgetModule'] }
            }
          }
        });
      });
    });
  });
});

Cypress.Commands.add('deleteCustomApplication', () => {
  //get cockpit id
  cy.apiRequest({
    url: `/application/applications/${customAppId}`,
    method: 'DELETE'
  });
});

Cypress.Commands.add('deleteAllWidgets', () => {
  cy.apiRequest({
    url: `/inventory/managedObjects?fragmentType=c8y_Dashboard!name!home-cockpit1&pageSize=1`,
    method: 'GET'
  }).then((response: any) => {
    const widgetId = response.body.managedObjects[0].id;
    cy.log(widgetId);
    cy.apiRequest({
      url: `/inventory/managedObjects/${widgetId}`,
      method: 'PUT',
      body: {
        c8y_Dashboard: {},
        id: widgetId,
        c8y_Global: {}
      }
    });
  });
});
