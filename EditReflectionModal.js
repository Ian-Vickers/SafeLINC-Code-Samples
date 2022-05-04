import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import colors from '../../../../colors';
import InputFieldParagraph from './../../../../components/InputFieldParagraph';
import CText from './../../../../components/CText';

const EditReflectionModal = props => {

  const {
    content,
    updateReflection
  } = props.navigation.state.params;

  const reflectionHandler = enteredText => {
    updateReflection(enteredText);
  };


  return (
    <KeyboardAwareScrollView style={styles.mainContainer}>
      <InputFieldParagraph filled={true} fill={content} tag={'Edit Reflection'} funct={reflectionHandler}/>
    </KeyboardAwareScrollView>
  );
}

EditReflectionModal.navigationOptions = ({ navigation }) => ({
    headerTitle: '',
  
    headerStyle: {
      backgroundColor: colors.background,
      elevation: 0 // remove shadow on Android
    },
  
    // cancel button
    headerLeft: () => (
      <TouchableOpacity disabled={false} activeOpacity={0.5} onPress={() => navigation.goBack()}>
        <CText style={styles.headerText}> Cancel </CText>
      </TouchableOpacity>
    ),
  
    // done button
    headerRight: () => (
      <TouchableOpacity
        activeOpacity={0.5}
        onPress={() => {
          navigation.getParam('onDone')();
          navigation.goBack();
        }}
      >
        <CText
          style={styles.headerText}
        >
          Done
        </CText>
      </TouchableOpacity>
    )
  });

const styles = StyleSheet.create({
    mainContainer: {
      backgroundColor: colors.background
    },

    headerText: {
      color: colors.blue,
      fontSize: 17,
      marginHorizontal: 16
    },
  });

export default EditReflectionModal