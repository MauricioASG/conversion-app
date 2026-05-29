import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Direction = 'lbs_to_kg' | 'kg_to_lbs';

function convert(value: string, direction: Direction): string {
  const num = parseFloat(value);
  if (isNaN(num) || value.trim() === '') return '';
  const result = direction === 'lbs_to_kg'
    ? num * 0.45359237
    : num * 2.2046226218;
  return result.toFixed(2);
}

export default function App() {
  const [inputValue, setInputValue] = useState('');
  const [direction, setDirection] = useState<Direction>('lbs_to_kg');

  const result = convert(inputValue, direction);
  const fromUnit = direction === 'lbs_to_kg' ? 'lbs' : 'kg';
  const toUnit = direction === 'lbs_to_kg' ? 'kg' : 'lbs';

  function toggleDirection() {
    setInputValue('');
    setDirection(d => d === 'lbs_to_kg' ? 'kg_to_lbs' : 'lbs_to_kg');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gym Converter</Text>

      <TextInput
        style={styles.input}
        value={inputValue}
        onChangeText={setInputValue}
        keyboardType="decimal-pad"
        placeholder={`Ingresa ${fromUnit}`}
        placeholderTextColor="#888"
      />

      <Text style={styles.result}>
        {result !== '' ? `${result} ${toUnit}` : '—'}
      </Text>

      <TouchableOpacity style={styles.button} onPress={toggleDirection}>
        <Text style={styles.buttonText}>{fromUnit} → {toUnit}</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 20,
    marginBottom: 16,
  },
  result: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#f97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
