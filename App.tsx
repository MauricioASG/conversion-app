import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'converter' | 'timer';
type Direction = 'lbs_to_kg' | 'kg_to_lbs';

// ─── Converter helpers ────────────────────────────────────────────────────────

const QUICK_LBS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
const QUICK_KG  = [2.5, 5, 10, 15, 20, 25, 30, 40, 50];

function convert(value: string, direction: Direction): string {
  const num = parseFloat(value);
  if (isNaN(num) || value.trim() === '') return '';
  const result = direction === 'lbs_to_kg'
    ? num * 0.45359237
    : num * 2.2046226218;
  return result.toFixed(2);
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ title, onMenuPress }: { title: string; onMenuPress: () => void }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress} hitSlop={12}>
        <MaterialIcons name="more-vert" size={28} color="#f97316" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Nav Menu ─────────────────────────────────────────────────────────────────

const MENU_ITEMS: { label: string; screen: Screen; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { label: 'Convertidor', screen: 'converter', icon: 'swap-horiz' },
  { label: 'Temporizador', screen: 'timer',     icon: 'timer' },
];

function NavMenu({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: Screen;
  onSelect: (s: Screen) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.screen}
              style={[
                styles.menuItem,
                i < MENU_ITEMS.length - 1 && styles.menuItemBorder,
                current === item.screen && styles.menuItemActive,
              ]}
              onPress={() => { onSelect(item.screen); onClose(); }}
            >
              <MaterialIcons
                name={item.icon}
                size={22}
                color={current === item.screen ? '#f97316' : '#aaa'}
              />
              <Text style={[styles.menuItemText, current === item.screen && styles.menuItemTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Converter Screen ─────────────────────────────────────────────────────────

function ConverterScreen() {
  const [inputValue, setInputValue] = useState('');
  const [direction, setDirection] = useState<Direction>('lbs_to_kg');

  const result      = convert(inputValue, direction);
  const fromUnit    = direction === 'lbs_to_kg' ? 'lbs' : 'kg';
  const toUnit      = direction === 'lbs_to_kg' ? 'kg' : 'lbs';
  const quickValues = direction === 'lbs_to_kg' ? QUICK_LBS : QUICK_KG;

  function toggleDirection() {
    setInputValue('');
    setDirection(d => d === 'lbs_to_kg' ? 'kg_to_lbs' : 'lbs_to_kg');
  }

  return (
    <KeyboardAvoidingView
      style={styles.screenContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        <TouchableOpacity style={styles.btnClear} onPress={() => setInputValue('')}>
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
  );
}

// ─── Timer Screen ─────────────────────────────────────────────────────────────

const PRESETS = [
  { label: '30 s',  seconds: 30 },
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
];

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function TimerScreen() {
  const [total,    setTotal]    = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running,  setRunning]  = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finished = remaining === 0;
  const progress = remaining / total;

  useEffect(() => {
    if (running && !finished) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) { setRunning(false); return 0; }
          return r - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, finished]);

  function selectPreset(seconds: number) {
    setRunning(false);
    setTotal(seconds);
    setRemaining(seconds);
  }

  function handleStartPause() {
    if (finished) return;
    setRunning(r => !r);
  }

  function handleReset() {
    setRunning(false);
    setRemaining(total);
  }

  return (
    <View style={styles.screenContainer}>
      {/* Presets */}
      <View style={styles.presetRow}>
        {PRESETS.map(p => (
          <TouchableOpacity
            key={p.seconds}
            style={[styles.presetBtn, total === p.seconds && styles.presetBtnActive]}
            onPress={() => selectPreset(p.seconds)}
          >
            <Text style={[styles.presetText, total === p.seconds && styles.presetTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ring */}
      <View style={styles.ringOuter}>
        <View
          style={[
            styles.ringInner,
            finished && styles.ringFinished,
            { opacity: 0.15 + 0.85 * progress },
          ]}
        />
        <Text style={[styles.timerDisplay, finished && styles.timerFinished]}>
          {fmt(remaining)}
        </Text>
        {finished && <Text style={styles.timerLabel}>¡Listo!</Text>}
      </View>

      {/* Controls */}
      <View style={styles.timerActions}>
        <TouchableOpacity
          style={[styles.btnToggle, finished && styles.btnDisabled]}
          onPress={handleStartPause}
          disabled={finished}
        >
          <MaterialIcons
            name={running ? 'pause' : 'play-arrow'}
            size={26}
            color="#fff"
          />
          <Text style={styles.btnToggleText}>{running ? 'Pausar' : 'Iniciar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnClear} onPress={handleReset}>
          <MaterialIcons name="replay" size={22} color="#888" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen,      setScreen]      = useState<Screen>('converter');
  const [menuVisible, setMenuVisible] = useState(false);

  const title = screen === 'converter' ? 'Convertidor' : 'Temporizador';

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />
      <Header title={title} onMenuPress={() => setMenuVisible(true)} />
      <NavMenu
        visible={menuVisible}
        current={screen}
        onSelect={setScreen}
        onClose={() => setMenuVisible(false)}
      />
      {screen === 'converter' ? <ConverterScreen /> : <TimerScreen />}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: RNStatusBar.currentHeight ?? 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f97316',
    letterSpacing: 0.5,
  },
  menuBtn: {
    padding: 4,
  },

  // Nav Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: (RNStatusBar.currentHeight ?? 0) + 56,
    paddingRight: 16,
  },
  menuCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    minWidth: 200,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  menuItemActive: {
    backgroundColor: '#1a1a1a',
  },
  menuItemText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: '#f97316',
    fontWeight: '700',
  },

  // Shared screen
  screenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  // Converter
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

  // Buttons (shared)
  btnToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f97316',
    paddingVertical: 14,
    borderRadius: 10,
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
    justifyContent: 'center',
  },
  btnClearText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.4,
  },

  // Timer
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 48,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  presetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  presetBtnActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  presetText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#fff',
  },
  ringOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    borderColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  ringInner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 110,
    backgroundColor: '#f97316',
  },
  ringFinished: {
    backgroundColor: '#22c55e',
  },
  timerDisplay: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  timerFinished: {
    color: '#22c55e',
  },
  timerLabel: {
    fontSize: 18,
    color: '#22c55e',
    fontWeight: '700',
    marginTop: 4,
  },
  timerActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});
