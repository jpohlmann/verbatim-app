import {sleep} from '@app/utils/help';
import {Auth$Login$Response} from '@app/utils/types/api';
import axios from 'axios';
import {ApiDomain} from '@app/constants/Api';
export class AuthApi {
  login = async (username: string, password: string, firmId: string): Promise<Auth$Login$Response> => {
    try {
      const result = await axios.request(
        {
            url: `https://${ApiDomain}/auth`,
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: {
                username,
                password,
                firm_id: firmId
            }
        }
      );
      if (result.status == 201) {
        return {
          status: 'success',
          data: result.data
        };
      }
      return {
        status: 'fail',
        data: result.data
      };
    } catch (e) {
      console.log('request error', e.message);
      return {
        status: 'fail',
        data: e.message
      };
    }
  };
}
