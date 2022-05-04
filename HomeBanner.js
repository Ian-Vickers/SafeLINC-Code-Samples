import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ImageBackground, ActivityIndicator } from 'react-native';
import CText from '../components/CText';
import colors from '../colors';

// This component loads the header image for the home screen banner based on the user's device time

/* props: time, placeholderSrc, placeholderText */

// Declare image URLs
const IMAGES = {
  morning: require('../img/Morning-Illustration.png'),
  afternoon: require('../img/Afternoon-Illustration.png'),
  evening: require('../img/Evening-Illustration.png')
};

const TIMETEXT = {
  morning: 'Good Morning',
  afternoon: 'Good Afternoon',
  evening: 'Good Evening'
};

const HomeBanner = props => {
  // If the source changes load the new image, otherwise load the placeholder
  const [currentSrc, updateSrc] = useState(props.placeholderSrc);
  const [currentText, updateText] = useState(props.placeholderText);

  // Load image and text based on the time passed from navigation
  useEffect(() => {
    if (props.time == 'morning') {
      updateSrc(IMAGES.morning);
      updateText(TIMETEXT.morning);
    }

    if (props.time == 'afternoon') {
      updateSrc(IMAGES.afternoon);
      updateText(TIMETEXT.afternoon);
    }

    if (props.time == 'evening') {
      updateSrc(IMAGES.evening);
      updateText(TIMETEXT.evening);
    }
  }, [props.time]);

  if (props.loading) {
    return (
      <View style={styles.topHeaderContainer}>
        <ImageBackground style={styles.headerImage} source={currentSrc}>
          <CText style={styles.headerText} bold>
            {currentText}
          </CText>
        </ImageBackground>

        <ActivityIndicator
          style={styles.activityStyle}
          animating={true}
          color={colors.white}
          size='large'
        />
      </View>
    );
  }
  return (
    <View style={styles.topHeaderContainer}>
      <ImageBackground style={styles.headerImage} source={currentSrc}>
        <CText style={styles.headerText} bold>
          {currentText}
        </CText>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  topHeaderContainer: {
    flex: 1
  },

  headerImage: {
    width: '100%',
    height: 153,
    margin: 0
  },

  headerText: {
    top: '125%',
    color: 'rgba(255, 255, 255, 1.0)',
    textAlign: 'left',
    fontSize: 38,
    marginLeft: '2.5%'
  },

  activityStyle: {
    position: 'absolute',
    top: '10%',
    left: '2%',
    justifyContent: 'center',
    alignContent: 'center'
  }
});

export default HomeBanner;
