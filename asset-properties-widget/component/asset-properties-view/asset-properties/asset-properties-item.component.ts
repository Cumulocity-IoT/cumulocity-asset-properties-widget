import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { IManagedObjectBinary } from '@c8y/client';
import { AlertService, C8yJSONSchema, gettext, FilesService } from '@c8y/ngx-components';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { AssetPropertiesItem } from './asset-properties.model';
import { JSONSchema7 } from 'json-schema';
import { clone } from 'lodash-es';

export class MaxLengthValidator {
  static maxLength(maxLength: number) {
    return (control: FormControl): ValidationErrors => {
      if (!control.value) {
        return null;
      }
      if (control.value.length > maxLength) {
        control.setValue(control.value.substring(0, maxLength));
      }
      return null;
    };
  }
}

@Component({
  selector: 'c8y-asset-properties-item',
  templateUrl: './asset-properties-item.component.html'
})
export class AssetPropertiesItemComponent implements AssetPropertiesItem, OnChanges {
  @Input()
  key: string;
  @Input()
  value: any;
  @Input()
  label: string;
  @Input()
  type: string;
  @Input()
  file: IManagedObjectBinary;
  @Input()
  complex: AssetPropertiesItem[];
  @Input()
  isEdit: boolean;
  @Input()
  jsonSchema: JSONSchema7;
  @Input()
  lastUpdated: string;
  @Input()
  isEditable: boolean;
  @Input()
  active: boolean;
  @Input()
  isStandardProperty: boolean;

  form: FormGroup;
  fields: FormlyFieldConfig[];
  model: any;
  previewImage: string;
  defaultEmptyValue: string;

  constructor(
    private alert: AlertService,
    private c8yJsonSchemaService: C8yJSONSchema,
    public filesService: FilesService
  ) {}

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes.isEdit) {
      this.resolveJsonSchema();
      await this.resolveFile();
    }
    this.defaultEmptyValue = this.isStandardProperty ? 'No data' : 'Undefined';
  }

  private async resolveFile() {
    if (this.file) {
      try {
        const imageFile = await this.filesService.getFile(this.file);
        this.previewImage = await this.getPreviewIfImage(imageFile);
      } catch (ex) {
        this.alert.danger(gettext('File could not be loaded.'));
      }
    }
  }

  private formComplexPropsValue() {
    const complexProps = {};
    this.complex.forEach(complexObj => {
      if (complexObj.file) {
        complexProps[complexObj.key] = complexObj.value;
      } else if (this.value[complexObj.key] != null) {
        complexProps[complexObj.key] = this.value[complexObj.key];
      }
    });
    return complexProps;
  }

  private getModel() {
    if (this.complex && this.complex.length > 0) {
      return {
        [this.key]: this.formComplexPropsValue()
      };
    }
    return {
      [this.key]: clone(this.value)
    };
  }

  private resolveJsonSchema() {
    const assetNameMaxLength: number = 254;
    if (this.jsonSchema) {
      this.jsonSchema = { properties: this.jsonSchema.properties };
      const fieldConfig = this.c8yJsonSchemaService.toFieldConfig(this.jsonSchema as JSONSchema7, {
        map(mappedField: FormlyFieldConfig) {
          const result: FormlyFieldConfig = mappedField;
          if (mappedField.key === 'name') {
            mappedField.validators = {
              ...{ validation: [MaxLengthValidator.maxLength(assetNameMaxLength)] }
            };
          }
          return result;
        }
      });
      this.form = new FormGroup({});
      this.fields = [fieldConfig];
      this.model = this.getModel();
    }
  }

  private async getPreviewIfImage(imageFile: File) {
    if (this.filesService.haveValidExtensions(imageFile, 'image')) {
      return this.filesService.toBase64(imageFile);
    }
  }
}
