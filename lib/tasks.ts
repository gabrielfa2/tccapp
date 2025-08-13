import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as BackgroundTask from 'expo-background-task';
import { supabase } from './supabase';
import { Platform } from 'react-native'; // Importe o Platform

const BACKGROUND_FETCH_TASK = 'background-temperature-check';

// A definição da tarefa continua a mesma
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  // ... (toda a lógica da tarefa que já fizemos)
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('[BackgroundTask] Nenhum usuário logado, pulando a verificação.');
      return BackgroundTask.Result.NoData;
    }

    const { data: campanulas, error } = await supabase
      .from('campanulas')
      .select('nome, temp_atual, temp_max')
      .eq('userID', user.id);

    if (error) {
      console.error('[BackgroundTask] Erro ao buscar campânulas:', error);
      return BackgroundTask.Result.Failed;
    }

    if (campanulas && campanulas.length > 0) {
      for (const campanula of campanulas) {
        if (campanula.temp_atual && campanula.temp_max && campanula.temp_atual > campanula.temp_max) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🌡️ Alerta de Temperatura!',
              body: `A temperatura da sua campânula "${campanula.nome}" ultrapassou o máximo de ${campanula.temp_max}°C.`,
              sound: 'default',
            },
            trigger: null,
          });
        }
      }
      return BackgroundTask.Result.NewData;
    }

    return BackgroundTask.Result.NoData;
  } catch (error) {
    console.error('[BackgroundTask] Erro na tarefa em segundo plano:', error);
    return BackgroundTask.Result.Failed;
  }
});

// A função de registro agora verifica a plataforma
export async function registerBackgroundTask() {
  // ---> AQUI ESTÁ A CORREÇÃO <---
  // Se a plataforma for 'web', não fazemos nada.
  if (Platform.OS === 'web') {
    console.log('Tarefas em segundo plano não são suportadas na web. Registro pulado.');
    return;
  }
  // ---------------------------------

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) {
      console.log('[BackgroundTask] A tarefa já está registrada.');
      return;
    }

    await BackgroundTask.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('[BackgroundTask] Tarefa registrada com sucesso.');
  } catch (error) {
    console.error('[BackgroundTask] Erro ao registrar a tarefa:', error);
  }
}