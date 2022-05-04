import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import CText from './CText';
import colors from '../colors';
import { API, graphqlOperation } from 'aws-amplify';
import { listSafetyPlansByYouthId } from '../graphql/queries';
import { updateSafetyPlan } from '../graphql/mutations';
import { escapeSpecialCharacters } from './../utility';

// import filter for getting newest safety plan
import _ from 'lodash';

/* props to pass: youth_id, navigation */

const Reflection = props => {

  const youth_id = props.youth_id;

  const [reflection, setReflection] = useState('');
  const [safetyPlanId, setSafetyPlanId] = useState('');
  const [update, setUpdate] = useState(false);
  let reflectionToChange = '';

  const getReflection = async () => {
    const res = await API.graphql(graphqlOperation(listSafetyPlansByYouthId, { youth_id }));

    setReflection(_.filter(res.data.listSafetyPlansByYouthID, { is_current: 1 })[0].reflection);
    setSafetyPlanId(_.filter(res.data.listSafetyPlansByYouthID, { is_current: 1 })[0].safety_plan_id);
  }

  const onDone = async () => {

    const input = {
      safety_plan_id: safetyPlanId,
      reflection: escapeSpecialCharacters(reflectionToChange)
    }
    
    if (reflectionToChange !== '')
      await API.graphql(graphqlOperation(updateSafetyPlan, { updateSafetyPlanInput: input }))

    setUpdate(!update);
  };

  const updateReflection = (enteredText) => {
    reflectionToChange = enteredText;
  };

  const editButtonHandler = () => {
    props.navigation.navigate('EditReflection', {youth_id:youth_id, content:reflection, onDone:onDone, updateReflection:updateReflection});
  };

  useEffect(() => {
    if (props.youth_id !== '') getReflection();
  }, [props.youth_id, update]);

  return (
    <>
      <View style={styles.reflectionHeader}>
        <CText style={styles.sectionHeaderText} bold>
          LINC to Life Statement
        </CText>
        <TouchableOpacity onPress={editButtonHandler} style={styles.buttonStyle}>
          <CText style={styles.editText}>Edit</CText>
        </TouchableOpacity>
      </View>
      <CText style={styles.reflectionText}>{reflection}</CText>
    </>
  );
};

const styles = StyleSheet.create({
  sectionHeaderText: {
    fontSize: 20
  },

  reflectionHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignContent: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 20
  },

  reflectionText: {
    fontSize: 17,
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom:24
  },

  editText: {
    color: colors.blue,
    fontSize: 17
  }
});

export default Reflection;
