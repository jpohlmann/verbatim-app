type ResponseStatus = 'success' | 'fail';

// Counter
export type Counter$Get$Response = {
  value: number;
};
export type ApiLoginData = {
  scope: string;
  token_type: string;
  access_token: string;
  refresh_token: string;
}
export type SessionLoginData = {
  csid: string;
  jsessionid: string;
  gdpr: string;
}
export type LoginSuccessData = {
  apiLogin: ApiLoginData;
  sessionLogin: SessionLoginData;
}
export type LoginFailureData = {
  message: string;
}
// Auth
export type Auth$Login$Response = {
  status: 'success' | 'fail';
  data: LoginSuccessData | LoginFailureData;
};
