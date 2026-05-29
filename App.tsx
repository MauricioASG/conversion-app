import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const QUICK_LBS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
const QUICK_KG  = [2.5, 5, 10, 15, 20, 25, 30, 40, 50];

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
  const quickValues = direction === 'lbs_to_kg' ? QUICK_LBS : QUICK_KG;

  function toggleDirection() {
    setInputValue('');
    setDirection(d => d === 'lbs_to_kg' ? 'kg_to_lbs' : 'lbs_to_kg');
  }

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.title}>Gym Converter</Text>

        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          keyboardType="decimal-pad"
          placeholder={`Ingresa ${fromUnit}`}
          placeholderTextColor="#555"
          selectionColor="#f97316"
        />

        <Text style={styles.result}>
          {result !== '' ? `${result} ${toUnit}` : '—'}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnToggle} onPress={toggleDirection}>
            <Text style={styles.btnToggleText}>{fromUnit} → {toUnit}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnClear}
            onPress={() => setInputValue('')}
          >
            <Text style={styles.btnClearText}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickScroll}
          contentContainerStyle={styles.quickContent}
        >
          {quickValues.map(val => (
            <TouchableOpacity
              key={val}
              style={[styles.quickBtn, inputValue === String(val) && styles.quickBtnActive]}
              onPress={() => setInputValue(String(val))}
            >
              <Text style={[styles.quickBtnText, inputValue === String(val) && styles.quickBtnTextActive]}>
                {val}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: RNStatusBar.currentHeight ?? 0,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 40,
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 10,
    padding: 14,
    fontSize: 22,
    color: '#fff',
    marginBottom: 20,
  },
  result: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 40,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  quickScroll: {
    marginTop: 24,
    width: '100%',
  },
  quickContent: {
    gap: 8,
    paddingHorizontal: 4,
    alignItems: 'flex-start',
  },
  quickBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  quickBtnActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  quickBtnText: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '600',
  },
  quickBtnTextActive: {
    color: '#fff',
  },
  btnToggle: {
    flex: 1,
    backgroundColor: '#f97316',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnToggleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnClear: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    alignItems: 'center',
  },
  btnClearText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
});
