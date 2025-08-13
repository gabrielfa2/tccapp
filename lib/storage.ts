import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalCampanula {
  nome: string;
  codigo: string;
}

const STORAGE_KEY = 'campanulas_local';

export const getLocalCampanulas = async (): Promise<LocalCampanula[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading local campanulas:', error);
    return [];
  }
};

export const saveLocalCampanulas = async (campanulas: LocalCampanula[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(campanulas));
  } catch (error) {
    console.error('Error saving local campanulas:', error);
  }
};

export const addLocalCampanula = async (campanula: LocalCampanula): Promise<void> => {
  const campanulas = await getLocalCampanulas();
  campanulas.push(campanula);
  await saveLocalCampanulas(campanulas);
};

export const removeLocalCampanula = async (codigo: string): Promise<void> => {
  const campanulas = await getLocalCampanulas();
  const filtered = campanulas.filter(c => c.codigo !== codigo);
  await saveLocalCampanulas(filtered);
};