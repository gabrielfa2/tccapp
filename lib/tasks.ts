import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as BackgroundTask from 'expo-background-task';
import { supabase } from './supabase';
import { Platform } from 'react-native';

const BACKGROUND_FETCH_TASK = 'background-temperature-check';

// 1. Defina a tarefa
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('[BackgroundTask] Nenhum usuário logado, pulando a verificação.');
      return BackgroundTask.Result.NoData;
    }

    const { data: campanulas, error } = await supabase
      .from('campanulas')
      .select('nome, temp_atual, temp_max, temp_min') // Adicionado temp_min
      .eq('userID', user.id);

    if (error) {
      console.error('[BackgroundTask] Erro ao buscar campânulas:', error);
      return BackgroundTask.Result.Failed;
    }

    if (campanulas && campanulas.length > 0) {
      for (const campanula of campanulas) {
        // Alerta para TEMPERATURA MÁXIMA
        if (campanula.temp_atual && campanula.temp_max && campanula.temp_atual > campanula.temp_max) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🌡️ Alerta de Temperatura Alta!',
              body: `A temperatura da sua campânula "${campanula.nome}" ultrapassou o máximo de ${campanula.temp_max}°C.`,
              sound: 'default',
            },
            trigger: null,
          });
        }

        // ---> LÓGICA ADICIONADA AQUI <---
        // Alerta para TEMPERATURA MÍNIMA
        if (campanula.temp_atual && campanula.temp_min && campanula.temp_atual < campanula.temp_min) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '❄️ Alerta de Temperatura Baixa!',
              body: `A temperatura da sua campânula "${campanula.nome}" está abaixo do mínimo de ${campanula.temp_min}°C.`,
              sound: 'default',
            },
            trigger: null,
          });
        }
        // ------------------------------------
      }
      return BackgroundTask.Result.NewData;
    }

    return BackgroundTask.Result.NoData;
  } catch (error) {
    console.error('[BackgroundTask] Erro na tarefa em segundo plano:', error);
    return BackgroundTask.Result.Failed;
  }
});

// A função de registro continua a mesma
export async function registerBackgroundTask() {
  if (Platform.OS === 'web') {
    console.log('Tarefas em segundo plano não são suportadas na web. Registro pulado.');
    return;
  }

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
