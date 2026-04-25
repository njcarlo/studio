import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface AnimatedCounterProps {
    value: number;
    fontSize?: number;
    color?: string;
    formatNumber?: boolean;
}

/**
 * A YouTube-style animated digit counter.
 * Each digit flips up individually when the value changes.
 */
export default function AnimatedCounter({
    value,
    fontSize = 36,
    color = '#ffffff',
    formatNumber = true,
}: AnimatedCounterProps) {
    const displayValue = formatNumber ? value.toLocaleString() : String(value);
    const digits = displayValue.split('');

    return (
        <View style={styles.row}>
            {digits.map((char, i) => (
                char === ',' ? (
                    <Text key={`sep-${i}`} style={[styles.separator, { fontSize, color }]}>,</Text>
                ) : (
                    <AnimatedDigit key={`${i}-${char}`} digit={char} fontSize={fontSize} color={color} />
                )
            ))}
        </View>
    );
}

interface AnimatedDigitProps {
    digit: string;
    fontSize: number;
    color: string;
}

function AnimatedDigit({ digit, fontSize, color }: AnimatedDigitProps) {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const prevDigit = useRef(digit);

    useEffect(() => {
        if (prevDigit.current === digit) return;
        prevDigit.current = digit;

        // Animate out the old digit upward and fade in the new one
        translateY.setValue(0);
        opacity.setValue(1);

        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -fontSize * 0.8,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start(() => {
            translateY.setValue(fontSize * 0.8);
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    speed: 20,
                    bounciness: 8,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    }, [digit]);

    const charWidth = fontSize * 0.62;
    const charHeight = fontSize * 1.5;

    return (
        <View style={[styles.digitContainer, { width: charWidth, height: charHeight }]}>
            <Animated.Text
                style={[
                    styles.digit,
                    { fontSize, color, transform: [{ translateY }], opacity },
                ]}
            >
                {digit}
            </Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    digitContainer: {
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    digit: {
        fontVariant: ['tabular-nums'],
    },
    separator: {
        paddingBottom: 2,
    },
});
