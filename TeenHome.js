import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import moment from 'moment';
import colors from '../../../colors';
import { Auth, API, graphqlOperation } from 'aws-amplify';
import {
  listCheckInsByYouthId,
  listStressorsByCheckInId,
  listEventsByCheckInId
} from '../../../graphql/queries';
import CText from '../../../components/CText';
import HomeBanner from '../../../components/HomeBanner';
import Reflection from '../../../components/Reflection';
import InputFieldButton from '../../../components/InputFieldButton';
import CompletionButton from '../../../components/CompletionButton';
import BigButton from './../../../components/BigButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCheckInWeek } from '../../../utility';
import SuggestionDisplay from '../../../components/SuggestionDisplay';

// this is the home screen where the user can check in and see their progress

/* props: */

const TeenHome = props => {
  /* Functions */
  const [isComplete, setComplete] = useState(true);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Check In');
  const [subtitle, setSubtitle] = useState('You last checked in at...');
  const [time, setTime] = useState('morning');
  const [message, setMessage] = useState('...');
  const [support, setSupport] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [youthID, setYouthID] = useState('');

  const handleClick = async () => {
    props.navigation.navigate('CheckIn1', { ID: youthID });
  };

  const handleHelp = () => {
    props.navigation.navigate('Help');
  };

  // Takes in an array of check ins and returns an array where the 1st element is the # of stressors reported
  // and the 2nd element is the # of events reported
  const getNumMetrics = async checkIns => {
    let numStressors = 0;
    let numEvents = 0;

    for (const checkIn of checkIns) {
      const checkinID = checkIn.check_in_id;

      const stressorRes = await API.graphql(
        graphqlOperation(listStressorsByCheckInId, { check_in_id: checkinID })
      );
      const eventRes = await API.graphql(
        graphqlOperation(listEventsByCheckInId, { check_in_id: checkinID })
      );

      const stressorInc = stressorRes.data.listStressorsByCheckInId.length;
      const eventsInc = eventRes.data.listEventsByCheckInId.length;

      numStressors += stressorInc;
      numEvents += eventsInc;
    }

    return Promise.all([numStressors, numEvents]);
  };

  /**
   * @param {moment} date
   * @description Updates the HomeBanner component to display the correct
   *              image/message based on the device's time of day
   */
  const getTime = date => {
    const hour = date.clone().format('H');

    // Morning: between 6 am and 12 pm
    if (hour >= 6 && hour < 12) {
      setTime('morning');
    }

    // Afternoon: between 12 pm and 7 pm
    if (hour >= 12 && hour < 19) {
      setTime('afternoon');
    }

    // Evening: between 7 pm and 6 am
    if ((hour >= 19 && hour <= 23) || (hour >= 0 && hour < 6)) {
      setTime('evening');
    }
  };

  /**
   * @param {moment} date
   * @param {youth_id: String} ID
   * @description Queries the DB to retreive the users check ins, passes that off to update
   *              components that rely on that information
   */
  const updateComponents = async (date, ID) => {
    const res = await API.graphql(graphqlOperation(listCheckInsByYouthId, { youth_id: ID }));
    const checkIns = res.data.listCheckInsByYouthId;

    await updateSuggestion(date, checkIns, ID);
    await updateCheckInButton(date, checkIns);
  };

  /**
   *
   * @param {moment} date
   * @param {Object[]} checkIns
   * @description Updates the SuggestionDisplay component based on metrics the user has reported
   *              and when their last check in was
   */
  const updateSuggestion = async (date, checkIns, ID) => {
    // If at least 1 check in exists
    if (checkIns.length > 0) {
      // Get the latest check in
      const lastCheckIn = checkIns[0].completed_at;
      const lastCheckInDate = moment(lastCheckIn);

      // Get how many days its been since last check in
      const diff = date.diff(lastCheckInDate, 'day');

      // Get last week of check ins
      const checkInWeek = getCheckInWeek(checkIns);

      // Store how many stressors and events were reported over the last week
      const [numStressors, numEvents] = await getNumMetrics(checkInWeek);

      // If user reported more than 7 stressors or 2 events this last week
      // TODO: bold the number of stressors and evens
      if (numStressors >= 8 || numEvents >= 1) {
        setSupport(true);

        // Both criteria
        if (numStressors >= 8 && numEvents >= 1) {
          setMessage(
            'You reported ' +
              numStressors +
              ' daily stressors and ' +
              numEvents +
              ' major life events this past week. Try reaching out for support or doing something to help yourself feel better.'
          );
        }
        // Only stressors
        else if (numStressors >= 7) {
          setMessage(
            'You reported ' +
              numStressors +
              ' daily stressors this past week. Try reaching out for support or doing something to help yourself feel better.'
          );
        }
        // Only events
        else if (numEvents >= 2) {
          setMessage(
            'You reported ' +
              numEvents +
              ' major life events this past week. Try reaching out for support or doing something to help yourself feel better.'
          );
        }
      }

      // If the last check in was more than 3 days ago
      else if (diff > 3) {
        setMessage(
          'Your last check in was ' + diff + ' days ago. Check in today to start a streak!'
        );
        setSupport(false);
      }

      // If the last check in was today
      else if (diff < 1) {
        setMessage('Thanks for checking in today!');
        setSupport(false);
      }
      // Last check in was less than 3 days ago and user hasn't reported many stressors/events
      else {
        setMessage('Welcome back 👋. Remember to check in today!');
        setSupport(false);
      }
    }
    // No check ins exist
    else {
      setMessage(
        'Welcome to SafeLINC! Here you can find helpful insights and suggestions to help yourself feel better.'
      );
      setSupport(false);
    }

    return;
  };

  /**
   * @param {moment} date - current time generated by moment()
   * @param {Object[]} checkIns - 
   * @description Updates the CompletionButton component based on when the user last checked in
   */
  const updateCheckInButton = async (date, checkIns) => {
    // If at least one check in exists
    if (checkIns.length > 0) {
      const lastCheckIn = checkIns[0].completed_at;
      const lastCheckInDate = moment(lastCheckIn);

      const day = date.clone().startOf('day');
      const lastCheckInDay = lastCheckInDate.clone().startOf('day');

      const diff = day.diff(lastCheckInDay, 'day');
      const diffTime = lastCheckInDate.format('h:mm A');

      // If the last check in was today
      if (diff < 1) {
        setComplete(true);
        setTitle('Checked In');
        setSubtitle('You checked in at ' + diffTime);
      }
      // If the last check in was yesterday
      else if (diff === 1) {
        setComplete(false);
        setTitle('Check In Today');
        setSubtitle('You last checked in yesterday');
      }
      // If the last check in was more than a day ago
      else {
        setComplete(false);
        setTitle('Check In Today');
        setSubtitle('You last checked in ' + diff + ' days ago');
      }
    }
    // No check ins exist
    else {
      setComplete(false);
      setTitle('Check In Today');
      setSubtitle('Complete your first check in');
    }

    return;
  };

  async function firstRender() {
    const ID = await AsyncStorage.getItem('@id');
    setFirstName(await AsyncStorage.getItem('@firstName'));
    setYouthID(ID);

    const date = moment();
    getTime(date);

    await updateComponents(date, ID);

    setLoading(false);
  }

  // Fires on first render, creates a focus listener that will be destroyed if we leave the TeenTabNavigator
  useEffect(() => {
    setLoading(true);

    firstRender();

    const focusListener = props.navigation.addListener('didFocus', async () => {
      setLoading(true);

      const ID = await AsyncStorage.getItem('@id');
      setFirstName(await AsyncStorage.getItem('@firstName'));
      setYouthID(ID);

      const date = moment();
      getTime(date);

      await updateComponents(date, ID);

      setLoading(false);
    });

    return () => {
      focusListener.remove();
    };
  }, []);

  /* Components */
  return (
    <ScrollView style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <HomeBanner
          placeholderSrc={require('../../../img/Morning-Illustration.png')}
          placeholderText={'Good Morning'}
          time={time}
          loading={loading}
        ></HomeBanner>

        <View style={styles.middleHeaderContainer}>
          <CompletionButton
            title={title}
            subtitle={subtitle}
            funct={handleClick}
            complete={isComplete}
          />
        </View>

        <View style={styles.bottomHeaderContainer}>
          <BigButton title={'I Need Help'} funct={handleHelp} dropdown></BigButton>
        </View>
      </View>

      <View style={styles.middleContainer}>
        <View style={styles.greetingContainer}>
          <CText bold style={styles.bigText}>
            {firstName},
          </CText>
          <SuggestionDisplay
            placeholder='...'
            message={message}
            support={support}
            loading={loading}
            navigation={props.navigation}
          />
        </View>

        <View style={styles.progressContainer}>
          <CText bold style={styles.bigText}>
            Your Progress
          </CText>

          <InputFieldButton
            tagless
            icon={'warning'}
            text={'Major Life Events'}
            iconColor={colors.orange}
            onPress={() => props.navigation.navigate('MajorLifeEvents', { ID: youthID })}
          ></InputFieldButton>

          <InputFieldButton
            tagless
            icon={'av_timer'}
            text={'Daily Stressors'}
            iconColor={colors.blue}
            onPress={() => props.navigation.navigate('DailyStressors', { ID: youthID })}
          ></InputFieldButton>

          <InputFieldButton
            tagless
            icon={'favorite_border'}
            text={'Coping Strategies'}
            iconColor={colors.red}
            onPress={() => props.navigation.navigate('CopingStrategies', { ID: youthID })}
          ></InputFieldButton>
        </View>

        <View>
          <Reflection youth_id={youthID} navigation={props.navigation} />
        </View>
      </View>

      
    </ScrollView>
  );
};

TeenHome.navigationOptions = {
  headerTitle: '',
  headerShown: false
};

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: colors.background
  },

  headerContainer: {
    flex: 1,
    flexDirection: 'column',
    marginBottom: '-10%'
  },

  middleHeaderContainer: {
    flex: 1,
    top: '-10%',
    width: '100%',
    alignSelf: 'center'
  },

  bottomHeaderContainer: {
    flex: 1,
    top: '-10%',
    width: '100%',
    alignSelf: 'center'
  },

  middleContainer: {
    flex: 1,
    flexDirection: 'column'
  },

  greetingContainer: {
    flex: 1,
    flexDirection: 'column',
    marginHorizontal: 24,
    marginVertical: 16
  },

  progressContainer: {
    flex: 1,
    flexDirection: 'column',
    marginHorizontal: 24,
    marginBottom: 48,
    marginTop: 32
  },

  bigText: {
    fontSize: 20,
    color: colors.black
  }
});

export default TeenHome;
