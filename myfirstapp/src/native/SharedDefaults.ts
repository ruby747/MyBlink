import { NativeModules } from 'react-native';

type SharedDefaultsModule = {
  setMemos: (json: string) => void;
};

const Native = (NativeModules as any).SharedDefaults as
  | SharedDefaultsModule
  | undefined;

export function setMemos(json: string) {
  try {
    Native?.setMemos?.(json);
  } catch (_) {
    // no-op if bridge not linked yet
  }
}

