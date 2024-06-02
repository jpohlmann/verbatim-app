import axios from 'axios';
import {ApiDomain} from '@app/constants/Api';

export type Extension = {
  url: string;
  extension: Extension[];
  valueString?: string;
}

export type Identifier = {
  system: string;
  value: string;
}

export type Name = {
  family: string;
  given: string[];
}

export type Coding = {
  system: string;
  code: string;
  display: string;
}

export type Meta = {
  lastUpdated: string;
}

export type MaritalStatus = {
  coding: Coding[];
  text: string;
}

export type Patient = {
  resourceType: string;
  id: string;
  meta: Meta;
  extension: Extension[];
  identifier: Identifier[];
  active: boolean;
  name: Name[];
  gender: string;
  birthDate: string;
  deceasedBoolean: boolean;
  maritalStatus: MaritalStatus;
}

export class PatientApi {
    getPatient = async (id: string, firmId: string, accessToken: string): Promise<Patient|undefined> => {
      try {
      const result = await axios.request(
        {
            url: `https://${ApiDomain}/patient?patient_id=${id}&firm_id=${firmId}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
          }
      );
      return result.data;
        } catch (e) {
          console.log('ERROR', e.message);
        }
    };
  }