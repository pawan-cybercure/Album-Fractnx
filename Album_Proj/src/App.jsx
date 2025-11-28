import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import MediaScreen from './screens/MediaScreen';
import FacesScreen from './screens/FacesScreen';
import {MediaProvider} from './context/MediaContext';
import {ThemeProvider} from './context/ThemeContext';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ThemeProvider>
        <MediaProvider>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name="Media" component={MediaScreen} options={{title: 'Media by Date'}} />
              <Stack.Screen name="Faces" component={FacesScreen} options={{title: 'Faces'}} />
            </Stack.Navigator>
          </NavigationContainer>
        </MediaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
};

export default App;
