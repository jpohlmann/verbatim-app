type ResponseStatus = 'success' | 'fail';

// Counter
export type Counter$Get$Response = {
  value: number;
};
export type LoginSuccessData = {
  scope: string;
  token_type: string;
  access_token: string;
  refresh_token: string;
}
export type LoginFailureData = {
  message: string;
}
// Auth
export type Auth$Login$Response = {
  status: 'success' | 'fail';
  data: LoginSuccessData | LoginFailureData;
};
