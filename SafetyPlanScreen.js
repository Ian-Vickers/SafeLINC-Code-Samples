import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, SectionList, TouchableOpacity } from 'react-native';
import CText from '../../components/CText';
import TitleText from './../../components/TitleText';
import SubtitleText from './../../components/SubtitleText';
import SelectableEvent from '../../components/SelectableEvent';
import SafeEnvironment from './../../components/SafeEnvironment';
import colors from '../../colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, graphqlOperation } from 'aws-amplify';
import { listEventsByYouthId, listStressorsByYouthId, listStrategiesByYouthId, listSafetyPlansByYouthId } from '../../graphql/queries';
import { createSafetyPlan, updateSafetyPlan,
         createSafetyPlanEvent, createSafetyPlanStrategy, createSafetyPlanStressor,
         updateEvent, updateStressor, updateStrategy} from '../../graphql/mutations';
import { generateUuid, escapeSpecialCharacters } from '../../utility';
import moment from 'moment';

// For filtering
import _ from 'lodash';

// This is the screen where the user can view and edit their safety plan

// Metrics from safety plan
const SAFETY_PLAN_EVENTS = [];

const SAFETY_PLAN_STRESSORS = [];

const SAFETY_PLAN_STRATEGIES = [];

// Metrics to be removed from the safety plan
const EVENTS_TO_REMOVE = [];

const STRESSORS_TO_REMOVE = [];

const STRATEGIES_TO_REMOVE = [];

// Define sections for each metric type
const FROM_SAFETY_PLAN = [
  {
    title: 'Events',
    data: SAFETY_PLAN_EVENTS
  },
  {
    title: 'Stressors',
    data: SAFETY_PLAN_STRESSORS
  },
  {
    title: 'Strategies',
    data: SAFETY_PLAN_STRATEGIES
  }
];

const SafetyPlanScreen = props => {
  const [loading, setLoading] = useState(true);
  const [updatedList, setUpdatedList] = useState(false);
  const [ID, setID] = useState('');

  let youth_id;

  // Will call this function at the end to clear current values
  const clearList = () => {
    // Safety plan metrics
    SAFETY_PLAN_EVENTS.splice(0, SAFETY_PLAN_EVENTS.length);
    SAFETY_PLAN_STRESSORS.splice(0, SAFETY_PLAN_STRESSORS.length);
    SAFETY_PLAN_STRATEGIES.splice(0, SAFETY_PLAN_STRATEGIES.length);

    // Metrics to be removed
    EVENTS_TO_REMOVE.splice(0, EVENTS_TO_REMOVE.length);
    STRESSORS_TO_REMOVE.splice(0, STRESSORS_TO_REMOVE.length);
    STRATEGIES_TO_REMOVE.splice(0, STRATEGIES_TO_REMOVE.length);
  };

  // On mount, return is on dismount
  useEffect(() => {
    setAttributes();
    props.navigation.setParams({ onDone: onDone });

    return () => {
      clearList();
    };
  }, []);

  // Once the id is retrieved, we can load the dependant metrics
  useEffect(() => {
    if(ID) loadMetrics().then(() => {
      props.navigation.setParams({ id: ID });
      setLoading(false);
      setUpdatedList(!updatedList);
    });
  }, [ID]);

  // Load metrics from database
  const loadMetrics = async () => {
    let allEvents = await API.graphql(graphqlOperation(listEventsByYouthId, { youth_id: ID }));
    allEvents = allEvents.data.listEventsByYouthID;

    // Get SAFETY_PLAN_EVENTS
    _.filter(allEvents, { is_safety_plan_metric: 1 }).forEach(item => {
      SAFETY_PLAN_EVENTS.push({
        id: item.event_id,
        text: item.name,
        icon: item.icon,
        iconColor: item.color
      });
    });

    let allStressors = await API.graphql(graphqlOperation(listStressorsByYouthId, { youth_id: ID }));
    allStressors = allStressors.data.listStressorsByYouthID;

    // Get SAFETY_PLAN_STRESSORS
    _.filter(allStressors, { is_safety_plan_metric: 1 }).forEach(item => {
      SAFETY_PLAN_STRESSORS.push({
        id: item.stressor_id,
        text: item.name,
        icon: item.icon,
        iconColor: item.color
      });
    });

    let allStrategies = await API.graphql(graphqlOperation(listStrategiesByYouthId, { youth_id: ID }));
    allStrategies = allStrategies.data.listStrategiesByYouthID;

    // Get SAFETY_PLAN_STRATEGIES
    _.filter(allStrategies, { is_safety_plan_metric: 1 }).forEach(item => {
      SAFETY_PLAN_STRATEGIES.push({
        id: item.strategy_id,
        text: item.name,
        icon: item.icon,
        iconColor: item.color
      });
    });
  }

  const setAttributes = async () => {
    try {
      setID(await AsyncStorage.getItem('@id'));
    } catch (error) {
      console.error(error);
    }

    return;
  }

  // When the user presses the 'Delete' button
  const onDelete = (id) => {
    let index;
    
    // Check if the metric is an event
    index = SAFETY_PLAN_EVENTS.findIndex(item => item.id === id);
    // If index is > -1 then it exists in the array
    if (index > -1) {
      // Put the metric being removed into EVENTS_TO_REMOVE
      EVENTS_TO_REMOVE.push(SAFETY_PLAN_EVENTS[index]);

      // Remove the metric from the SAFETY_PLAN_EVENTS array
      SAFETY_PLAN_EVENTS.splice(index, 1);

      // Let our list know it needs to update by toggling the update var
      setUpdatedList(!updatedList);

      return;
    }
    
    // Check if the metric is a stressor
    index = SAFETY_PLAN_STRESSORS.findIndex(item => item.id === id);
    if (index > -1) {
      // Put the metric being removed into SAFETY_PLAN_STRESSORS
      STRESSORS_TO_REMOVE.push(SAFETY_PLAN_STRESSORS[index]);

      // Remove the metric from the SAFETY_PLAN_EVENTS array
      SAFETY_PLAN_STRESSORS.splice(index, 1);

      // Let our list know it needs to update by toggling the update var
      setUpdatedList(!updatedList);

      return;
    }

    // Check if the metric is a strategy
    index = SAFETY_PLAN_STRATEGIES.findIndex(item => item.id === id);
    if (index > -1) {
      // Put the metric being removed into STRATEGIES_TO_REMOVE
      STRATEGIES_TO_REMOVE.push(SAFETY_PLAN_STRATEGIES[index]);

      // Remove the metric from the SAFETY_PLAN_EVENTS array
      SAFETY_PLAN_STRATEGIES.splice(index, 1);

      // Let our list know it needs to update by toggling the update var
      setUpdatedList(!updatedList);

      return;
    }
  };

  const onDone = async (id) => {
    // If there are no metrics to remove -> no change needs to be made
    if (EVENTS_TO_REMOVE.length < 0 &&
        STRESSORS_TO_REMOVE.length == 0 &&
        STRATEGIES_TO_REMOVE.length == 0) {
        return;
      }

    setLoading(true);

    // If there are any metrics to remove, we need to make a new safety plan entry
    let res = await API.graphql(
      graphqlOperation(listSafetyPlansByYouthId, { 
        youth_id: id 
      })
    );
    const currentSafetyPlan = _.filter(res.data.listSafetyPlansByYouthID, { is_current: 1 });

    let count = currentSafetyPlan[0].num_edited;
    count += 1;

    // Update out of date safety plan to have is_current of 0
    API.graphql(
      graphqlOperation(updateSafetyPlan, {
        updateSafetyPlanInput: {
          safety_plan_id: currentSafetyPlan[0].safety_plan_id,
          is_current: 0
        }
      })
    );

    // Create new safety plan entry
    const newCurrentSafetyPlan = currentSafetyPlan[0];
    const newSafetyPlanId = generateUuid();

    newCurrentSafetyPlan.is_current = 1;
    newCurrentSafetyPlan.completed_at = moment();
    newCurrentSafetyPlan.safety_plan_id = newSafetyPlanId;
    newCurrentSafetyPlan.num_edited = count;
    newCurrentSafetyPlan.reflection = escapeSpecialCharacters(currentSafetyPlan[0].reflection);
    newCurrentSafetyPlan.safe_env_plan = escapeSpecialCharacters(
      currentSafetyPlan[0].safe_env_plan
    );
    
    // Create new safety plan
    const safePlanResult = await API.graphql(
      graphqlOperation(createSafetyPlan, { createSafetyPlanInput: newCurrentSafetyPlan })
    );

    // Add remaining safety plan metrics to join tables
    // Events
    SAFETY_PLAN_EVENTS.forEach(event => {
      API.graphql(
        graphqlOperation(createSafetyPlanEvent, {
          createSafetyPlanEventInput: {
            safety_plan_id: newSafetyPlanId,
            event_id: event.id
          }
        })
      );
    });

    // Stressors
    SAFETY_PLAN_STRESSORS.forEach(stressor => {
      API.graphql(
        graphqlOperation(createSafetyPlanStressor, {
          createSafetyPlanStressorInput: {
            safety_plan_id: newSafetyPlanId,
            stressor_id: stressor.id
          }
        })
      );
    });

    // Strategies
    SAFETY_PLAN_STRATEGIES.forEach(strategy => {
      API.graphql(
        graphqlOperation(createSafetyPlanStrategy, {
          createSafetyPlanStrategyInput: {
            safety_plan_id: newSafetyPlanId,
            strategy_id: strategy.id
          }
        })
      );
    })

    // Edit any removed metrics to have is_safety_plan_metric of 0
    // Events
    if (EVENTS_TO_REMOVE.length > 0) {
      EVENTS_TO_REMOVE.forEach(event => {
        API.graphql(
          graphqlOperation(updateEvent, {
            updateEventInput: {
              event_id: event.id,
              is_safety_plan_metric: 0
            }
          })
        );
      });
    }

    // Stressors
    if (STRESSORS_TO_REMOVE.length > 0) {
      STRESSORS_TO_REMOVE.forEach(stressor => {
        API.graphql(
          graphqlOperation(updateStressor, {
            updateStressorInput: {
              stressor_id: stressor.id,
              is_safety_plan_metric: 0
            }
          })
        );
      })
    }

    // Strategies
    if (STRATEGIES_TO_REMOVE.length > 0) {
      STRATEGIES_TO_REMOVE.forEach(strategy => {
        API.graphql(
          graphqlOperation(updateStrategy, {
            updateStrategyInput: {
              strategy_id: strategy.id,
              is_safety_plan_metric: 0
            }
          })
        );
      })
    }

    props.navigation.goBack();

    return;
  }

  // Create each item based on the values passed from renderItem
  const Item = ({ text, icon, iconColor, id }) => {
    return (
      <View style={styles.item}>
        <SelectableEvent
          icon={icon}
          text={text}
          iconColor={iconColor}
          id={id}
          deletable
          unselectable
          onDelete={onDelete}
        />
      </View>
    );
  };

  // Passing the values from each item in SAFETY_PLAN_EVENTS, SAFETY_PLAN_STRESSORS and SAFETY_PLAN_STRATEGIES
  const renderItem = ({ item }) => (
    <Item
      text={item.text}
      icon={item.icon}
      iconColor={item.iconColor}
      id={item.id}
    />
  );

  // Rendering section category name on top of each section
  const renderSectionHeader = ({ section }) => (
    section.data.length > 0 ? 
      <CText style={styles.text}> {section.title} </CText>
      : null
  );

  // Everything above the list
  const getHeader = () => {
    return (
      <View style={styles.header}>
        <TitleText title='Safety Plan' />

        <SubtitleText title='These are the items currently in your Safety Plan. Swipe left to remove an item.' />
      </View>
    );
  };

  // Everything below the list
  const getFooter = () => {
    return (
      <View>
        <SafeEnvironment
          youth_id={ID}
        />
      </View>
    );
  };

  if (!loading) {
    return (
      <View style={styles.mainContainer}>
        <SectionList
          contentContainerStyle={styles.list}
          sections={FROM_SAFETY_PLAN}
          keyExtractor={(item, index) => item + index}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={getHeader}
          ListFooterComponent={getFooter}
          extraData={updatedList}
          initialNumToRender={30}
        />
      </View>
    );
  } else {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={colors.blue} />
      </View>
    );
  }
};

SafetyPlanScreen.navigationOptions = ({ navigation }) => ({
  headerShown: true,
  headerTitle: '',

  headerRight: () => (
    <TouchableOpacity
      activeOpacity={0.5}
      onPress={() => {
        navigation.getParam('onDone')(navigation.getParam('id'));
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
    backgroundColor: colors.background,
    flex: 1
  },

  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    marginVertical: '50%'
  },

  list: {
    marginBottom: 84
  },

  text: {
    fontSize: 20,
    marginLeft: 24,
    marginTop: 34
  },

  headerText: {
    color: colors.blue,
    fontSize: 17,
    marginHorizontal: 16
  },

  header: {
    marginBottom: -24
  }
});

export default SafetyPlanScreen;