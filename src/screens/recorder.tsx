import React, { forwardRef, useRef, type Ref, useState } from 'react'
import {
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
  TouchableOpacity,
  Text,
  type TextStyle,
  ActivityIndicator,
  Alert
} from 'react-native'
import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system';
import Ionicons from '@expo/vector-icons/Ionicons'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type WithSpringConfig,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Recorder, type RecorderRef } from '@lodev09/expo-recorder'

import { useThemeColor } from '../hooks/useThemeColor'
import { Spacing } from '../constants/Spacing'
import { formatTimer } from '../utils/formatTimer'
import { Row } from '../components/row'
import { ActionSheet, Modal } from 'react-native-ui-lib'
import { AppointmentResource, Entry, Participant } from '@app/services/api/appointment'
import { getFormattedTime } from '../utils/date'
import { useStores } from '@app/stores'
import { navio } from '@app/navio'
import { useServices } from '@app/services'

const RECORD_BUTTON_SIZE = 60
const RECORD_BUTTON_BACKGROUND_SIZE = RECORD_BUTTON_SIZE + Spacing.md
const RECORDING_INDICATOR_COLOR = '#d72d66'
const RECORDING_INDICATOR_SCALE = 0.5
const RECORDING_MAX_DURATION = 3600000
const SPRING_SHORT_CONFIG: WithSpringConfig = {
  stiffness: 120,
  overshootClamping: true,
}

export interface ThemedRecorderSheetProps {
  lightColor?: string
  darkColor?: string
  style?: object
  appointment?: Entry|undefined
  visible: boolean
  uploadFinished: () => void
  toggleVisible: (visible: boolean) => void
}

export const ThemedRecorderSheet = forwardRef(
  (props: ThemedRecorderSheetProps, ref: Ref<typeof ActionSheet>) => {
    const { style, lightColor, darkColor, appointment, visible, toggleVisible, ...rest } = props
    const {auth} = useStores();
    const {navio, api} = useServices();
    if (!auth.access_token) {
      toggleVisible(false);
      navio.push('Main');
    }

    const insets = useSafeAreaInsets()

    const [isRecording, setIsRecording] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [uri, setUri] = useState('')
    const [uploading, setUploading] = useState(false)
    const [position, setPosition] = useState(0)

    const recorderRef = useRef<RecorderRef>(null)

    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'recorderSheet')
    const progressBackgroundColor = useThemeColor({}, 'recorderProgress')
    const iconColor = useThemeColor({}, 'recorderIcon')
    const tintColor = useThemeColor({}, 'recorderTint')
    const timelineColor = useThemeColor({}, 'recorderTimeline')
    const positionColor = useThemeColor({}, 'text')
    const recordBorderColor = useThemeColor({ light: 'rgba(0,0,0,0.3)' }, 'text')
    const recorderBackgroundColor = useThemeColor({}, 'recorderBackground')
    const waveformInactiveColor = useThemeColor({}, 'recorderWaveformInactive')
    let patient: Participant|null = null;
    if (appointment) {
      const patientObj = appointment.resource.participant.find(participant => participant.actor && participant.actor.reference.includes('Patient'));
      if (patientObj) {
        patient = patientObj;
      }
    }
    const scale = useSharedValue(1)

    const toggleRecording = async () => {
      await Audio.requestPermissionsAsync();

      const permissionStatus = await Audio.getPermissionsAsync();

      if (!permissionStatus.granted) return

      if (isRecording) {
        await recorderRef.current?.stopRecording()
      } else {
        await recorderRef.current?.startRecording()
      }
    }

    const resetRecording = async () => {
      if (isRecording) return
      if (uri != '') {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        setUri('')
      }
      await recorderRef.current?.resetRecording()
    }

    const uploadFile = async () => {
      if (patient?.actor.id) {
        setUploading(true);
        const uploadString = await api.upload.getUploadString(patient?.actor.id, auth.firm, auth.access_token);
        await api.upload.uploadToS3(uri, uploadString);
        await FileSystem.deleteAsync(uri, { idempotent: true });
        setUploading(false);
        setUri('')
        toggleVisible(false);
        Alert.alert('Upload Confirmation', 'Recording Uploaded', [
          {text: 'OK', onPress: () => console.log('OK Pressed')}])
      }
      console.log(uri)
    }

    const $recordIndicatorStyles: StyleProp<ViewStyle> = [
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

    return (
      <Modal visible={visible}>
        <ActivityIndicator animating={uploading} size="large" color="black" style={{alignSelf: "center", position: "absolute", top: "50%", zIndex: 1000}} />

        <Ionicons name="close" size={48} color="black" style={{paddingTop: '5%', alignSelf: 'flex-end'}} onPress={() => {toggleVisible(false)}} /> 
        <View style={{backgroundColor: 'white', height: '90%', paddingTop: '5%', paddingBottom: '10%'}} >
        <View style={{ padding: Spacing.md, marginBottom: Spacing.md }}>
          <Text style={[$positionText, { color: 'black' }]}>
            {appointment ? getFormattedTime(appointment.resource.start) : ''}
          </Text>
          <Text style={[$positionText, { color: 'black' }]}>
            {patient ? patient.actor.name : ''}
          </Text>
        </View>
        <Recorder
          ref={recorderRef}
          tintColor={tintColor}
          waveformInactiveColor={waveformInactiveColor}
          progressInterval={50}
          timelineColor={timelineColor}
          backgroundColor={recorderBackgroundColor}
          progressBackgroundColor={progressBackgroundColor}
          maxDuration={RECORDING_MAX_DURATION}
          onRecordReset={() => {
            scale.value = 1
            setIsRecording(false)
            setIsPlaying(false)
          }}
          onRecordStart={() => {
            scale.value = withSpring(RECORDING_INDICATOR_SCALE, SPRING_SHORT_CONFIG)
            setIsRecording(true)
          }}
          onRecordStop={(uri, duration) => {
            scale.value = withSpring(1, SPRING_SHORT_CONFIG)
            setIsRecording(false)

            // Use this uri. Yay! 🎉
            if (uri) {
              setUri(uri)
            }
          }}
          onPlaybackStart={() => setIsPlaying(true)}
          onPlaybackStop={() => setIsPlaying(false)}
          onPositionChange={(pos: number) => setPosition(pos)}
        />

        <View style={{ padding: Spacing.md, marginTop: Spacing.xxl, marginBottom: Spacing.md }}>
          <Text style={[$positionText, { color: 'black' }]}>
            {formatTimer(Math.round(position / 100) * 100, true)}
          </Text>
        </View>
        <Row style={{justifyContent: "space-between", alignItems: "center", marginTop: Spacing.lg, marginBottom: Spacing.md}}>
          <View>
            <TouchableOpacity activeOpacity={0.5} style={$recordControl} onPress={resetRecording}>
             <Ionicons name="refresh" size={Spacing.xl} style={{ color: '#1f62e0', alignSelf: 'center' }} />
             <Text style={{ color: '#1f62e0' }}>Restart</Text>
            </TouchableOpacity>
          </View>
          <View style={{justifyContent: "center", alignItems: "center", marginHorizontal: Spacing.xxl}}>
            <View style={[$recordButtonBackground, { borderColor: recordBorderColor }]} />
            <Pressable style={$recordButton} onPress={toggleRecording}>
              <Animated.View style={$recordIndicatorStyles} />
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
    )
  }
)

const $sheetContent: ViewStyle = {
  paddingTop: Spacing.xl,
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