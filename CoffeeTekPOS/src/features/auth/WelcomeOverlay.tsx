import React, { useEffect, useRef } from 'react';
import { 
  View, StyleSheet, Dimensions, ImageBackground, 
  Animated, PanResponder, Text 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/app.constant';
import { Images } from '../../constants/images';

interface Props {
  onDismiss: () => void;
}

export const WelcomeOverlay = ({ onDismiss }: Props) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy < -50 || Math.abs(gestureState.dy) < 10) {
          onDismiss();
        }
      },
    })
  ).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -15, duration: 800, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={styles.container} {...panResponder.panHandlers}>
      <ImageBackground source={Images.welcomeBg} style={styles.background} resizeMode="cover">
        
        <View style={styles.contentContainer}>
          
          <View style={styles.footer}>
            <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
              <MaterialCommunityIcons 
                name="chevron-double-up" 
                size={48} 
                color={Colors.white} 
                style={styles.shadowIcon}
              />
            </Animated.View>
            
            <Text style={styles.instruction}>
              Chạm hoặc lướt lên để đăng nhập
            </Text>
          </View>

        </View>
      </ImageBackground>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end', 
    alignItems: 'center',
    paddingBottom: 60,
  },
  footer: {
    alignItems: 'center',
  },
  instruction: {
    color: Colors.white,
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  shadowIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  }
});