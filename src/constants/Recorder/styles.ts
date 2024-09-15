import { StyleSheet } from "react-native";
import { Spacing } from "../Spacing";
export const RECORD_BUTTON_SIZE = 60
const RECORD_BUTTON_BACKGROUND_SIZE = RECORD_BUTTON_SIZE + Spacing.md
const RECORDING_INDICATOR_COLOR = '#d72d66'
export const styles: any = StyleSheet.create({
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
    recordButtonBackground: {
        borderRadius: RECORD_BUTTON_BACKGROUND_SIZE / 2,
        height: RECORD_BUTTON_BACKGROUND_SIZE,
        width: RECORD_BUTTON_BACKGROUND_SIZE,
        borderWidth: 2,
        borderColor: 'white'
    },
    recordButton: {
        position: 'absolute'
    },
    recordIndicator: {
        backgroundColor: RECORDING_INDICATOR_COLOR,
        borderRadius: RECORD_BUTTON_SIZE / 2,
        height: RECORD_BUTTON_SIZE,
        width: RECORD_BUTTON_SIZE
    },
    recordControl: {
        padding: Spacing.md,
        alignContent: 'flex-end',
        justifyContent: 'space-around'
    },
    positionText: {
        fontWeight: '400',
        fontSize: 28,
        textAlign: 'center'
    }
  });