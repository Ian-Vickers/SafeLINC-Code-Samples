import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import colors from '../colors';
import CText from '../components/CText';

const CompletionButton = props => {
  // Version of the button before user completes the task
  if (!props.complete) {
    return (
      <View style={styles.view}>
        <TouchableOpacity style={styles.buttonContainer} onPress={props.funct}>
          <CText style={styles.buttonText} bold>
            {props.title}
          </CText>
          <CText style={styles.buttonSubtext}> {props.subtitle} </CText>
        </TouchableOpacity>
      </View>
    );
  }

  // Version of the button after user completes the task
  return (
    <View style={styles.view}>
      <TouchableOpacity style={styles.buttonContainerComplete}>
        <CText style={styles.buttonTextComplete} bold>
          {props.title}
        </CText>
        <CText style={styles.buttonSubtextComplete}> {props.subtitle} </CText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  view: {
    flex: 1,
    alignSelf: 'stretch',
    marginBottom: 8
  },

  buttonContainer: {
    elevation: 8,
    backgroundColor: colors.checkinBlue,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginTop: 15,
    marginHorizontal: 20
  },

  buttonContainerComplete: {
    elevation: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginTop: 15,
    marginHorizontal: 20
  },

  buttonText: {
    fontSize: 20,
    color: colors.white,
    marginLeft: 6,
    marginBottom: 2
  },

  buttonSubtext: {
    fontSize: 17,
    color: colors.white,
    marginLeft: 4
  },

  buttonTextComplete: {
    fontSize: 20,
    color: colors.black,
    marginLeft: 6,
    marginBottom: 2
  },

  buttonSubtextComplete: {
    fontSize: 17,
    color: colors.black,
    marginLeft: 4
  }
});

export default CompletionButton;
