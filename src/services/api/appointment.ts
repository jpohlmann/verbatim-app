import { PatientApi } from "./patient";
import axios from 'axios';
import {ApiDomain} from '@app/constants/Api';

// Exporting types
export type Meta = {
    lastUpdated: string;
}

export type Link = {
    relation: string;
    url: string;
}

export type Coding = {
    system: string;
    code: string;
    display: string;
}

export type ReasonCode = {
    coding: Coding[];
    text: string;
}

export type Identifier = {
    system: string;
    value: string;
    display: string;
}

export type Participant = {
    actor: {
        reference: string;
        display: string;
        name?: string;
        id?: string;
    };
}

export type AppointmentType = {
    coding: Coding[];
    text: string;
}

export type SupportingInformation = {
    identifier: Identifier;
    display: string;
}

export type AppointmentResource = {
    resourceType: string;
    id: string;
    meta: Meta;
    status: string;
    appointmentType: AppointmentType;
    reasonCode: ReasonCode[];
    supportingInformation: SupportingInformation[];
    start: string;
    end: string;
    minutesDuration: number;
    created: string;
    participant: Participant[];
}

export type Entry = {
    fullUrl: string;
    resource: AppointmentResource;
}

export type Bundle = {
    resourceType: string;
    id: string;
    meta: Meta;
    type: string;
    total: number;
    link: Link[];
    entry: Entry[];
}
export class AppointmentApi {
  getAppointments = async (firmId: string, accessToken: string): Promise<Array<Entry>|undefined> => {
    try {
    const result = await axios.request(
        {
            url: `https://${ApiDomain}/appointment?firm_id=${firmId}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }
      );
    const appointment: Bundle = result.data;
    appointment.entry = appointment.entry.filter(entry => entry.resource.status !== 'cancelled');
    return (await decorateAppointmentsWithPatientNames(appointment, firmId, accessToken)).entry;
    } catch (e) {
        console.log('ERROR', e.message);
        return;
    }
  };
}
const decorateAppointmentsWithPatientNames = async (appointments: Bundle, firmId: string, accessToken: string): Promise<Bundle> => {
    const patientApi = new PatientApi();
    for (const appointment of appointments.entry) {
        const patient = appointment.resource.participant.find(participant => participant.actor.reference.includes('Patient'));
        if (patient) {
            const patientId = patient.actor.reference.replace(new RegExp(/.*Patient\//), '');
            const patientResult = await patientApi.getPatient(patientId, firmId, accessToken);
            if (patientResult !== undefined) {
                
                patient.actor = {
                    ...patient.actor,
                    name: patientResult.name[0].given[0] + ' ' + patientResult.name[0].family,
                    id: patientResult.id
                };
            }
        }
    }
        
    return appointments;
}