import { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import {
  FlatList,
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

// ─── WheelPicker ──────────────────────────────────────────────────────────────

const WHEEL_SIDE = 2;

type WheelPickerProps = {
  selectedIndex: number;
  options: string[];
  onChange: (index: number) => void;
  itemHeight?: number;
  containerStyle?: object;
  itemTextStyle?: object;
  selectedIndicatorStyle?: object;
  decelerationRate?: 'fast' | 'normal';
};

function WheelPicker({
  selectedIndex,
  options,
  onChange,
  itemHeight = 40,
  containerStyle,
  itemTextStyle,
  selectedIndicatorStyle,
  decelerationRate = 'fast',
}: WheelPickerProps) {
  const ref = useRef<FlatList<string | null>>(null);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const lastReported = useRef(selectedIndex);

  const containerHeight = (1 + WHEEL_SIDE * 2) * itemHeight;

  const paddedOptions = useMemo<(string | null)[]>(() => [
    ...Array<null>(WHEEL_SIDE).fill(null),
    ...options,
    ...Array<null>(WHEEL_SIDE).fill(null),
  ], [options]);

  useEffect(() => {
    ref.current?.scrollToIndex({ index: selectedIndex, animated: false });
    setActiveIndex(selectedIndex);
    lastReported.current = selectedIndex;
  }, [selectedIndex]);

  function onScrollSettle(e: { nativeEvent: { contentOffset: { y: number } } }) {
    const idx = Math.max(0, Math.min(
      Math.round(e.nativeEvent.contentOffset.y / itemHeight),
      options.length - 1,
    ));
    setActiveIndex(idx);
    if (idx !== lastReported.current) {
      lastReported.current = idx;
      onChange(idx);
    }
  }

  return (
    <View style={[{ height: containerHeight, overflow: 'hidden' }, containerStyle]}>
      <View
        pointerEvents="none"
        style={[
          { position: 'absolute', top: WHEEL_SIDE * itemHeight, height: itemHeight, left: 0, right: 0 },
          selectedIndicatorStyle,
        ]}
      />
      <FlatList
        ref={ref}
        data={paddedOptions}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate={decelerationRate}
        onMomentumScrollEnd={onScrollSettle}
        onScrollEndDrag={onScrollSettle}
        initialScrollIndex={selectedIndex}
        getItemLayout={(_, i) => ({ length: itemHeight, offset: itemHeight * i, index: i })}
        extraData={activeIndex}
        renderItem={({ item, index }) => {
          const dist = Math.abs(index - WHEEL_SIDE - activeIndex);
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.4 : 0.12;
          return (
            <View style={{ height: itemHeight, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={[itemTextStyle, { opacity }]}>{item ?? ''}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'converter' | 'timer';
type Direction = 'lbs_to_kg' | 'kg_to_lbs';

// ─── Converter helpers ────────────────────────────────────────────────────────

const QUICK_LBS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
const QUICK_KG = [2.5, 5, 10, 15, 20, 25, 30, 40, 50];

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
  { label: 'Temporizador', screen: 'timer', icon: 'timer' },
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

  const result = convert(inputValue, direction);
  const fromUnit = direction === 'lbs_to_kg' ? 'lbs' : 'kg';
  const toUnit = direction === 'lbs_to_kg' ? 'kg' : 'lbs';
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
  { label: '30 s', seconds: 30 },
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

const MINUTE_OPTS = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));
const SECOND_OPTS = Array.from({ length: 60 },  (_, i) => String(i).padStart(2, '0'));

function TimerScreen() {
  const [minuteIdx, setMinuteIdx] = useState(1);
  const [secondIdx, setSecondIdx] = useState(0);
  const [total,     setTotal]     = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running,   setRunning]   = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  // Estado local del picker — aislado hasta presionar "Listo"
  const [pickerMin, setPickerMin] = useState(1);
  const [pickerSec, setPickerSec] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finished = remaining === 0;
  const progress  = remaining / total;

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

  function openPicker() {
    if (running) return;
    // Sincroniza el picker con el tiempo actual antes de abrir
    setPickerMin(minuteIdx);
    setPickerSec(secondIdx);
    setPickerVisible(true);
  }

  function handlePickerConfirm() {
    const secs = pickerMin * 60 + pickerSec;
    if (secs > 0) {
      setMinuteIdx(pickerMin);
      setSecondIdx(pickerSec);
      setTotal(secs);
      setRemaining(secs);
      setRunning(false);
    }
    setPickerVisible(false);
  }

  function selectPreset(seconds: number) {
    setRunning(false);
    setMinuteIdx(Math.floor(seconds / 60));
    setSecondIdx(seconds % 60);
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
    <View style={styles.timerContainer}>
      {/* Preset carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.timerPresetScroll}
        contentContainerStyle={styles.quickContent}
      >
        {PRESETS.map(p => (
          <TouchableOpacity
            key={p.seconds}
            style={[styles.quickBtn, total === p.seconds && styles.quickBtnActive]}
            onPress={() => selectPreset(p.seconds)}
          >
            <Text style={[styles.quickBtnText, total === p.seconds && styles.quickBtnTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Wheel picker modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          {/* Backdrop independiente — toca para cancelar sin aplicar cambios */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPickerVisible(false)} />
          {/* Card sin vínculo al backdrop */}
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Selecciona el tiempo</Text>
            {/* Render condicional: fuerza desmonte/remonte en cada apertura del modal
                para que WheelPicker inicialice su animación de opacidad desde cero */}
            {pickerVisible && (
              <View style={styles.wheelRow}>
                <View style={styles.wheelLabelCol}>
                  <WheelPicker
                    selectedIndex={pickerMin}
                    options={MINUTE_OPTS}
                    onChange={setPickerMin}
                    itemHeight={52}
                    itemTextStyle={styles.wheelText}
                    containerStyle={styles.wheelContainer}
                    selectedIndicatorStyle={styles.wheelIndicator}
                    decelerationRate="fast"
                  />
                  <Text style={styles.wheelLabel}>min</Text>
                </View>
                <Text style={styles.timeColon}>:</Text>
                <View style={styles.wheelLabelCol}>
                  <WheelPicker
                    selectedIndex={pickerSec}
                    options={SECOND_OPTS}
                    onChange={setPickerSec}
                    itemHeight={52}
                    itemTextStyle={styles.wheelText}
                    containerStyle={styles.wheelContainer}
                    selectedIndicatorStyle={styles.wheelIndicator}
                    decelerationRate="fast"
                  />
                  <Text style={styles.wheelLabel}>seg</Text>
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.pickerConfirm} onPress={handlePickerConfirm}>
              <Text style={styles.pickerConfirmText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.timerBody}>
        {/* Ring — toca para editar el tiempo */}
        <TouchableOpacity activeOpacity={running ? 1 : 0.7} onPress={openPicker}>
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
            {finished
              ? <Text style={styles.timerLabel}>¡Listo!</Text>
              : !running && <Text style={styles.ringHint}>toca para editar</Text>
            }
          </View>
        </TouchableOpacity>

        {/* Controls */}
        <View style={styles.timerActions}>
          <TouchableOpacity
            style={[styles.btnToggle, finished && styles.btnDisabled]}
            onPress={handleStartPause}
            disabled={finished}
          >
            <MaterialIcons name={running ? 'pause' : 'play-arrow'} size={26} color="#fff" />
            <Text style={styles.btnToggleText}>{running ? 'Pausar' : 'Iniciar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnClear} onPress={handleReset}>
            <MaterialIcons name="replay" size={22} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('converter');
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

  // Timer — layout
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 100,
  },
  timerPresetScroll: {
    width: '100%',
    flexGrow: 0,
  },
  timerBody: {
    paddingBottom: 30,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 20,
  },

  // Timer — picker modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    minWidth: 280,
  },
  pickerTitle: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  pickerConfirm: {
    marginTop: 20,
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 10,
  },
  pickerConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Timer — wheel picker
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wheelLabelCol: {
    alignItems: 'center',
    gap: 6,
  },
  wheelLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  wheelContainer: {
    width: 88,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
  },
  wheelIndicator: {
    backgroundColor: 'rgba(249,115,22,0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f97316',
  },
  wheelText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  timeColon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f97316',
    marginHorizontal: 4,
    marginBottom: 24,
  },
  ringHint: {
    color: '#f9731666',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
    letterSpacing: 0.3,
  },

  // Timer — ring
  ringOuter: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 4,
    borderColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 105,
    backgroundColor: '#f97316',
  },
  ringFinished: {
    backgroundColor: '#22c55e',
  },
  timerDisplay: {
    fontSize: 52,
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
