import AudioRecorderPlayer, {
    AVEncoderAudioQualityIOSType,
    AVEncodingOption,
    AudioEncoderAndroidType,
    AudioSourceAndroidType,
    OutputFormatAndroidType,
  } from 'react-native-audio-recorder-player';
import type {
    AudioSet,
    RecordBackType,
} from 'react-native-audio-recorder-player';
import * as FileSystem from 'expo-file-system';
import Ionicons from '@expo/vector-icons/Ionicons';
import type {
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native'
import {
  Pressable,
  TouchableOpacity,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    Alert
} from 'react-native';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import type {
  WithSpringConfig
} from 'react-native-reanimated'
import React, {Component, useEffect, useState} from 'react';
import { Modal } from 'react-native-ui-lib'
import Button from '../components/recorder/button';
import type {ReactElement} from 'react';
import { Audio } from 'expo-av';
import { Entry, Participant } from '@app/services/api/appointment';
import { ApiService } from '@app/services/api';
import { AuthStore } from '@app/stores/auth';
import { Spacing } from '../constants/Spacing'
import { Row } from '../components/row'
import { useServices } from '@app/services';
import { useStores } from '@app/stores';
import { getFormattedTime } from '@app/utils/date';

enum RecordingStatuses {
  RECORDING_PAUSED = 'PAUSED',
  RECORDING_STOPPED = 'STOPPED',
  RECORDING_STARTED = 'STARTED'
}
const RECORD_BUTTON_SIZE = 60
const RECORD_BUTTON_BACKGROUND_SIZE = RECORD_BUTTON_SIZE + Spacing.md
const RECORDING_INDICATOR_COLOR = '#d72d66'
const RECORDING_INDICATOR_SCALE = 0.5
const RECORDING_MAX_DURATION = 3600000
  const styles: any = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#455A64',
      flexDirection: 'column',
      alignItems: 'center',
    },
    titleTxt: {
      marginTop: 100,
      color: 'white',
      fontSize: 28,
    },
    viewRecorder: {
      marginTop: 40,
      width: '100%',
      alignItems: 'center',
    },
    recordBtnWrapper: {
      flexDirection: 'row',
    },
    viewPlayer: {
      marginTop: 60,
      alignSelf: 'stretch',
      alignItems: 'center',
    },
    viewBarWrapper: {
      marginTop: 28,
      marginHorizontal: 28,
      alignSelf: 'stretch',
    },
    viewBar: {
      backgroundColor: '#ccc',
      height: 4,
      alignSelf: 'stretch',
    },
    viewBarPlay: {
      backgroundColor: 'white',
      height: 4,
      width: 0,
    },
    playStatusTxt: {
      marginTop: 8,
      color: '#ccc',
    },
    playBtnWrapper: {
      flexDirection: 'row',
      marginTop: 40,
    },
    btn: {
      borderColor: 'black',
      borderWidth: 1,
    },
    txt: {
      color: 'black',
      fontSize: 14,
      marginHorizontal: 8,
      marginVertical: 4,
    },
    txtRecordCounter: {
      marginTop: 32,
      color: 'black',
      fontSize: 20,
      textAlignVertical: 'center',
      fontWeight: '200',
      fontFamily: 'Helvetica Neue',
      letterSpacing: 3,
    },
    txtCounter: {
      marginTop: 12,
      color: 'black',
      fontSize: 20,
      textAlignVertical: 'center',
      fontWeight: '200',
      fontFamily: 'Helvetica Neue',
      letterSpacing: 3,
    },
  });
  
  const screenWidth = Dimensions.get('screen').width;
  type RecorderProps = {
    visible: boolean;
    uploadFinished: () => void;
    appointment: Entry | undefined;
    toggleVisible: (visible: boolean) => void;
  }
  export const RecorderPause: React.FC<RecorderProps>= (props: RecorderProps) => {
    const { api } = useServices();  
    const { auth } = useStores();
    const path = Platform.select({
      ios: undefined,
      android: undefined,
  
      // Discussion: https://github.com/hyochan/react-native-audio-recorder-player/discussions/479
      // ios: 'https://firebasestorage.googleapis.com/v0/b/cooni-ebee8.appspot.com/o/test-audio.mp3?alt=media&token=d05a2150-2e52-4a2e-9c8c-d906450be20b',
      // ios: 'https://staging.media.ensembl.fr/original/uploads/26403543-c7d0-4d44-82c2-eb8364c614d0',
      // ios: 'hello.m4a',
      // android: `${this.dirs.CacheDir}/hello.mp3`,
    });
    const scale: SharedValue<number> = useSharedValue(1);
    const [recordTime, setRecordTime] = useState('00:00:00');
    const [uploading, setUploading] = useState(false);
    const [recorderStatus, setRecorderStatus] = useState(RecordingStatuses.RECORDING_STOPPED);
    const [uri, setUri] = useState('');
    const [patient, setPatient] = useState<Participant|null>(null);
    const [audioRecorderPlayer, setAudioRecorderPlayer] = useState(new AudioRecorderPlayer());
  
    audioRecorderPlayer.setSubscriptionDuration(0.1); // optional. Default is 0.5
    const { appointment } = props
    useEffect(() => {
      if (appointment) {
        const patientObj = appointment.resource.participant.find(participant => participant.actor && participant.actor.reference.includes('Patient'));
        if (patientObj) {
          setPatient(patientObj);
        }
      }}, [appointment]
    );


    const recordIndicatorStyles: StyleProp<ViewStyle> = [
      $recordIndicator,
      useAnimatedStyle(() => ({
        borderRadius: interpolate(
          scale.value,
          [1, RECORDING_INDICATOR_SCALE],
          [RECORD_BUTTON_SIZE / 2, Spacing.xs],
          Extrapolation.CLAMP
        ),
        transform: [{ scale: scale.value }],
      })),
    ]
      const { visible } = props

      const toggleRecording = async (): Promise<void> => {
        console.log('Recorder status', recorderStatus);
        if (recorderStatus == RecordingStatuses.RECORDING_STOPPED) {
          console.log('starting')
          await onStartRecord()
          return;
        }
        if (recorderStatus == RecordingStatuses.RECORDING_PAUSED) {
          console.log('resuming')
          await onResumeRecord()
          return;
        }
        console.log('pausing')
        await onPauseRecord();
      }
      const onStartRecord = async (): Promise<void> => {
      await Audio.requestPermissionsAsync();
  
        const permissionStatus = await Audio.getPermissionsAsync();
  
        if (!permissionStatus.granted) return
        setRecorderStatus(RecordingStatuses.RECORDING_STARTED);
        const audioSet: AudioSet = {
          AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
          AudioSourceAndroid: AudioSourceAndroidType.MIC,
          AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
          AVNumberOfChannelsKeyIOS: 2,
          AVFormatIDKeyIOS: AVEncodingOption.aac,
          OutputFormatAndroid: OutputFormatAndroidType.AAC_ADTS,
        };
    
        console.log('audioSet', audioSet);
    
        setUri(await audioRecorderPlayer.startRecorder(
          path,
          audioSet,
        ));
    
        audioRecorderPlayer.addRecordBackListener((e: RecordBackType) => {
          //console.log('record-back', e);
          setRecordTime(audioRecorderPlayer.mmssss(
            Math.floor(e.currentPosition),
          ));
        });
        console.log(`uri: ${uri}`);
      };
    
      const onPauseRecord = async (): Promise<void> => {
        setRecorderStatus(RecordingStatuses.RECORDING_PAUSED);
        try {
          const r = await audioRecorderPlayer.pauseRecorder();
          console.log(r);
        } catch (err) {
          console.log('pauseRecord', err);
        }
      };
    
      const onResumeRecord = async (): Promise<void> => {
        setRecorderStatus(RecordingStatuses.RECORDING_STARTED);
        await audioRecorderPlayer.resumeRecorder();
      };
  
      const uploadFile = async (): Promise<void> => {
        await onStopRecord();
        if (patient?.actor.id) {
          setUploading(true)
          const uploadString = await api.upload.getUploadString(patient?.actor.id, auth.firm, auth.access_token);
          await api.upload.uploadToS3(uri, uploadString);
          await FileSystem.deleteAsync(uri, { idempotent: true });
          setUploading(false)
          setUri('')
          props.uploadFinished();
          props.toggleVisible(false);
          Alert.alert('Upload Confirmation', 'Recording Uploaded', [
            {text: 'OK', onPress: () => console.log('OK Pressed')}])
        }
      }
  
      const onStopRecord = async (): Promise<void> => {
        setRecorderStatus(RecordingStatuses.RECORDING_STOPPED);
        const result = await audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener();
        setRecordTime('00:00:00');
      };

      return (
        <Modal visible={visible}>
        <ActivityIndicator animating={uploading} size="large" color="black" style={{alignSelf: "center", position: "absolute", top: "50%", zIndex: 1000}} />

        <Ionicons name="close" size={48} color="black" style={{paddingTop: '5%', alignSelf: 'flex-end'}} onPress={() => {props.toggleVisible(false)}} /> 
        <View style={{backgroundColor: 'white', height: '90%', paddingTop: '5%', paddingBottom: '10%'}} >
          <View style={{ padding: Spacing.md, marginBottom: Spacing.md }}>
            <Text style={[$positionText, { color: 'black' }]}>
              {appointment ? getFormattedTime(appointment.resource.start) : ''}
            </Text>
            <Text style={[$positionText, { color: 'black' }]}>
              {patient ? patient.actor.name : ''}
            </Text>
          </View>
          
          <Text style={styles.txtRecordCounter}>{recordTime}</Text>

          <Row style={{justifyContent: "space-between", alignItems: "center", backgroundColor: 'white', marginTop: Spacing.lg, marginBottom: Spacing.md}}>
          <View>
            <TouchableOpacity activeOpacity={0.5} style={$recordControl} onPress={onStopRecord}>
             <Ionicons name="refresh" size={Spacing.xl} style={{ color: '#1f62e0', alignSelf: 'center' }} />
             <Text style={{ color: '#1f62e0' }}>Restart</Text>
            </TouchableOpacity>
          </View>
          <View style={{justifyContent: "center", alignItems: "center", marginHorizontal: Spacing.xxl}}>
            <View style={[$recordButtonBackground, { borderColor: 'rgba(0,0,0,0.3)' }]} />
            <Pressable style={$recordButton} onPress={toggleRecording}>
              <Animated.View style={recordIndicatorStyles} />
            </Pressable>
          </View>
          <View>
            <TouchableOpacity activeOpacity={0.8} style={$recordControl} onPress={uploadFile} disabled={uri == ''}>
              <Ionicons
                name='cloud-upload'
                size={Spacing.xl}
                style={{ color: uri == '' ? 'lightgrey' : '#1f62e0', alignSelf: 'center' }}
              />
              <Text style={{ color: uri == '' ? 'lightgrey' : '#1f62e0' }}>Upload</Text>
            </TouchableOpacity>
          </View>
        </Row>
        </View>
      </Modal>
      );
    
  }

const $recordButtonBackground: ViewStyle = {
  borderRadius: RECORD_BUTTON_BACKGROUND_SIZE / 2,
  height: RECORD_BUTTON_BACKGROUND_SIZE,
  width: RECORD_BUTTON_BACKGROUND_SIZE,
  borderWidth: 2,
  borderColor: 'white',
}

const $recordButton: ViewStyle = {
  position: 'absolute',
}

const $recordIndicator: ViewStyle = {
  backgroundColor: RECORDING_INDICATOR_COLOR,
  borderRadius: RECORD_BUTTON_SIZE / 2,
  height: RECORD_BUTTON_SIZE,
  width: RECORD_BUTTON_SIZE,
}

const $recordControl: ViewStyle = {
  padding: Spacing.md,
  alignContent: 'flex-end',
  justifyContent: 'space-around'
}

const $positionText: TextStyle = {
  fontWeight: '400',
  fontSize: 28,
  textAlign: 'center',
}
  export default RecorderPause;