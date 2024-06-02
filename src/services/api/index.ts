import { AppointmentApi } from './appointment';
import {AuthApi} from './auth';
import { PatientApi } from './patient';
import { UploadApi } from './upload';

export class ApiService implements IService {
  private inited = false;

  auth: AuthApi;
  appointment: AppointmentApi;
  patient: PatientApi;
  upload: UploadApi;
  
  constructor() {
    this.auth = new AuthApi();
    this.appointment = new AppointmentApi();
    this.patient = new PatientApi();
    this.upload = new UploadApi();
  }

  init = async (): PVoid => {
    if (!this.inited) {
      // your code ...

      this.inited = true;
    }
  };
}
