import React, {useEffect, useState} from 'react';
import {Text, View, Button, Image} from 'react-native-ui-lib';
import {observer} from 'mobx-react';
import {NavioScreen} from 'rn-navio';

import {useServices} from '@app/services';
import {useAppearance} from '@app/utils/hooks';
import {FlashList} from '@shopify/flash-list';
import {Row} from '@app/components/row';

import { AppointmentApi, AppointmentResource, Entry } from '@app/services/api/appointment';
import { getFormattedDateTime } from '@app/utils/date';

import { ThemedRecorderSheet } from './recorder';
import { useStores } from '@app/stores';

export type Props = {};
export const AppointmentList: NavioScreen<Props> = observer(() => {
  useAppearance(); // for Dark Mode
  // const {ui} = useStores();
  const {navio} = useServices();
  const {auth} = useStores();
  const navigation = navio.useN();
  const appointmentApi = new AppointmentApi();
  const [appointments, setAppointments] = useState<Array<Entry>>([]);
  const [recordingFinished, setRecordingFinished] = useState<boolean>(false);
  const [recorderVisible, setRecorderVisible] = useState<boolean>(false);
  const [appointment, setAppointment] = useState<Entry|undefined>(undefined);
  useEffect(() => {
    (async () => {
      if (!auth.access_token) {
        navio.push('Main');
      } else {
        const appointmentData = await appointmentApi.getAppointments(auth.firm, auth.access_token);
        if (appointmentData) {
          setAppointments(appointmentData);
        }
      }
    })();
  }, []);
  // State

  // Methods

  // Start
  useEffect(() => {
    configureUI();
  }, []);

  // UI Methods
  const configureUI = () => {
    navigation.setOptions({});
  };

  // UI Methods

  return (
    <View flex bg-bgColor>
      <ThemedRecorderSheet uploadFinished={() => { setRecordingFinished(true) }} appointment={appointment} visible={recorderVisible} toggleVisible={setRecorderVisible} />
      <View style={{marginTop: '5%', width: '100%', alignItems: 'center', marginBottom: '10%' }} ><Image source={require('./splash_transparent.png')} /></View>
      <Text style={{display: recordingFinished ? 'flex' : 'none'}} center={true} color={'green'}>Recording Uploaded</Text>
      <FlashList
        contentInsetAdjustmentBehavior="always"
        data={appointments}
        renderItem={({item}) => <ListItem item={item} setAppointment={setAppointment} setRecorderVisible={setRecorderVisible} setRecordingFinished={setRecordingFinished} />}
        estimatedItemSize={300}
      />
    </View>
  );
});
AppointmentList.options = {
  headerBackTitleStyle: false,
  title: `Appointment List`,
  headerShown: false
};
const listStyles = {
  app: {
  flex: 2, // the number of columns you want to devide the screen into
  width: 400,
}
};
const ListItem = ({item, setAppointment, setRecorderVisible, setRecordingFinished}: {item: Entry, setAppointment: (item: Entry) => void, setRecorderVisible: (visible: boolean) => void, setRecordingFinished: (finished: boolean) => void}) => {
  useAppearance();
  const patient = item.resource.participant.find(participant => participant.actor && participant.actor.reference.includes('Patient'));
  return (
    <View padding-s2 paddingH-s4 paddingB-s8 bg-bgColor>
      <Row>

        <View style={listStyles.app}>
          <Text textColor text50R marginL-s2>
            {patient? patient.actor.name : 'Patient not found'}
          </Text>

          <Text textColor text70R marginL-s2>
            {getFormattedDateTime(item.resource.start)}
          </Text>
          <Button size={Button.sizes.medium} label="Record" onPress={() => {
            setRecordingFinished(false);
            setAppointment(item);
            setRecorderVisible(true);
          }} />
        </View>
      </Row>
    </View>
  );
};
