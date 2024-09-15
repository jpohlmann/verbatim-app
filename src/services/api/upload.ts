import axios from 'axios';
import {ApiDomain} from '@app/constants/Api';
import fs from 'react-native-fs';
import { LoginSuccessData } from '@app/utils/types/api';

export class UploadApi {
    getUploadString = async (patientId: string, auth: LoginSuccessData, appointmentId: string, firmId: string): Promise<string> => {
      const result = await axios.request(
            {
                url: `https://${ApiDomain}/upload`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.apiLogin.access_token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                data: {
                    auth,
                    firm_id: firmId,
                    patient_id: patientId,
                    appointment_id: appointmentId
                }
              }
          );
        return result.data.url as string;
    };
    uploadToS3 = async (localFile: string, signedUrl: string): Promise<void> => {
        try {
          console.log('local file', localFile);
          console.log('signed url', signedUrl);
          const fileStream = await fs.readFile(localFile, 'base64');
          const response = await axios.put(signedUrl, fileStream, {
            headers: {
              'Content-Type': 'audio/m4a',
              'Content-Transfer-Encoding': 'base64'
            },
          });
          console.log('File uploaded successfully:', response);
        } catch (error) {
          console.error('Error uploading file:', error);
        }
    };
}