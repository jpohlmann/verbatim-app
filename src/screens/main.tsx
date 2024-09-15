import React, {useEffect, useState} from 'react';
import {ScrollView, Button} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import {View, Text, Colors, Image} from 'react-native-ui-lib';
import {observer} from 'mobx-react';
import {NavioScreen} from 'rn-navio';

import {useStores} from '@app/stores';
import {useServices} from '@app/services';
import {useAppearance} from '@app/utils/hooks';
import {BButton} from '@app/components/button';
import { isLoginSuccess } from '@app/services/api/auth';

export type Props = {
  type?: 'push';
};

export const Main: NavioScreen<Props> = observer(({type = 'push'}) => {

  useAppearance(); // for Dark Mode
  const {navio, api} = useServices();
  const {auth} = useStores();

  // State
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  // Start
  useEffect(() => {
    configureUI();
  }, []);

  // API Methods
  const login = async () => {
    setLoading(true);

    try {
      const {status, data} = await api.auth.login(auth.username, password, auth.firm);
      console.log('login data', data);
      console.log('is login data', isLoginSuccess(data));
      console.log('status', status);
      if (status === 'success' && isLoginSuccess(data)) {
        console.log('setting login data');
        // marking that we are logged in
        auth.set('state', 'logged-in');
        auth.set('apiLogin', data.apiLogin);
        auth.set('sessionLogin', data.sessionLogin);
        navio.setRoot('tabs', 'AppTabs');
      }
    } catch (e) {
      console.log('ERROR', e);
      // handle error
    } finally {
      setLoading(false);
    }
  };

  // Methods
  const configureUI = () => {};

  const setUsername = (v: string) => auth.set('username', v);
  const setFirm = (v: string) => auth.set('firm', v);
  return (
    <View flex bg-bgColor>
      <View style={{marginTop: '10%', width: '100%', alignItems: 'center' }} ><Image source={require('./splash_transparent.png')} /></View>
      <ScrollView contentInsetAdjustmentBehavior="always">
        <View>
          <View flex centerH marginT-30>
            <Text text50>Login</Text>
          </View>

          <View marginT-s6 centerH>
            <View
              paddingH-s4
              marginV-s10
              style={{width: 300, borderWidth: 1, borderColor: Colors.grey50, borderRadius: 12}}
            >
              <View paddingH-s3 paddingV-s2 marginV-s4>
                <TextInput
                  placeholder={'Username'}
                  value={auth.username}
                  onChangeText={setUsername}
                  inputMode="text"
                />
              </View>

              <View centerH>
                <View height={1} bg-grey50 style={{width: '100%'}} />
              </View>

              <View paddingH-s3 paddingV-s2 marginV-s4>
                <TextInput
                  placeholder={'Password'}
                  value={password}
                  onChangeText={setPassword}
                  keyboardType="visible-password"
                  secureTextEntry
                />
              </View>
              <View centerH>
                <View height={1} bg-grey50 style={{width: '100%'}} />
              </View>

              <View paddingH-s3 paddingV-s2 marginV-s4>
                <TextInput
                  placeholder={'Practice'}
                  value={auth.firm}
                  onChangeText={setFirm}
                  inputMode="text"
                />
              </View>
            </View>

            <BButton label={loading ? 'Logging in ...' : 'Login'} onPress={login} />
            <Button title="TESTING: Populate login" onPress={() => {
              setFirm('verbatimaisandbox');
              setPassword('Password1234');
              setUsername('dcane');
            }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
});
Main.options = props => ({
  title: `Auth flow`,
  headerShown: false
});
