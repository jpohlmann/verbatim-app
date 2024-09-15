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
import { Waveform } from '@lodev09/expo-recorder/src/components'
import { WAVEFORM_LINE_WIDTH, TIMELINE_MS_PER_LINE, METERING_MIN_POWER } from '@lodev09/expo-recorder/src/helpers/constants'
import type {
  StyleProp,
  ViewStyle,
} from 'react-native'
import {
  Pressable,
  TouchableOpacity,
    Platform,
    Text,
    View,
    ActivityIndicator,
    Alert
} from 'react-native';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import React, {useEffect, useState} from 'react';
import { Modal } from 'react-native-ui-lib'
import { Audio } from 'expo-av';
import { Entry, Participant } from '@app/services/api/appointment';
import { Spacing } from '../constants/Spacing'
import { Row } from '../components/row'
import { useServices } from '@app/services';
import { useStores } from '@app/stores';
import { getFormattedTime } from '@app/utils/date';
import { styles, RECORD_BUTTON_SIZE } from '../constants/Recorder/styles';
import { Metering } from '@lodev09/expo-recorder';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { LoginSuccessData } from '@app/utils/types/api';

enum RecordingStatuses {
  RECORDING_PAUSED = 'PAUSED',
  RECORDING_STOPPED = 'STOPPED',
  RECORDING_STARTED = 'STARTED'
}
const RECORDING_INDICATOR_SCALE = 0.5
const RECORDING_MAX_DURATION = 3600000
const DEFAULT_TIMELINE_UPDATE_INTERVAL = 50 // ms
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
    const scrollX = useSharedValue(0);
    const [recordTime, setRecordTime] = useState('00:00:00');
    const [duration, setDuration] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [meterings, setMeterings] = useState<Metering[]>([])
    const [recorderStatus, setRecorderStatus] = useState(RecordingStatuses.RECORDING_STOPPED);
    const [uri, setUri] = useState('');
    const [patient, setPatient] = useState<Participant|null>(null);
    const [audioRecorderPlayer, setAudioRecorderPlayer] = useState(new AudioRecorderPlayer());

    const timelineTotalWidthPer250ms = Spacing.sm + WAVEFORM_LINE_WIDTH
    const waveformMaxWidth = (duration / TIMELINE_MS_PER_LINE) * timelineTotalWidthPer250ms
    
    useEffect(() => {
      if (recorderStatus == RecordingStatuses.RECORDING_STARTED) {
        scrollX.value = withTiming(-waveformMaxWidth, { duration: DEFAULT_TIMELINE_UPDATE_INTERVAL })
      }
    }, [recorderStatus, waveformMaxWidth])

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
      styles.recordIndicator,
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
        if (recorderStatus == RecordingStatuses.RECORDING_STOPPED) {
          await onStartRecord()
          return;
        }
        if (recorderStatus == RecordingStatuses.RECORDING_PAUSED) {
          await onResumeRecord()
          return;
        }
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
    
    
        setUri(await audioRecorderPlayer.startRecorder(
          path,
          audioSet,
          true
        ));
    
        audioRecorderPlayer.addRecordBackListener((e: RecordBackType) => {
          setDuration(e.currentPosition);
          setMeterings((prev) => {
            return [
              ...prev,
              {
                position: Math.floor(e.currentPosition),
                key: Math.floor(e.currentPosition) + prev.length,
                db: e.currentMetering ?? METERING_MIN_POWER,
              },
            ]
          })
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
        if (patient?.actor.id && appointment && auth.apiLogin !== null && auth.sessionLogin !== null) {
          setUploading(true)
          const uploadString = await api.upload.getUploadString(
            patient?.actor.id, 
            auth as LoginSuccessData,
            appointment?.resource.id, auth.firm);
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
        setMeterings([])
        setRecorderStatus(RecordingStatuses.RECORDING_STOPPED);
        const result = await audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener();
        setRecordTime('00:00:00');
        setDuration(0);
        scrollX.value = 0;
      };

      return (
        <Modal visible={visible}>
        <ActivityIndicator animating={uploading} size="large" color="black" style={{alignSelf: "center", position: "absolute", top: "50%", zIndex: 1000}} />

        <Ionicons name="close" size={48} color="black" style={{paddingTop: '5%', alignSelf: 'flex-end'}} onPress={() => {props.toggleVisible(false)}} /> 
        <View style={{backgroundColor: 'white', height: '90%', paddingTop: '5%', paddingBottom: '10%'}} >
          <View style={{ padding: Spacing.md, marginBottom: Spacing.md }}>
            <Text style={[styles.positionText, { color: 'black' }]}>
              {appointment ? getFormattedTime(appointment.resource.start) : ''}
            </Text>
            <Text style={[styles.positionText, { color: 'black' }]}>
              {patient ? patient.actor.name : ''}
            </Text>
          </View>

          <Waveform
            timelineGap={Spacing.sm}
            maxDuration={RECORDING_MAX_DURATION}
            meterings={recorderStatus == RecordingStatuses.RECORDING_STARTED ? meterings.slice(-60) : meterings}
            waveformMaxWidth={waveformMaxWidth}
            recording={recorderStatus == RecordingStatuses.RECORDING_STARTED}
            playing={false}
            scrollX={scrollX}
            tintColor={Colors.light.recorderTint}
            timelineColor={Colors.light.recorderTimeline}
            backgroundColor={Colors.light.recorderBackgroundColor}
            progressBackgroundColor={Colors.light.recorderProgress}
            waveformInactiveColor={Colors.light.recorderWaveformInactive}
          />

          <Row style={{justifyContent: "space-between", alignItems: "center", backgroundColor: 'white', marginTop: Spacing.lg, marginBottom: Spacing.md}}>
          <View>
            <TouchableOpacity activeOpacity={0.5} style={styles.recordControl} onPress={onStopRecord}>
             <Ionicons name="refresh" size={Spacing.xl} style={{ color: '#1f62e0', alignSelf: 'center' }} />
             <Text style={{ color: '#1f62e0' }}>Restart</Text>
            </TouchableOpacity>
          </View>
          <View style={{justifyContent: "center", alignItems: "center", marginHorizontal: Spacing.xxl}}>
            <View style={[styles.recordButtonBackground, { borderColor: 'rgba(0,0,0,0.3)' }]} />
            <Pressable style={styles.recordButton} onPress={toggleRecording}>
              <Animated.View style={recordIndicatorStyles} />
            </Pressable>
          </View>
          <View>
            <TouchableOpacity activeOpacity={0.8} style={styles.recordControl} onPress={uploadFile} disabled={uri == ''}>
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

  export default RecorderPause;